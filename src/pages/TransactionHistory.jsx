"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  getMyTransactions,
  updateTransactionStatus,
  getTransactionById,
  cancelTransaction,
  uploadPaymentProof,
} from "../api"
import toast from "react-hot-toast"
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  CreditCardIcon,
  ReceiptRefundIcon,
  EyeIcon,
} from "@heroicons/react/24/outline"
import Modal from "../components/admin/Modal"
import PlaceholderImage from "../components/PlaceholderImage"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { formatDistanceToNow, isPast, parseISO, addHours } from "date-fns"
import { id } from "date-fns/locale"

// Create shared storage keys for transaction data
const TRANSACTION_STORAGE_KEY = "userTransactions"
const PAYMENT_PROOFS_KEY = "uploadedPaymentProofs"
const CART_TRANSACTIONS_KEY = "cartTransactions"
const CHECKOUT_TRANSACTIONS_KEY = "checkoutTransactions"

const TransactionHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState(null)
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [manualRefresh, setManualRefresh] = useState(0)
  const [countdowns, setCountdowns] = useState({})
  const itemsPerPage = 6
  const [highlightedTransaction, setHighlightedTransaction] = useState(null)

  // Upload modal state
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadingTransaction, setUploadingTransaction] = useState(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadPreview, setUploadPreview] = useState(null)

  // Add a function to integrate with localStorage for fallback data
  const getLocalStorageTransactions = () => {
    try {
      const storedTransactions = localStorage.getItem(TRANSACTION_STORAGE_KEY)
      if (storedTransactions) {
        return JSON.parse(storedTransactions)
      }
    } catch (error) {
      console.error("Error reading transactions from localStorage:", error)
    }
    return []
  }

  // Function to save transactions to localStorage
  const saveTransactionsToLocalStorage = (transactions) => {
    try {
      localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions))
    } catch (error) {
      console.error("Error saving transactions to localStorage:", error)
    }
  }

  // Handle opening the upload modal
  const handleOpenUploadModal = (transaction) => {
    setUploadingTransaction(transaction)
    setUploadFile(null)
    setUploadPreview(null)
    setIsUploadModalOpen(true)
  }

  // Handle closing the upload modal
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    setUploadingTransaction(null)
    setUploadFile(null)
    setUploadPreview(null)
  }

  // Handle file selection for payment proof
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPG, JPEG, PNG, GIF)")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB")
        return
      }

      setUploadFile(file)
      setUploadPreview(URL.createObjectURL(file))
    }
  }

  // Handle payment proof submission
  const handleSubmitPaymentProof = async () => {
    if (!uploadFile || !uploadingTransaction) return

    await handleUploadPaymentProof(uploadingTransaction, uploadFile)
    handleCloseUploadModal()
  }

  // Add a function to handle transaction cancellation by the user
  const handleCancelTransaction = async () => {
    if (!currentTransaction) return

    try {
      setSubmitting(true)
      toast.loading("Cancelling transaction...", { id: "cancel-transaction" })

      // Call the API to cancel the transaction
      try {
        await cancelTransaction(currentTransaction.id, { reason: cancelReason })
      } catch (apiError) {
        console.error("API error when cancelling transaction:", apiError)
        // Continue with local cancellation even if API fails
      }

      // Update local state for immediate UI update
      const updatedTransactions = transactions.map((t) =>
        t.id === currentTransaction.id ? { ...t, status: "cancelled" } : t,
      )

      setTransactions(updatedTransactions)
      saveTransactionsToLocalStorage(updatedTransactions)

      toast.success("Transaction cancelled successfully", { id: "cancel-transaction" })

      // Close the cancel modal
      setIsCancelModalOpen(false)
      setCurrentTransaction(null)
      setCancelReason("")

      // Refresh to ensure we have the latest data
      fetchTransactions()
    } catch (error) {
      console.error("Error cancelling transaction:", error)
      toast.error("Failed to cancel transaction", { id: "cancel-transaction" })
    } finally {
      setSubmitting(false)
    }
  }

  // Add a function to check if a transaction is cancellable by the user
  const isTransactionCancellable = (transaction) => {
    return ["pending", "hold"].includes(transaction.status)
  }

  // Add a function to get a more detailed status description
  const getStatusDescription = (status) => {
    switch (status) {
      case "pending":
        return "Your payment is pending. Please upload your payment proof to proceed with this transaction."
      case "hold":
        return "Your payment proof has been received and is being processed. Please wait for admin verification."
      case "paid":
        return "Your payment is being verified by our admin team. This usually takes 1-2 business days."
      case "completed":
        return "Your transaction has been completed successfully. Thank you for your purchase!"
      case "cancelled":
        return "This transaction has been cancelled by you. If you've made a payment, please contact support."
      case "refunded":
        return "This transaction has been refunded by admin. The refund may take 3-5 business days to appear in your account."
      default:
        return "Status information not available."
    }
  }

  // Enhanced fetchTransactions function with better integration
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)

      // Try to fetch from API first
      let processedTransactions = []
      try {
        const response = await getMyTransactions()
        console.log("Transactions fetched from API:", response.data)
        processedTransactions = response.data.data || []

        // Store in localStorage as backup
        if (processedTransactions.length > 0) {
          saveTransactionsToLocalStorage(processedTransactions)
        }
      } catch (apiError) {
        console.error("Error fetching transactions from API:", apiError)

        // Fallback to localStorage if API fails
        const localTransactions = getLocalStorageTransactions()
        console.log("Falling back to localStorage transactions:", localTransactions)
        processedTransactions = localTransactions
      }

      // Check for transactions in sessionStorage (from cart checkout)
      try {
        const cartTransactions = sessionStorage.getItem(CART_TRANSACTIONS_KEY)
        if (cartTransactions) {
          const parsedCartTransactions = JSON.parse(cartTransactions)
          console.log("Found cart transactions:", parsedCartTransactions)

          // Add any cart transactions that aren't already in our list
          if (Array.isArray(parsedCartTransactions)) {
            parsedCartTransactions.forEach((cartTransaction) => {
              if (!processedTransactions.some((t) => t.id === cartTransaction.id)) {
                processedTransactions.push(cartTransaction)
              }
            })
          } else if (parsedCartTransactions && !processedTransactions.some((t) => t.id === parsedCartTransactions.id)) {
            processedTransactions.push(parsedCartTransactions)
          }
        }
      } catch (storageError) {
        console.error("Error checking sessionStorage for cart transactions:", storageError)
      }

      // Check for transactions in localStorage (from checkout)
      try {
        const checkoutTransactions = localStorage.getItem(CHECKOUT_TRANSACTIONS_KEY)
        if (checkoutTransactions) {
          const parsedCheckoutTransactions = JSON.parse(checkoutTransactions)
          console.log("Found checkout transactions:", parsedCheckoutTransactions)

          // Add any checkout transactions that aren't already in our list
          if (Array.isArray(parsedCheckoutTransactions)) {
            parsedCheckoutTransactions.forEach((checkoutTransaction) => {
              if (!processedTransactions.some((t) => t.id === checkoutTransaction.id)) {
                processedTransactions.push(checkoutTransaction)
              } else {
                // Update existing transaction with checkout data if needed
                processedTransactions = processedTransactions.map((t) => {
                  if (t.id === checkoutTransaction.id) {
                    // Preserve payment proof and status if they exist
                    const paymentProofUrl = t.paymentProofUrl || checkoutTransaction.paymentProofUrl
                    const status = paymentProofUrl ? "hold" : "pending"

                    return {
                      ...checkoutTransaction,
                      paymentProofUrl,
                      status,
                    }
                  }
                  return t
                })
              }
            })
          } else if (
            parsedCheckoutTransactions &&
            !processedTransactions.some((t) => t.id === parsedCheckoutTransactions.id)
          ) {
            processedTransactions.push(parsedCheckoutTransactions)
          }
        }
      } catch (storageError) {
        console.error("Error checking localStorage for checkout transactions:", storageError)
      }

      // Check URL for transactionId parameter (for direct navigation from cart)
      const urlParams = new URLSearchParams(location.search)
      const highlightTransactionId = urlParams.get("transactionId")

      // Check for any transactions in localStorage that might have been updated elsewhere
      try {
        const uploadedProofs = localStorage.getItem(PAYMENT_PROOFS_KEY)
        if (uploadedProofs) {
          const parsedProofs = JSON.parse(uploadedProofs)

          // Update transactions with uploaded payment proofs
          processedTransactions = processedTransactions.map((transaction) => {
            const uploadedProof = parsedProofs.find((p) => p.transactionId === transaction.id)
            if (uploadedProof && (!transaction.paymentProofUrl || transaction.status === "pending")) {
              return {
                ...transaction,
                paymentProofUrl: uploadedProof.proofUrl,
                status: "hold",
                updatedAt: uploadedProof.timestamp || new Date().toISOString(),
              }
            }
            return transaction
          })
        }
      } catch (error) {
        console.error("Error checking for uploaded payment proofs:", error)
      }

      // Enhance transactions with additional data if needed
      processedTransactions = processedTransactions.map((transaction) => {
        // If transaction is missing user info, add it from current user
        if (!transaction.user && user) {
          transaction.user = {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        }

        // Ensure status is set correctly based on payment proof
        if (!transaction.status) {
          transaction.status = transaction.paymentProofUrl ? "hold" : "pending"
        }

        // If this is the transaction we should highlight, mark it
        if (highlightTransactionId && transaction.id === highlightTransactionId) {
          transaction.highlight = true
          setHighlightedTransaction(transaction.id)
        }

        return transaction
      })

      // Initialize countdowns for pending transactions
      setTransactions(processedTransactions)
      setLastRefreshed(new Date())

      // Handle countdowns in a separate effect to avoid the circular dependency
      processedTransactions.forEach((transaction) => {
        if (transaction.status === "pending" && !countdowns[transaction.id]) {
          // Calculate deadline (48 hours from creation)
          const createdAt = new Date(transaction.createdAt)
          const deadline = addHours(createdAt, 48) // 48 hours from creation

          setCountdowns((prev) => ({
            ...prev,
            [transaction.id]: deadline,
          }))
        }
      })

      // Save the processed transactions to localStorage for future reference
      saveTransactionsToLocalStorage(processedTransactions)

      // If there's a highlighted transaction, open its details after a short delay
      if (highlightTransactionId) {
        const transaction = processedTransactions.find((t) => t.id === highlightTransactionId)
        if (transaction) {
          setTimeout(() => {
            handleOpenViewModal(transaction)
          }, 500)
        }
      }
    } catch (error) {
      console.error("Error in fetchTransactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }, [user, countdowns, location.search])

  // Add a function to handle payment proof upload directly from the transaction history page
  const handleUploadPaymentProof = async (transaction, file) => {
    if (!file || !transaction) return

    try {
      setSubmitting(true)
      toast.loading("Uploading payment proof...", { id: "upload-payment" })

      // Create form data for API upload
      const formData = new FormData()
      formData.append("proof", file)

      // Try to upload to the API first
      let uploadSuccess = false
      let proofUrl = ""

      try {
        const response = await uploadPaymentProof(transaction.id, formData)
        console.log("Payment proof upload API response:", response)

        if (response && response.data) {
          uploadSuccess = true
          // If the API returns a URL, use it
          if (response.data.data && response.data.data.proofUrl) {
            proofUrl = response.data.data.proofUrl
          }
        }
      } catch (apiError) {
        console.error("API error when uploading payment proof:", apiError)
        // Continue with local handling even if API fails
      }

      // If API didn't provide a URL, create a local one
      if (!proofUrl) {
        proofUrl = URL.createObjectURL(file)
      }

      // Update the transaction status
      const updatedTransaction = {
        ...transaction,
        status: "hold", // Change to "hold" when payment proof is uploaded
        paymentProofUrl: proofUrl,
        updatedAt: new Date().toISOString(),
      }

      // Update the transactions list
      const updatedTransactions = transactions.map((t) => (t.id === transaction.id ? updatedTransaction : t))

      setTransactions(updatedTransactions)
      saveTransactionsToLocalStorage(updatedTransactions)

      // Also store in a separate localStorage key for tracking uploaded proofs
      try {
        const existingProofs = localStorage.getItem(PAYMENT_PROOFS_KEY)
        const proofs = existingProofs ? JSON.parse(existingProofs) : []

        // Add this proof if it doesn't exist
        if (!proofs.some((p) => p.transactionId === transaction.id)) {
          proofs.push({
            transactionId: transaction.id,
            proofUrl: proofUrl,
            timestamp: new Date().toISOString(),
          })

          localStorage.setItem(PAYMENT_PROOFS_KEY, JSON.stringify(proofs))
        }

        // Also update the checkout transactions if this came from checkout
        const checkoutTransactions = localStorage.getItem(CHECKOUT_TRANSACTIONS_KEY)
        if (checkoutTransactions) {
          try {
            const parsedCheckoutTransactions = JSON.parse(checkoutTransactions)

            // If it's an array, update the matching transaction
            if (Array.isArray(parsedCheckoutTransactions)) {
              const updatedCheckoutTransactions = parsedCheckoutTransactions.map((t) =>
                t.id === transaction.id ? { ...t, status: "hold", paymentProofUrl: proofUrl } : t,
              )
              localStorage.setItem(CHECKOUT_TRANSACTIONS_KEY, JSON.stringify(updatedCheckoutTransactions))
            }
            // If it's a single transaction object
            else if (parsedCheckoutTransactions && parsedCheckoutTransactions.id === transaction.id) {
              parsedCheckoutTransactions.status = "hold"
              parsedCheckoutTransactions.paymentProofUrl = proofUrl
              localStorage.setItem(CHECKOUT_TRANSACTIONS_KEY, JSON.stringify(parsedCheckoutTransactions))
            }
          } catch (checkoutError) {
            console.error("Error updating checkout transactions:", checkoutError)
          }
        }

        // Also update the cart transactions if this came from cart
        const cartTransactions = sessionStorage.getItem(CART_TRANSACTIONS_KEY)
        if (cartTransactions) {
          try {
            const parsedCartTransactions = JSON.parse(cartTransactions)

            // If it's an array, update the matching transaction
            if (Array.isArray(parsedCartTransactions)) {
              const updatedCartTransactions = parsedCartTransactions.map((t) =>
                t.id === transaction.id ? { ...t, status: "hold", paymentProofUrl: proofUrl } : t,
              )
              sessionStorage.setItem(CART_TRANSACTIONS_KEY, JSON.stringify(updatedCartTransactions))
            }
            // If it's a single transaction object
            else if (parsedCartTransactions && parsedCartTransactions.id === transaction.id) {
              parsedCartTransactions.status = "hold"
              parsedCartTransactions.paymentProofUrl = proofUrl
              sessionStorage.setItem(CART_TRANSACTIONS_KEY, JSON.stringify(parsedCartTransactions))
            }
          } catch (cartError) {
            console.error("Error updating cart transactions:", cartError)
          }
        }
      } catch (error) {
        console.error("Error storing uploaded proof:", error)
      }

      toast.success("Payment proof uploaded successfully", { id: "upload-payment" })

      // Trigger a custom event to notify other components
      const paymentEvent = new CustomEvent("paymentProofUploaded", {
        detail: { transactionId: transaction.id },
      })
      window.dispatchEvent(paymentEvent)
    } catch (error) {
      console.error("Error uploading payment proof:", error)
      toast.error("Failed to upload payment proof", { id: "upload-payment" })
    } finally {
      setSubmitting(false)
    }
  }

  // Add a useEffect to listen for storage events (for real-time updates from cart)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (
        e.key === CART_TRANSACTIONS_KEY ||
        e.key === TRANSACTION_STORAGE_KEY ||
        e.key === PAYMENT_PROOFS_KEY ||
        e.key === CHECKOUT_TRANSACTIONS_KEY
      ) {
        console.log("Storage changed, refreshing transactions")
        fetchTransactions()
      }
    }

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange)

    // Listen for custom payment proof uploaded event
    const handlePaymentProofUploaded = () => {
      console.log("Payment proof uploaded event received")
      fetchTransactions()
    }

    window.addEventListener("paymentProofUploaded", handlePaymentProofUploaded)

    // Listen for custom checkout completed event
    const handleCheckoutCompleted = (event) => {
      console.log("Checkout completed event received", event.detail)
      fetchTransactions()
    }

    window.addEventListener("checkoutCompleted", handleCheckoutCompleted)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("paymentProofUploaded", handlePaymentProofUploaded)
      window.removeEventListener("checkoutCompleted", handleCheckoutCompleted)
    }
  }, [fetchTransactions])

  // IMPROVED: Less frequent auto-refresh to avoid UI disruption
  useEffect(() => {
    fetchTransactions()

    // Reduced auto-refresh frequency from 30s to 2 minutes to avoid UI disruption
    const intervalTime = 120000 // 2 minutes
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing transactions (every 2 minutes)")
      fetchTransactions()
    }, intervalTime)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [fetchTransactions, manualRefresh])

  // Update countdowns every second
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      const now = new Date()
      const updatedCountdowns = { ...countdowns }
      let hasChanges = false

      Object.keys(updatedCountdowns).forEach((transactionId) => {
        if (updatedCountdowns[transactionId] && now > updatedCountdowns[transactionId]) {
          // Time's up - could trigger an action here or just update UI
          console.log(`Time's up for transaction ${transactionId}`)
          // We keep the deadline to show "Expired" in the UI
          hasChanges = true
        }
      })

      if (hasChanges) {
        setCountdowns(updatedCountdowns)
      }
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [countdowns])

  // Add this new effect to handle initial loading state
  useEffect(() => {
    // Set loading to false after a reasonable timeout if it's still true
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 10000) // 10 seconds timeout

    return () => clearTimeout(loadingTimeout)
  }, [loading])

  // Add a useEffect to check for transactionId in URL params on initial load
  useEffect(() => {
    // Check URL for transactionId parameter (for direct navigation from cart)
    const urlParams = new URLSearchParams(location.search)
    const highlightTransactionId = urlParams.get("transactionId")

    if (highlightTransactionId && transactions.length > 0) {
      const transaction = transactions.find((t) => t.id === highlightTransactionId)
      if (transaction) {
        // Scroll to the transaction if possible
        const element = document.getElementById(`transaction-${highlightTransactionId}`)
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          // Add a highlight effect
          element.classList.add("highlight-animation")
        }
      }
    }
  }, [transactions, location.search])

  const handleManualRefresh = () => {
    setManualRefresh((prev) => prev + 1)
    toast.success("Refreshing transactions...")
  }

  const handleOpenViewModal = async (transaction) => {
    try {
      // Fetch detailed transaction data if needed
      let detailedTransaction = null
      try {
        const response = await getTransactionById(transaction.id)
        detailedTransaction = response.data.data
      } catch (error) {
        console.error("Error fetching transaction details:", error)
        // Fall back to the transaction data we already have
        detailedTransaction = transaction
      }

      // Ensure payment proof status is correct
      if (detailedTransaction.paymentProofUrl && detailedTransaction.status === "pending") {
        detailedTransaction.status = "hold"
      }

      setCurrentTransaction(detailedTransaction || transaction)
      setIsViewModalOpen(true)
    } catch (error) {
      console.error("Error in handleOpenViewModal:", error)
      // Fall back to the transaction data we already have
      setCurrentTransaction(transaction)
      setIsViewModalOpen(true)
    }
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setCurrentTransaction(null)
  }

  const handleOpenUpdateStatusModal = (transaction) => {
    setCurrentTransaction(transaction)
    setNewStatus(transaction.status)
    setIsUpdateStatusModalOpen(true)
  }

  const handleCloseUpdateStatusModal = () => {
    setIsUpdateStatusModalOpen(false)
    setCurrentTransaction(null)
  }

  const handleOpenCancelModal = (transaction) => {
    setCurrentTransaction(transaction)
    setIsCancelModalOpen(true)
  }

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false)
    setCurrentTransaction(null)
    setCancelReason("")
  }

  const handleUpdateStatus = async () => {
    if (!currentTransaction) return

    try {
      setSubmitting(true)
      await updateTransactionStatus(currentTransaction.id, { status: newStatus })
      toast.success("Transaction status updated successfully")

      // Update local state for immediate UI update
      const updatedTransactions = transactions.map((t) =>
        t.id === currentTransaction.id ? { ...t, status: newStatus } : t,
      )

      setTransactions(updatedTransactions)
      saveTransactionsToLocalStorage(updatedTransactions)

      // Refresh to ensure we have the latest data
      fetchTransactions()
      handleCloseUpdateStatusModal()
    } catch (error) {
      console.error("Error updating transaction status:", error)
      toast.error("Failed to update transaction status")
    } finally {
      setSubmitting(false)
    }
  }

  // Filter transactions based on search term and status
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.activity?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5 // Show at most 5 page numbers

    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than the max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(maxPagesToShow - 1, totalPages - 1)
        for (let i = 2; i <= endPage; i++) {
          pageNumbers.push(i)
        }
      }
      // Adjust if we're near the end
      else if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - (maxPagesToShow - 2))
        for (let i = startPage; i <= totalPages - 1; i++) {
          pageNumbers.push(i)
        }
      }
      // We're in the middle
      else {
        // Add ellipsis if needed
        if (startPage > 2) {
          pageNumbers.push("...")
        }

        // Add middle pages
        for (let i = startPage; i <= endPage; i++) {
          pageNumbers.push(i)
        }

        // Add ellipsis if needed
        if (endPage < totalPages - 1) {
          pageNumbers.push("...")
        }
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Helper function to get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "hold":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-indigo-100 text-indigo-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Helper function to get status display name
  const getStatusDisplayName = (status) => {
    switch (status) {
      case "pending":
        return "Pending Payment"
      case "hold":
        return "Processing Payment"
      case "paid":
        return "Payment Verification"
      case "completed":
        return "Completed"
      case "cancelled":
        return "Cancelled by User"
      case "refunded":
        return "Refunded by Admin"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <ClockIcon className="h-4 w-4 mr-1" />
      case "hold":
        return <ArrowPathIcon className="h-4 w-4 mr-1" />
      case "paid":
        return <CreditCardIcon className="h-4 w-4 mr-1" />
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 mr-1" />
      case "cancelled":
        return <XCircleIcon className="h-4 w-4 mr-1" />
      case "refunded":
        return <ReceiptRefundIcon className="h-4 w-4 mr-1" />
      default:
        return null
    }
  }

  // Check if a transaction has a new payment proof (for highlighting)
  const isNewPaymentProof = (transaction) => {
    if (!transaction.paymentProofUrl) return false

    // Consider a payment proof as "new" if it was uploaded in the last 24 hours
    const proofDate = new Date(transaction.updatedAt)
    const now = new Date()
    const hoursDiff = (now - proofDate) / (1000 * 60 * 60)

    return hoursDiff < 24
  }

  // Format countdown time remaining
  const formatTimeRemaining = (deadline) => {
    if (!deadline) return "No deadline"

    const now = new Date()
    if (now > deadline) return "Expired"

    const diffMs = deadline - now
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHrs}h ${diffMins}m remaining`
  }

  // Modify the getActionButton function to include the direct upload option
  const getActionButton = (transaction) => {
    switch (transaction.status) {
      case "pending":
        return (
          <div className="flex space-x-2">
            <Link
              to={`/cart?transactionId=${transaction.id}`}
              className="px-3 py-1 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] text-sm inline-flex items-center"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
              Pay Now
            </Link>
            <button
              onClick={() => handleOpenUploadModal(transaction)}
              className="px-3 py-1 border border-[#FF7757] text-[#FF7757] rounded-md hover:bg-orange-50 text-sm inline-flex items-center"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
              Upload Proof
            </button>
          </div>
        )
      case "hold":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm inline-flex items-center">
            <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
            Processing
          </span>
        )
      case "paid":
        return (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-md text-sm inline-flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            Awaiting Verification
          </span>
        )
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm inline-flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  // Get the total quantity from transaction details
  const getTotalQuantity = (transaction) => {
    if (transaction.transactionDetails && transaction.transactionDetails.length > 0) {
      return transaction.transactionDetails.reduce((total, item) => total + item.quantity, 0)
    }
    return transaction.quantity || 1
  }

  // Status definitions with colors and descriptions
  const statusConfig = {
    pending: {
      label: "Menunggu Pembayaran",
      color: "bg-yellow-100 text-yellow-800",
      icon: <ClockIcon className="w-5 h-5 mr-1" />,
      description: "Silahkan upload bukti pembayaran",
    },
    hold: {
      label: "Diproses",
      color: "bg-blue-100 text-blue-800",
      icon: <ArrowPathIcon className="w-5 h-5 mr-1 animate-spin" />,
      description: "Bukti pembayaran sedang diproses admin",
    },
    paid: {
      label: "Dibayar",
      color: "bg-indigo-100 text-indigo-800",
      icon: <CreditCardIcon className="w-5 h-5 mr-1" />,
      description: "Menunggu verifikasi admin",
    },
    completed: {
      label: "Selesai",
      color: "bg-green-100 text-green-800",
      icon: <CheckCircleIcon className="w-5 h-5 mr-1" />,
      description: "Transaksi telah selesai",
    },
    cancelled: {
      label: "Dibatalkan",
      color: "bg-red-100 text-red-800",
      icon: <XCircleIcon className="w-5 h-5 mr-1" />,
      description: "Dibatalkan oleh pembeli",
    },
    refunded: {
      label: "Dikembalikan",
      color: "bg-gray-100 text-gray-800",
      icon: <ExclamationCircleIcon className="w-5 h-5 mr-1" />,
      description: "Dibatalkan oleh admin",
    },
  }

  // Format currency to Indonesian Rupiah
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate time remaining for payment
  const getTimeRemaining = (deadline) => {
    if (!deadline) return null

    const deadlineDate = parseISO(deadline)

    if (isPast(deadlineDate)) {
      return { expired: true, text: "Batas waktu pembayaran telah berakhir" }
    }

    const timeRemaining = formatDistanceToNow(deadlineDate, {
      addSuffix: true,
      locale: id,
    })

    return { expired: false, text: `Batas pembayaran ${timeRemaining}` }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <ArrowPathIcon className="w-12 h-12 text-blue-500 animate-spin" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Loading transaction history...</h2>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        @keyframes highlight {
          0% { background-color: rgba(255, 119, 87, 0.3); }
          50% { background-color: rgba(255, 119, 87, 0.1); }
          100% { background-color: transparent; }
        }
        
        .highlight-animation {
          animation: highlight 2s ease-in-out;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50 pt-20 pb-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Transaction History</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
              <button
                onClick={handleManualRefresh}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                title="Refresh transactions"
              >
                <ArrowPathIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by ID, activity or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              {/* Status filter */}
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Payment</option>
                  <option value="hold">Processing</option>
                  <option value="paid">Payment Verification</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            {filteredTransactions.filter((t) => t.status === "pending").length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-md shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      You have {filteredTransactions.filter((t) => t.status === "pending").length} pending payment
                      {filteredTransactions.filter((t) => t.status === "pending").length > 1 ? "s" : ""}
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>Please complete your payment to avoid automatic cancellation after the payment deadline.</p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <Link
                          to="/cart"
                          className="rounded-md bg-amber-50 px-2 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-amber-50"
                        >
                          Go to Cart
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && transactions.length === 0 ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-gray-100 rounded-lg h-24 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No transactions found.</p>
                    <p className="text-gray-400 mt-2">Your transaction history will appear here.</p>
                    <Link
                      to="/"
                      className="mt-4 inline-block px-4 py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] transition-colors"
                    >
                      Browse Activities
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="block md:hidden space-y-4">
                      {currentTransactions.map((transaction) => (
                        <div
                          id={`transaction-${transaction.id}`}
                          key={transaction.id}
                          className={`bg-white border rounded-lg shadow-sm overflow-hidden ${
                            transaction.id === highlightedTransaction ? "highlight-animation" : ""
                          } ${
                            transaction.status === "pending"
                              ? "border-l-4 border-l-amber-500"
                              : transaction.status === "hold"
                                ? "border-l-4 border-l-blue-500"
                                : transaction.status === "paid"
                                  ? "border-l-4 border-l-indigo-500"
                                  : transaction.status === "completed"
                                    ? "border-l-4 border-l-green-500"
                                    : transaction.status === "cancelled"
                                      ? "border-l-4 border-l-red-500"
                                      : ""
                          } ${isNewPaymentProof(transaction) && user?.role === "admin" ? "ring-2 ring-blue-400" : ""}`}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusBadgeClass(transaction.status)}`}
                              >
                                {getStatusIcon(transaction.status)}
                                {getStatusDisplayName(transaction.status)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center mb-3">
                              <div className="w-12 h-12 rounded-md overflow-hidden mr-3">
                                {transaction.activity?.imageUrls?.[0] ? (
                                  <img
                                    src={transaction.activity.imageUrls[0] || "/placeholder.svg"}
                                    alt={transaction.activity.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = "none"
                                      e.target.nextSibling.style.display = "flex"
                                    }}
                                  />
                                ) : (
                                  <PlaceholderImage
                                    text={transaction.activity?.title?.charAt(0) || "T"}
                                    className="w-full h-full"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium line-clamp-1">
                                  {transaction.activity?.title || "Unknown Activity"}
                                </h3>
                                <p className="text-sm text-gray-500 truncate">
                                  ID: {transaction.id.substring(0, 8)}...
                                </p>
                                <div className="flex items-center mt-1">
                                  <span className="text-xs text-gray-600 mr-2">Qty:</span>
                                  <span className="text-xs font-medium">{getTotalQuantity(transaction)}</span>
                                </div>
                                {transaction.status === "pending" && countdowns[transaction.id] && (
                                  <p className="text-xs text-orange-600 font-medium mt-1 flex items-center">
                                    <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{formatTimeRemaining(countdowns[transaction.id])}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <span className="font-bold text-lg">Rp{transaction.amount?.toLocaleString() || "0"}</span>
                              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                {transaction.status === "pending" ? (
                                  <>
                                    <Link
                                      to={`/cart?transactionId=${transaction.id}`}
                                      className="px-3 py-1 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] text-sm inline-flex items-center"
                                    >
                                      <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                                      Pay Now
                                    </Link>
                                    <button
                                      onClick={() => handleOpenUploadModal(transaction)}
                                      className="px-3 py-1 border border-[#FF7757] text-[#FF7757] rounded-md hover:bg-orange-50 text-sm inline-flex items-center"
                                    >
                                      <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                                      Upload
                                    </button>
                                  </>
                                ) : (
                                  getActionButton(transaction)
                                )}
                                <button
                                  onClick={() => handleOpenViewModal(transaction)}
                                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm inline-flex items-center"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View
                                </button>
                                {isTransactionCancellable(transaction) && (
                                  <button
                                    onClick={() => handleOpenCancelModal(transaction)}
                                    className="px-3 py-1 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm inline-flex items-center"
                                  >
                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>

                            {isNewPaymentProof(transaction) && user?.role === "admin" && (
                              <div className="mt-2 text-xs text-blue-600 font-medium">New payment proof uploaded</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Transaction ID
                            </th>
                            <th
                              scope="col"
                              className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Activity
                            </th>
                            <th
                              scope="col"
                              className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Date
                            </th>
                            <th
                              scope="col"
                              className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Qty
                            </th>
                            <th
                              scope="col"
                              className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Amount
                            </th>
                            <th
                              scope="col"
                              className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Status
                            </th>
                            <th
                              scope="col"
                              className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Payment
                            </th>
                            <th
                              scope="col"
                              className="px-3 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentTransactions.map((transaction) => (
                            <tr
                              id={`transaction-${transaction.id}`}
                              key={transaction.id}
                              className={`hover:bg-gray-50 ${
                                transaction.id === highlightedTransaction ? "highlight-animation" : ""
                              } ${
                                transaction.status === "pending"
                                  ? "bg-amber-50"
                                  : isNewPaymentProof(transaction) && user?.role === "admin"
                                    ? "bg-blue-50"
                                    : ""
                              }`}
                            >
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>
                                  {transaction.id.substring(0, 8)}...
                                  {transaction.status === "pending" && countdowns[transaction.id] && (
                                    <p className="text-xs text-orange-600 font-medium mt-1 flex items-center">
                                      <ClockIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">
                                        {formatTimeRemaining(countdowns[transaction.id])}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-md overflow-hidden">
                                    {transaction.activity?.imageUrls?.[0] ? (
                                      <img
                                        src={transaction.activity.imageUrls[0] || "/placeholder.svg"}
                                        alt={transaction.activity.title}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = "none"
                                          e.target.nextSibling.style.display = "flex"
                                        }}
                                      />
                                    ) : (
                                      <PlaceholderImage
                                        text={transaction.activity?.title?.charAt(0) || "T"}
                                        className="h-full w-full"
                                      />
                                    )}
                                  </div>
                                  <div className="ml-2 md:ml-4">
                                    <div className="text-xs md:text-sm font-medium text-gray-900 line-clamp-1">
                                      {transaction.activity?.title || "Unknown Activity"}
                                    </div>
                                    <div className="text-xs text-gray-500 hidden md:block">
                                      {transaction.activity?.city}, {transaction.activity?.province}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                                {getTotalQuantity(transaction)}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                                Rp{transaction.amount?.toLocaleString() || "0"}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(transaction.status)}`}
                                >
                                  {getStatusIcon(transaction.status)}
                                  <span className="hidden sm:inline">{getStatusDisplayName(transaction.status)}</span>
                                  <span className="sm:hidden">
                                    {transaction.status === "pending"
                                      ? "Pending"
                                      : transaction.status === "hold"
                                        ? "Process"
                                        : transaction.status === "paid"
                                          ? "Paid"
                                          : transaction.status === "completed"
                                            ? "Done"
                                            : transaction.status === "cancelled"
                                              ? "Cancel"
                                              : transaction.status === "refunded"
                                                ? "Refund"
                                                : transaction.status}
                                  </span>
                                </span>
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                                {transaction.paymentProofUrl ? (
                                  <span className="text-green-600 font-medium flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                      ></path>
                                    </svg>
                                    {isNewPaymentProof(transaction) && user?.role === "admin" ? "New" : "Yes"}
                                  </span>
                                ) : (
                                  <span className="text-red-500 flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                      ></path>
                                    </svg>
                                    <span className="hidden sm:inline">Not uploaded</span>
                                    <span className="sm:hidden">No</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-right text-xs md:text-sm font-medium">
                                <div className="flex flex-col md:flex-row justify-end gap-1 md:gap-2">
                                  {transaction.status === "pending" && (
                                    <div className="flex gap-1 justify-end">
                                      <Link
                                        to={`/cart?transactionId=${transaction.id}`}
                                        className="text-white bg-[#FF7757] hover:bg-[#ff6242] px-2 md:px-3 py-1 rounded-md inline-flex items-center text-xs"
                                      >
                                        <ArrowUpTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                        <span className="hidden sm:inline">Pay Now</span>
                                        <span className="sm:hidden">Pay</span>
                                      </Link>
                                      <button
                                        onClick={() => handleOpenUploadModal(transaction)}
                                        className="text-[#FF7757] border border-[#FF7757] hover:bg-orange-50 px-2 md:px-3 py-1 rounded-md inline-flex items-center text-xs"
                                      >
                                        <ArrowUpTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                        <span className="hidden sm:inline">Upload</span>
                                        <span className="sm:hidden">Up</span>
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex gap-1 justify-end">
                                    {isTransactionCancellable(transaction) && (
                                      <button
                                        onClick={() => handleOpenCancelModal(transaction)}
                                        className="text-red-600 hover:text-red-900 border border-red-200 px-2 py-1 rounded text-xs"
                                      >
                                        <span className="hidden sm:inline">Cancel</span>
                                        <XCircleIcon className="h-3 w-3 sm:hidden" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleOpenViewModal(transaction)}
                                      className="text-indigo-600 hover:text-indigo-900 inline-flex items-center border border-indigo-200 px-2 py-1 rounded text-xs"
                                    >
                                      <EyeIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                      <span className="hidden sm:inline">View</span>
                                    </button>
                                    {user?.role === "admin" && (
                                      <button
                                        onClick={() => handleOpenUpdateStatusModal(transaction)}
                                        className="text-blue-600 hover:text-blue-900 border border-blue-200 px-2 py-1 rounded text-xs"
                                      >
                                        <span className="hidden sm:inline">Update</span>
                                        <ArrowPathIcon className="h-3 w-3 sm:hidden" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="px-2 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                          <div className="mb-4 sm:mb-0">
                            <p className="text-xs sm:text-sm text-gray-700">
                              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                              <span className="font-medium">{Math.min(endIndex, filteredTransactions.length)}</span> of{" "}
                              <span className="font-medium">{filteredTransactions.length}</span> results
                            </p>
                          </div>
                          <div>
                            <nav
                              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                              aria-label="Pagination"
                            >
                              <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-1 sm:px-2 py-1 sm:py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Previous</span>
                                <svg
                                  className="h-4 w-4 sm:h-5 sm:w-5"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>

                              {getPageNumbers().map((pageNum, index) =>
                                pageNum === "..." ? (
                                  <span
                                    key={`ellipsis-${index}`}
                                    className="relative inline-flex items-center px-1 sm:px-4 py-1 sm:py-2 border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700"
                                  >
                                    ...
                                  </span>
                                ) : (
                                  <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`relative inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 border text-xs sm:text-sm font-medium ${
                                      currentPage === pageNum
                                        ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                ),
                              )}

                              <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-1 sm:px-2 py-1 sm:py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="sr-only">Next</span>
                                <svg
                                  className="h-4 w-4 sm:h-5 sm:w-5"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Transaction Details">
          {currentTransaction && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Transaction Header with Status */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <h2 className="text-sm sm:text-lg font-semibold text-gray-800 mb-2 md:mb-0 break-all">
                  Transaction ID: {currentTransaction.id}
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center ${getStatusBadgeClass(currentTransaction.status)}`}
                >
                  {getStatusIcon(currentTransaction.status)}
                  {getStatusDisplayName(currentTransaction.status)}
                </span>
              </div>

              {/* Activity Details */}
              <div className="flex items-start sm:items-center border-b pb-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-md overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                  {currentTransaction.activity?.imageUrls?.[0] ? (
                    <img
                      src={currentTransaction.activity.imageUrls[0] || "/placeholder.svg"}
                      alt={currentTransaction.activity.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none"
                        e.target.nextSibling.style.display = "flex"
                      }}
                    />
                  ) : (
                    <PlaceholderImage
                      text={currentTransaction.activity?.title?.charAt(0) || "T"}
                      className="w-full h-full"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base break-words">
                    {currentTransaction.activity?.title || "Unknown Activity"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {currentTransaction.activity?.city}, {currentTransaction.activity?.province}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Date: {new Date(currentTransaction.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">Quantity: {getTotalQuantity(currentTransaction)}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h4 className="font-semibold text-gray-700 text-sm sm:text-base">Payment Details</h4>
                <dl className="mt-2 divide-y divide-gray-200">
                  <div className="py-2 flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Total Amount:</dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      Rp{currentTransaction.amount?.toLocaleString() || "0"}
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Status:</dt>
                    <dd className="text-xs sm:text-sm text-gray-900">
                      {getStatusDisplayName(currentTransaction.status)}
                    </dd>
                  </div>
                  {currentTransaction.status === "pending" && getTimeRemaining(currentTransaction.createdAt) && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Payment Deadline:</dt>
                      <dd className="text-xs sm:text-sm text-orange-600 font-medium">
                        {getTimeRemaining(currentTransaction.createdAt).text}
                      </dd>
                    </div>
                  )}
                  {currentTransaction.paymentProofUrl && (
                    <div className="py-2 flex justify-between">
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Payment Proof:</dt>
                      <dd className="text-xs sm:text-sm text-gray-900">
                        <a
                          href={currentTransaction.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          View Proof
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* User Details */}
              <div>
                <h4 className="font-semibold text-gray-700 text-sm sm:text-base">User Details</h4>
                <dl className="mt-2 divide-y divide-gray-200">
                  <div className="py-2 flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Name:</dt>
                    <dd className="text-xs sm:text-sm text-gray-900">{currentTransaction.user?.name || "N/A"}</dd>
                  </div>
                  <div className="py-2 flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Email:</dt>
                    <dd className="text-xs sm:text-sm text-gray-900 break-all">
                      {currentTransaction.user?.email || "N/A"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Status Description */}
              <div>
                <h4 className="font-semibold text-gray-700 text-sm sm:text-base">Status Description</h4>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  {getStatusDescription(currentTransaction.status)}
                </p>
              </div>

              {/* Action Buttons (Conditionally Rendered) */}
              <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                {isTransactionCancellable(currentTransaction) && (
                  <button
                    onClick={() => {
                      handleCloseViewModal()
                      handleOpenCancelModal(currentTransaction)
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                  >
                    Cancel Transaction
                  </button>
                )}
                <button
                  onClick={handleCloseViewModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          isOpen={isUpdateStatusModalOpen}
          onClose={handleCloseUpdateStatusModal}
          title="Update Transaction Status"
        >
          {currentTransaction && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label htmlFor="newStatus" className="block text-xs sm:text-sm font-medium text-gray-700">
                  New Status:
                </label>
                <select
                  id="newStatus"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-xs sm:text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="pending">Pending Payment</option>
                  <option value="hold">Processing</option>
                  <option value="paid">Payment Verification</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={handleCloseUpdateStatusModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={submitting}
                  className={`px-4 py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] focus:outline-none focus:ring-2 focus:ring-[#FF7757] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm`}
                >
                  {submitting ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={isCancelModalOpen} onClose={handleCloseCancelModal} title="Cancel Transaction">
          {currentTransaction && (
            <div className="space-y-4">
              <p className="text-gray-600 text-xs sm:text-sm">Are you sure you want to cancel this transaction?</p>
              <div className="flex flex-col">
                <label htmlFor="cancelReason" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Reason for Cancellation:
                </label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows="3"
                  className="block w-full pl-3 pr-4 py-2 text-xs sm:text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={handleCloseCancelModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelTransaction}
                  disabled={submitting}
                  className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm`}
                >
                  {submitting ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={isUploadModalOpen} onClose={handleCloseUploadModal} title="Upload Payment Proof">
          {uploadingTransaction && (
            <div className="space-y-4">
              <p className="text-gray-600 text-xs sm:text-sm break-all">
                Upload your payment proof for transaction ID: {uploadingTransaction.id}
              </p>
              {uploadPreview && (
                <div className="flex justify-center">
                  <img
                    src={uploadPreview || "/placeholder.svg"}
                    alt="Payment Proof Preview"
                    className="max-h-32 sm:max-h-48 object-contain rounded-md"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Select File:</label>
                <input
                  type="file"
                  accept="image/jpeg, image/jpg, image/png, image/gif"
                  onChange={handleFileSelect}
                  className="mt-1 block w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:sm:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={handleCloseUploadModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPaymentProof}
                  disabled={submitting || !uploadFile}
                  className={`px-4 py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] focus:outline-none focus:ring-2 focus:ring-[#FF7757] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm`}
                >
                  {submitting ? "Uploading..." : "Submit Proof"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}

export default TransactionHistory
