"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  getAllTransactions,
  updateTransactionStatus,
  getTransactionById,
  getActivityById,
  getAllUsers,
} from "../../api"
import PlaceholderImage from "../../components/PlaceholderImage"
import toast, { Toaster } from "react-hot-toast"
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ExclamationCircleIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline"
import { Search, ChevronDown, Eye, CheckCircle, Clock, X } from "lucide-react"
import Modal from "../../components/admin/Modal"
import BottomNav from "../../components/admin/BottomNav"

// Define storage keys for consistent access across components
const TRANSACTION_STORAGE_KEY = "userTransactions"
const PAYMENT_PROOFS_KEY = "uploadedPaymentProofs"
const CART_TRANSACTIONS_KEY = "cartTransactions"
const CHECKOUT_TRANSACTIONS_KEY = "checkoutTransactions"

// Cache for storing fetched user and activity details
const userCache = new Map()
const activityCache = new Map()

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [apiError, setApiError] = useState(null)
  const [showActionMenu, setShowActionMenu] = useState(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [newTransactions, setNewTransactions] = useState([])
  const [transactionDetails, setTransactionDetails] = useState({})
  const [loadingDetails, setLoadingDetails] = useState({})
  const [loadingSkeletons, setLoadingSkeletons] = useState(Array(5).fill(true))
  const refreshTimeoutRef = useRef(null)

  // Track window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth)
      window.addEventListener("resize", handleResize)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])

  // Function to get transactions from localStorage
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

  // Function to get checkout transactions from localStorage
  const getCheckoutTransactions = () => {
    try {
      const checkoutTransactions = localStorage.getItem(CHECKOUT_TRANSACTIONS_KEY)
      if (checkoutTransactions) {
        return JSON.parse(checkoutTransactions)
      }
    } catch (error) {
      console.error("Error reading checkout transactions from localStorage:", error)
    }
    return []
  }

  // Function to get cart transactions from sessionStorage
  const getCartTransactions = () => {
    try {
      const cartTransactions = sessionStorage.getItem(CART_TRANSACTIONS_KEY)
      if (cartTransactions) {
        return JSON.parse(cartTransactions)
      }
    } catch (error) {
      console.error("Error reading cart transactions from sessionStorage:", error)
    }
    return []
  }

  // Function to get payment proofs from localStorage
  const getPaymentProofs = () => {
    try {
      const paymentProofs = localStorage.getItem(PAYMENT_PROOFS_KEY)
      if (paymentProofs) {
        return JSON.parse(paymentProofs)
      }
    } catch (error) {
      console.error("Error reading payment proofs from localStorage:", error)
    }
    return []
  }

  // Function to fetch user details with caching
  const fetchUserDetails = async (userId) => {
    if (!userId) return null

    // Check cache first
    if (userCache.has(userId)) {
      return userCache.get(userId)
    }

    try {
      // Since we don't have getUserById, we'll use getAllUsers and filter
      const response = await getAllUsers()
      if (response.data && Array.isArray(response.data.data)) {
        const users = response.data.data
        const userData = users.find((user) => user.id === userId)

        if (userData) {
          // Store in cache
          userCache.set(userId, userData)
          return userData
        }
      }
    } catch (error) {
      console.error(`Error fetching user details for ${userId}:`, error)
    }

    return null
  }

  // Function to fetch activity details with caching
  const fetchActivityDetails = async (activityId) => {
    if (!activityId) return null

    // Check cache first
    if (activityCache.has(activityId)) {
      return activityCache.get(activityId)
    }

    try {
      const response = await getActivityById(activityId)
      if (response.data && response.data.data) {
        const activityData = response.data.data
        // Store in cache
        activityCache.set(activityId, activityData)
        return activityData
      }
    } catch (error) {
      console.error(`Error fetching activity details for ${activityId}:`, error)
    }

    return null
  }

  // Enhanced function to fetch transaction details from API
  const fetchTransactionDetails = async (transactionId) => {
    try {
      setLoadingDetails((prev) => ({ ...prev, [transactionId]: true }))

      // Check if we already have detailed data for this transaction
      if (transactionDetails[transactionId]) {
        setLoadingDetails((prev) => ({ ...prev, [transactionId]: false }))
        return transactionDetails[transactionId]
      }

      console.log(`Fetching detailed information for transaction ${transactionId}`)
      const response = await getTransactionById(transactionId)

      if (response.data && response.data.data) {
        const detailedTransaction = response.data.data

        // Fetch user details if needed
        let userData = null
        if (detailedTransaction.userId) {
          userData = await fetchUserDetails(detailedTransaction.userId)
        }

        // Fetch activity details if needed
        let activityData = null
        if (detailedTransaction.activityId) {
          activityData = await fetchActivityDetails(detailedTransaction.activityId)
        }

        // Process and normalize the transaction data
        const processedTransaction = {
          ...detailedTransaction,
          user: {
            id: detailedTransaction.userId || detailedTransaction.user?.id,
            name: userData?.name || detailedTransaction.userName || detailedTransaction.user?.name || "Unknown User",
            email: userData?.email || detailedTransaction.userEmail || detailedTransaction.user?.email || "No email",
            phone: userData?.phone || detailedTransaction.userPhone || detailedTransaction.user?.phone || "No phone",
            avatar:
              userData?.profilePictureUrl ||
              detailedTransaction.userProfilePictureUrl ||
              detailedTransaction.user?.avatar ||
              null,
          },
          activity: {
            id: detailedTransaction.activityId || detailedTransaction.activity?.id,
            title:
              activityData?.title ||
              detailedTransaction.activityTitle ||
              detailedTransaction.activity?.title ||
              "Unknown Activity",
            price: activityData?.price || detailedTransaction.activityPrice || detailedTransaction.activity?.price || 0,
          },
          paymentMethod: {
            id: detailedTransaction.paymentMethodId || detailedTransaction.paymentMethod?.id,
            name: detailedTransaction.paymentMethodName || detailedTransaction.paymentMethod?.name || "Unknown Method",
          },
          items: detailedTransaction.items || detailedTransaction.transactionItems || [],
          paymentProofUrl: detailedTransaction.proofPaymentUrl || detailedTransaction.paymentProofUrl || null,
          source: "api",
          isFetched: true,
        }

        // Store the detailed transaction data
        setTransactionDetails((prev) => ({
          ...prev,
          [transactionId]: processedTransaction,
        }))

        setLoadingDetails((prev) => ({ ...prev, [transactionId]: false }))
        return processedTransaction
      }

      throw new Error("Invalid transaction data format")
    } catch (error) {
      console.error(`Error fetching transaction details for ${transactionId}:`, error)
      setLoadingDetails((prev) => ({ ...prev, [transactionId]: false }))
      throw error
    }
  }

  // Enhanced function to fetch transactions from multiple sources
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setApiError(null)
      console.log("Fetching all transactions...")

      // 1. Try to get transactions from the API
      let apiTransactions = []
      try {
        const response = await getAllTransactions()
        console.log("Fetched API transactions response:", response.data)

        if (response.data && Array.isArray(response.data.data)) {
          // Process transactions in batches to avoid overwhelming the API
          const batchSize = 5
          const transactionsData = response.data.data

          // Create a skeleton loader for each transaction
          setLoadingSkeletons(Array(Math.min(transactionsData.length, itemsPerPage)).fill(true))

          // Process transactions in batches
          for (let i = 0; i < transactionsData.length; i += batchSize) {
            const batch = transactionsData.slice(i, i + batchSize)

            // Process each batch in parallel
            const batchResults = await Promise.all(
              batch.map(async (transaction) => {
                console.log("Processing API transaction:", transaction.id)

                // Fetch user details
                let userData = null
                if (transaction.userId) {
                  userData = await fetchUserDetails(transaction.userId)
                }

                // Fetch activity details
                let activityData = null
                if (transaction.activityId) {
                  activityData = await fetchActivityDetails(transaction.activityId)
                }

                // For each transaction, fetch detailed information if needed
                let detailedData = transaction
                try {
                  // Only fetch details if we don't already have them and we need more info
                  if (!transactionDetails[transaction.id] && (!userData || !activityData || !transaction.amount)) {
                    const detailResponse = await getTransactionById(transaction.id)
                    if (detailResponse.data && detailResponse.data.data) {
                      detailedData = detailResponse.data.data
                    }
                  } else if (transactionDetails[transaction.id]) {
                    detailedData = transactionDetails[transaction.id]
                  }
                } catch (detailError) {
                  console.error(`Error fetching details for transaction ${transaction.id}:`, detailError)
                  // Continue with the data we have
                }

                // Calculate the amount if not available
                let amount = transaction.amount || detailedData.amount
                if (!amount && activityData && transaction.quantity) {
                  amount = activityData.price * transaction.quantity
                }

                return {
                  id: transaction.id,
                  status: transaction.status || "pending",
                  amount: amount || 0,
                  createdAt: transaction.createdAt || new Date().toISOString(),
                  updatedAt: transaction.updatedAt || new Date().toISOString(),
                  user: {
                    id: transaction.userId || transaction.user?.id || detailedData.userId || detailedData.user?.id,
                    name:
                      userData?.name ||
                      transaction.userName ||
                      transaction.user?.name ||
                      detailedData.userName ||
                      detailedData.user?.name ||
                      "Unknown User",
                    email:
                      userData?.email ||
                      transaction.userEmail ||
                      transaction.user?.email ||
                      detailedData.userEmail ||
                      detailedData.user?.email ||
                      "No email",
                    phone:
                      userData?.phone ||
                      transaction.userPhone ||
                      transaction.user?.phone ||
                      detailedData.userPhone ||
                      detailedData.user?.phone ||
                      "No phone",
                    avatar:
                      userData?.profilePictureUrl ||
                      transaction.userProfilePictureUrl ||
                      transaction.user?.avatar ||
                      detailedData.userProfilePictureUrl ||
                      detailedData.user?.avatar ||
                      null,
                  },
                  activity: {
                    id:
                      transaction.activityId ||
                      transaction.activity?.id ||
                      detailedData.activityId ||
                      detailedData.activity?.id,
                    title:
                      activityData?.title ||
                      transaction.activityTitle ||
                      transaction.activity?.title ||
                      detailedData.activityTitle ||
                      detailedData.activity?.title ||
                      "Unknown Activity",
                    price:
                      activityData?.price ||
                      transaction.activityPrice ||
                      transaction.activity?.price ||
                      detailedData.activityPrice ||
                      detailedData.activity?.price ||
                      0,
                  },
                  paymentMethod: {
                    id:
                      transaction.paymentMethodId ||
                      transaction.paymentMethod?.id ||
                      detailedData.paymentMethodId ||
                      detailedData.paymentMethod?.id,
                    name:
                      transaction.paymentMethodName ||
                      transaction.paymentMethod?.name ||
                      detailedData.paymentMethodName ||
                      detailedData.paymentMethod?.name ||
                      "Unknown Method",
                  },
                  quantity: transaction.quantity || detailedData.quantity || 1,
                  items:
                    transaction.items ||
                    transaction.transactionItems ||
                    detailedData.items ||
                    detailedData.transactionItems ||
                    [],
                  paymentProofUrl:
                    transaction.proofPaymentUrl ||
                    transaction.paymentProofUrl ||
                    detailedData.proofPaymentUrl ||
                    detailedData.paymentProofUrl ||
                    null,
                  isApiTransaction: true,
                  source: "api",
                  isFetched: true,
                }
              }),
            )

            apiTransactions = [...apiTransactions, ...batchResults]

            // Update the transactions state incrementally to show progress
            if (i === 0) {
              setTransactions(apiTransactions)
              setLoadingSkeletons(Array(Math.min(transactionsData.length - batchSize, itemsPerPage)).fill(true))
            }
          }

          console.log("Processed API transactions:", apiTransactions.length)
        }
      } catch (apiError) {
        console.error("Error fetching API transactions:", apiError)
      }

      // 2. Get user transactions from localStorage
      let userTransactions = []
      try {
        const userTransactionsData = getLocalStorageTransactions()
        if (userTransactionsData && userTransactionsData.length > 0) {
          console.log("Found user transactions in localStorage:", userTransactionsData)

          // Map user transactions to the standard format
          userTransactions = await Promise.all(
            userTransactionsData
              .map(async (transaction) => {
                console.log("Processing user transaction:", transaction.id)

                // Check if this transaction is already in apiTransactions
                const isDuplicate = apiTransactions.some((t) => t.id === transaction.id)
                if (isDuplicate) {
                  console.log(`Transaction ${transaction.id} already exists in API transactions, skipping`)
                  return null
                }

                // Fetch user details if available
                let userData = null
                if (transaction.userId || transaction.user?.id) {
                  userData = await fetchUserDetails(transaction.userId || transaction.user?.id)
                }

                // Fetch activity details if available
                let activityData = null
                if (transaction.activityId || transaction.activity?.id) {
                  activityData = await fetchActivityDetails(transaction.activityId || transaction.activity?.id)
                }

                return {
                  id: transaction.id,
                  status: transaction.status || "pending",
                  amount: transaction.amount || activityData?.price * (transaction.quantity || 1) || 0,
                  createdAt: transaction.createdAt || new Date().toISOString(),
                  updatedAt: transaction.updatedAt || new Date().toISOString(),
                  user: {
                    // Try to get user info from transaction or use defaults
                    id: transaction.userId || transaction.user?.id || "unknown-user",
                    name: userData?.name || transaction.user?.name || "Unknown User",
                    email: userData?.email || transaction.user?.email || "No email",
                    phone: userData?.phone || transaction.user?.phone || "No phone",
                    avatar: userData?.profilePictureUrl || transaction.user?.avatar || null,
                  },
                  activity: {
                    id: transaction.activityId || transaction.activity?.id,
                    title: activityData?.title || transaction.activity?.title || "Unknown Activity",
                    price: activityData?.price || transaction.activity?.price || 0,
                  },
                  quantity: transaction.quantity || 1,
                  paymentMethod: {
                    id: transaction.paymentMethod?.id || "unknown",
                    name: transaction.paymentMethod?.name || "Unknown Method",
                  },
                  items: transaction.items || [],
                  paymentProofUrl: transaction.paymentProofUrl || null,
                  isUserTransaction: true,
                  source: "userTransactions",
                }
              })
              .filter(Boolean), // Remove null entries (duplicates)
          )

          console.log("Processed user transactions:", userTransactions.length)
        }
      } catch (userTransError) {
        console.error("Error processing user transactions:", userTransError)
      }

      // 3. Get checkout transactions from localStorage
      let checkoutTransactions = []
      try {
        const checkoutTransactionsData = getCheckoutTransactions()
        if (
          checkoutTransactionsData &&
          (Array.isArray(checkoutTransactionsData) ? checkoutTransactionsData.length > 0 : checkoutTransactionsData)
        ) {
          console.log("Found checkout transactions in localStorage:", checkoutTransactionsData)

          // Process checkout transactions
          if (Array.isArray(checkoutTransactionsData)) {
            checkoutTransactions = await Promise.all(
              checkoutTransactionsData
                .map(async (transaction) => {
                  // Check if this transaction is already in apiTransactions or userTransactions
                  const isDuplicate = [...apiTransactions, ...userTransactions].some((t) => t.id === transaction.id)
                  if (isDuplicate) {
                    console.log(`Transaction ${transaction.id} already exists, skipping`)
                    return null
                  }

                  // Fetch user details if available
                  let userData = null
                  if (transaction.userId || transaction.user?.id) {
                    userData = await fetchUserDetails(transaction.userId || transaction.user?.id)
                  }

                  // Fetch activity details if available
                  let activityData = null
                  if (transaction.activityId || transaction.activity?.id) {
                    activityData = await fetchActivityDetails(transaction.activityId || transaction.activity?.id)
                  }

                  return {
                    ...transaction,
                    user: {
                      ...transaction.user,
                      name: userData?.name || transaction.user?.name || "Unknown User",
                      email: userData?.email || transaction.user?.email || "No email",
                    },
                    activity: {
                      ...transaction.activity,
                      title: activityData?.title || transaction.activity?.title || "Unknown Activity",
                      price: activityData?.price || transaction.activity?.price || 0,
                    },
                    amount: transaction.amount || activityData?.price * (transaction.quantity || 1) || 0,
                    isCheckoutTransaction: true,
                    source: "checkoutTransactions",
                  }
                })
                .filter(Boolean), // Remove null entries (duplicates)
            )
          } else if (checkoutTransactionsData) {
            // Single transaction object
            const isDuplicate = [...apiTransactions, ...userTransactions].some(
              (t) => t.id === checkoutTransactionsData.id,
            )
            if (!isDuplicate) {
              // Fetch user details if available
              let userData = null
              if (checkoutTransactionsData.userId || checkoutTransactionsData.user?.id) {
                userData = await fetchUserDetails(checkoutTransactionsData.userId || checkoutTransactionsData.user?.id)
              }

              // Fetch activity details if available
              let activityData = null
              if (checkoutTransactionsData.activityId || checkoutTransactionsData.activity?.id) {
                activityData = await fetchActivityDetails(
                  checkoutTransactionsData.activityId || checkoutTransactionsData.activity?.id,
                )
              }

              checkoutTransactions.push({
                ...checkoutTransactionsData,
                user: {
                  ...checkoutTransactionsData.user,
                  name: userData?.name || checkoutTransactionsData.user?.name || "Unknown User",
                  email: userData?.email || checkoutTransactionsData.user?.email || "No email",
                },
                activity: {
                  ...checkoutTransactionsData.activity,
                  title: activityData?.title || checkoutTransactionsData.activity?.title || "Unknown Activity",
                  price: activityData?.price || checkoutTransactionsData.activity?.price || 0,
                },
                amount:
                  checkoutTransactionsData.amount ||
                  activityData?.price * (checkoutTransactionsData.quantity || 1) ||
                  0,
                isCheckoutTransaction: true,
                source: "checkoutTransactions",
              })
            }
          }

          console.log("Processed checkout transactions:", checkoutTransactions.length)
        }
      } catch (checkoutError) {
        console.error("Error processing checkout transactions:", checkoutError)
      }

      // 4. Get cart transactions from sessionStorage
      let cartTransactions = []
      try {
        const cartTransactionsData = getCartTransactions()
        if (
          cartTransactionsData &&
          (Array.isArray(cartTransactionsData) ? cartTransactionsData.length > 0 : cartTransactionsData)
        ) {
          console.log("Found cart transactions in sessionStorage:", cartTransactionsData)

          // Process cart transactions
          if (Array.isArray(cartTransactionsData)) {
            cartTransactions = await Promise.all(
              cartTransactionsData
                .map(async (transaction) => {
                  // Check if this transaction is already in other transaction sources
                  const isDuplicate = [...apiTransactions, ...userTransactions, ...checkoutTransactions].some(
                    (t) => t.id === transaction.id,
                  )
                  if (isDuplicate) {
                    console.log(`Transaction ${transaction.id} already exists, skipping`)
                    return null
                  }

                  // Fetch user details if available
                  let userData = null
                  if (transaction.userId || transaction.user?.id) {
                    userData = await fetchUserDetails(transaction.userId || transaction.user?.id)
                  }

                  // Fetch activity details if available
                  let activityData = null
                  if (transaction.activityId || transaction.activity?.id) {
                    activityData = await fetchActivityDetails(transaction.activityId || transaction.activity?.id)
                  }

                  return {
                    ...transaction,
                    user: {
                      ...transaction.user,
                      name: userData?.name || transaction.user?.name || "Unknown User",
                      email: userData?.email || transaction.user?.email || "No email",
                    },
                    activity: {
                      ...transaction.activity,
                      title: activityData?.title || transaction.activity?.title || "Unknown Activity",
                      price: activityData?.price || transaction.activity?.price || 0,
                    },
                    amount: transaction.amount || activityData?.price * (transaction.quantity || 1) || 0,
                    isCartTransaction: true,
                    source: "cartTransactions",
                  }
                })
                .filter(Boolean), // Remove null entries (duplicates)
            )
          } else if (cartTransactionsData) {
            // Single transaction object
            const isDuplicate = [...apiTransactions, ...userTransactions, ...checkoutTransactions].some(
              (t) => t.id === cartTransactionsData.id,
            )
            if (!isDuplicate) {
              // Fetch user details if available
              let userData = null
              if (cartTransactionsData.userId || cartTransactionsData.user?.id) {
                userData = await fetchUserDetails(cartTransactionsData.userId || cartTransactionsData.user?.id)
              }

              // Fetch activity details if available
              let activityData = null
              if (cartTransactionsData.activityId || cartTransactionsData.activity?.id) {
                activityData = await fetchActivityDetails(
                  cartTransactionsData.activityId || cartTransactionsData.activity?.id,
                )
              }

              cartTransactions.push({
                ...cartTransactionsData,
                user: {
                  ...cartTransactionsData.user,
                  name: userData?.name || cartTransactionsData.user?.name || "Unknown User",
                  email: userData?.email || cartTransactionsData.user?.email || "No email",
                },
                activity: {
                  ...cartTransactionsData.activity,
                  title: activityData?.title || cartTransactionsData.activity?.title || "Unknown Activity",
                  price: activityData?.price || cartTransactionsData.activity?.price || 0,
                },
                amount: cartTransactionsData.amount || activityData?.price * (cartTransactionsData.quantity || 1) || 0,
                isCartTransaction: true,
                source: "cartTransactions",
              })
            }
          }

          console.log("Processed cart transactions:", cartTransactions.length)
        }
      } catch (cartError) {
        console.error("Error processing cart transactions:", cartError)
      }

      // 5. Get payment proofs from localStorage
      const paymentProofs = getPaymentProofs()

      // 6. Combine all transactions, prioritizing API > user > checkout > cart
      const allTransactions = [...apiTransactions, ...userTransactions, ...checkoutTransactions, ...cartTransactions]
      console.log("Combined transactions:", allTransactions.length)

      // 7. Update transaction statuses based on payment proofs
      const processedTransactions = allTransactions.map((transaction) => {
        // Check if there's a payment proof for this transaction
        const paymentProof = paymentProofs?.find((proof) => proof.transactionId === transaction.id)

        // If there's a payment proof but the transaction status is still pending, update it
        if (paymentProof && transaction.status === "pending") {
          return {
            ...transaction,
            status: "waiting_verification",
            paymentProofUrl: paymentProof.proofUrl,
            updatedAt: paymentProof.timestamp || transaction.updatedAt,
          }
        }

        // If the transaction has a payment proof URL but status is pending, update it
        if (transaction.paymentProofUrl && transaction.status === "pending") {
          return {
            ...transaction,
            status: "waiting_verification",
          }
        }

        return transaction
      })

      // Check for new transactions that weren't in the previous state
      const prevTransactionIds = transactions.map((t) => t.id)
      const newTransactionsList = processedTransactions.filter(
        (t) => !prevTransactionIds.includes(t.id) && t.status === "waiting_verification",
      )

      if (newTransactionsList.length > 0 && prevTransactionIds.length > 0) {
        setNewTransactions(newTransactionsList)
        // Notify admin about new transactions waiting for verification
        toast.success(`${newTransactionsList.length} new transaction(s) waiting for verification`)
      }

      setTransactions(processedTransactions)
      setLastRefreshed(new Date())
      setLoadingSkeletons(Array(5).fill(false))
    } catch (error) {
      console.error("Error in transaction fetching process:", error)
      setApiError(`Failed to fetch transactions: ${error.message}`)
      toast.error("Failed to load transactions")
      setLoadingSkeletons(Array(5).fill(false))
    } finally {
      setLoading(false)
    }
  }, [refreshTrigger, transactionDetails])

  // Enhanced function to open transaction details modal
  const handleOpenViewModal = async (transaction) => {
    try {
      // For basic viewing, use the transaction data we already have
      setCurrentTransaction(transaction)
      setIsViewModalOpen(true)

      // If we need more details, fetch them
      if (!transaction.isFetched) {
        try {
          // Show loading indicator in the modal
          setCurrentTransaction((prev) => ({
            ...prev,
            isLoading: true,
          }))

          const detailedTransaction = await fetchTransactionDetails(transaction.id)

          // Update the current transaction with more details
          setCurrentTransaction((prev) => ({
            ...prev,
            ...detailedTransaction,
            isFetched: true,
            isLoading: false,
          }))
        } catch (error) {
          console.error("Error fetching transaction details:", error)
          // Update loading state but continue showing the modal with the data we have
          setCurrentTransaction((prev) => ({
            ...prev,
            isLoading: false,
            fetchError: error.message,
          }))
        }
      }
    } catch (error) {
      console.error("Error opening view modal:", error)
      toast.error("Failed to open transaction details")
    }
  }

  // Enhanced function to update transaction status
  const handleUpdateStatus = async (transactionId, newStatus) => {
    try {
      setIsProcessing(true)
      console.log(`Attempting to update transaction ${transactionId} to status: ${newStatus}`)

      // Check if it's a local transaction (mock, user, checkout, cart)
      const localTransaction = transactions.find(
        (t) => t.id === transactionId && (t.isUserTransaction || t.isCheckoutTransaction || t.isCartTransaction),
      )

      if (localTransaction) {
        // Update local transaction in state
        const updatedTransactions = transactions.map((transaction) =>
          transaction.id === transactionId
            ? { ...transaction, status: newStatus, updatedAt: new Date().toISOString() }
            : transaction,
        )
        setTransactions(updatedTransactions)

        // Update in localStorage if it's a user transaction
        if (localTransaction.isUserTransaction || localTransaction.source === "userTransactions") {
          const userTransactions = getLocalStorageTransactions()
          const updatedUserTransactions = userTransactions.map((transaction) =>
            transaction.id === transactionId
              ? { ...transaction, status: newStatus, updatedAt: new Date().toISOString() }
              : transaction,
          )
          localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(updatedUserTransactions))
        }

        // Update in localStorage if it's a checkout transaction
        if (localTransaction.isCheckoutTransaction || localTransaction.source === "checkoutTransactions") {
          const checkoutTransactions = getCheckoutTransactions()
          if (Array.isArray(checkoutTransactions)) {
            const updatedCheckoutTransactions = checkoutTransactions.map((transaction) =>
              transaction.id === transactionId
                ? { ...transaction, status: newStatus, updatedAt: new Date().toISOString() }
                : transaction,
            )
            localStorage.setItem(CHECKOUT_TRANSACTIONS_KEY, JSON.stringify(updatedCheckoutTransactions))
          } else if (checkoutTransactions && checkoutTransactions.id === transactionId) {
            const updatedCheckoutTransaction = {
              ...checkoutTransactions,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
            localStorage.setItem(CHECKOUT_TRANSACTIONS_KEY, JSON.stringify(updatedCheckoutTransaction))
          }
        }

        // Update in sessionStorage if it's a cart transaction
        if (localTransaction.isCartTransaction || localTransaction.source === "cartTransactions") {
          const cartTransactions = getCartTransactions()
          if (Array.isArray(cartTransactions)) {
            const updatedCartTransactions = cartTransactions.map((transaction) =>
              transaction.id === transactionId
                ? { ...transaction, status: newStatus, updatedAt: new Date().toISOString() }
                : transaction,
            )
            sessionStorage.setItem(CART_TRANSACTIONS_KEY, JSON.stringify(updatedCartTransactions))
          } else if (cartTransactions && cartTransactions.id === transactionId) {
            const updatedCartTransaction = {
              ...cartTransactions,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
            sessionStorage.setItem(CART_TRANSACTIONS_KEY, JSON.stringify(updatedCartTransaction))
          }
        }

        toast.success(`Transaction ${formatStatus(newStatus)} successfully`)

        // Try to update in API as well
        try {
          await updateTransactionStatus(transactionId, { status: newStatus })
          console.log(`Also updated transaction ${transactionId} in API`)
        } catch (apiError) {
          console.error(`Failed to update transaction in API, but updated locally:`, apiError)
        }
      } else {
        // It's a real API transaction
        console.log(`Updating API transaction ${transactionId} to status: ${newStatus}`)

        // Show loading toast
        const loadingToastId = toast.loading(`Updating transaction status to ${formatStatus(newStatus)}...`)

        try {
          const response = await updateTransactionStatus(transactionId, { status: newStatus })
          console.log("Update transaction response:", response.data)

          if (response.data && (response.data.code === "200" || response.data.status === "success")) {
            // Update local state for immediate UI update
            setTransactions((prevTransactions) =>
              prevTransactions.map((transaction) =>
                transaction.id === transactionId
                  ? { ...transaction, status: newStatus, updatedAt: new Date().toISOString() }
                  : transaction,
              ),
            )

            // Also update in our transaction details cache
            if (transactionDetails[transactionId]) {
              setTransactionDetails((prev) => ({
                ...prev,
                [transactionId]: {
                  ...prev[transactionId],
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                },
              }))
            }

            toast.dismiss(loadingToastId)
            toast.success(`Transaction ${formatStatus(newStatus)} successfully`)
          } else {
            toast.dismiss(loadingToastId)
            throw new Error(`Failed to update transaction status to ${newStatus}`)
          }
        } catch (apiError) {
          toast.dismiss(loadingToastId)
          console.error(`API Error updating transaction status:`, apiError)

          // Provide more specific error messages based on the error
          if (apiError.response?.status === 403) {
            toast.error(`Permission denied. You may not have admin rights to update transactions.`)
          } else if (apiError.response?.status === 404) {
            toast.error(`Transaction not found in the API.`)
          } else {
            toast.error(`Failed to update transaction: ${apiError.message}`)
          }
        }
      }

      // Close modal if open
      if (isViewModalOpen && currentTransaction?.id === transactionId) {
        handleCloseViewModal()
      }

      // Reset action menu
      setShowActionMenu(null)

      // Refresh data to ensure we have the latest
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error(`Error updating transaction status:`, error)
      toast.error(`Failed to update transaction: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Initial data load and setup real-time refresh with reduced frequency
  useEffect(() => {
    fetchTransactions()

    // Set up real-time refresh every 2 minutes instead of 30 seconds
    // This reduces the frequency of reloads
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1)
    }, 120000) // 2 minutes

    return () => {
      clearInterval(interval)
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [fetchTransactions])

  // Listen for storage events to detect changes from user transactions
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === TRANSACTION_STORAGE_KEY || e.key === PAYMENT_PROOFS_KEY || e.key === CHECKOUT_TRANSACTIONS_KEY) {
        console.log("Storage changed, refreshing transactions")

        // Debounce the refresh to avoid multiple refreshes in quick succession
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }

        refreshTimeoutRef.current = setTimeout(() => {
          setRefreshTrigger((prev) => prev + 1)
        }, 1000) // Wait 1 second before refreshing
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Listen for custom payment proof uploaded event
    const handlePaymentProofUploaded = (event) => {
      console.log("Payment proof uploaded event received", event.detail)

      // Debounce the refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      refreshTimeoutRef.current = setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1)
      }, 1000)
    }

    window.addEventListener("paymentProofUploaded", handlePaymentProofUploaded)

    // Listen for custom checkout completed event
    const handleCheckoutCompleted = (event) => {
      console.log("Checkout completed event received", event.detail)

      // Debounce the refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      refreshTimeoutRef.current = setTimeout(() => {
        setRefreshTrigger((prev) => prev + 1)
      }, 1000)
    }

    window.addEventListener("checkoutCompleted", handleCheckoutCompleted)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("paymentProofUploaded", handlePaymentProofUploaded)
      window.removeEventListener("checkoutCompleted", handleCheckoutCompleted)

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [fetchTransactions])

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionMenu && !event.target.closest(".action-menu-container")) {
        setShowActionMenu(null)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [showActionMenu])

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setCurrentTransaction(null)
  }

  // Toggle action menu for a transaction
  const toggleActionMenu = (e, transactionId) => {
    e.stopPropagation()
    setShowActionMenu(showActionMenu === transactionId ? null : transactionId)
  }

  // Filter transactions based on search term and status
  const filteredTransactions = transactions.filter((transaction) => {
    // Status filter
    const statusMatch = filterStatus === "all" || transaction.status === filterStatus

    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const idMatch = transaction.id?.toLowerCase().includes(searchLower)
    const userNameMatch = transaction.user?.name?.toLowerCase().includes(searchLower)
    const userEmailMatch = transaction.user?.email?.toLowerCase().includes(searchLower)
    const activityMatch =
      transaction.activity?.title?.toLowerCase().includes(searchLower) ||
      transaction.items?.some((item) => item.activity?.title?.toLowerCase().includes(searchLower))

    return statusMatch && (searchQuery === "" || idMatch || userNameMatch || userEmailMatch || activityMatch)
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString()
    } catch (error) {
      return "Invalid Date"
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "Rp0"
    return `Rp${Number.parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  // Status badge styling
  const getStatusBadge = (status) => {
    const badgeStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      waiting_verification: "bg-blue-100 text-blue-800",
      waiting_paid: "bg-orange-100 text-orange-800",
      verified: "bg-green-100 text-green-800",
      canceled: "bg-red-100 text-red-800",
    }

    const badgeIcons = {
      pending: <Clock className="h-4 w-4 mr-1" />,
      waiting_verification: <Eye className="h-4 w-4 mr-1" />,
      waiting_paid: <Clock className="h-4 w-4 mr-1" />,
      verified: <CheckCircle className="h-4 w-4 mr-1" />,
      canceled: <X className="h-4 w-4 mr-1" />,
    }

    return `inline-flex items-center px-2 py-1 rounded-full ${badgeStyles[status] || "bg-gray-100 text-gray-800"}`
  }

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return "Unknown"

    const statusIcons = {
      pending: <Clock className="h-4 w-4 mr-1" />,
      waiting_verification: <Eye className="h-4 w-4 mr-1" />,
      waiting_paid: <Clock className="h-4 w-4 mr-1" />,
      verified: <CheckCircle className="h-4 w-4 mr-1" />,
      canceled: <X className="h-4 w-4 mr-1" />,
    }

    const statusLabels = {
      waiting_verification: "Waiting Verification",
      waiting_paid: "Waiting Payment",
      verified: "Verified",
      canceled: "Canceled",
      pending: "Pending",
    }

    return (
      <span className="inline-flex items-center">
        {statusIcons[status] || <CheckCircle className="h-4 w-4 mr-1" />}
        {statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Determine if we should show the action menu dropdown based on screen size
  const shouldUseActionMenu = (width) => {
    return width > 640 && width < 1280
  }

  // Get the appropriate action buttons based on transaction status
  const getActionButtons = (transaction) => {
    switch (transaction.status) {
      case "waiting_verification":
        return (
          <>
            <button
              onClick={() => handleUpdateStatus(transaction.id, "verified")}
              className="text-green-600 hover:text-green-900 p-1"
              disabled={isProcessing}
              title="Verify transaction"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleUpdateStatus(transaction.id, "pending")}
              className="text-yellow-600 hover:text-yellow-900 p-1"
              disabled={isProcessing}
              title="Set to pending for re-verification"
            >
              <ClockIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleUpdateStatus(transaction.id, "canceled")}
              className="text-red-600 hover:text-red-900 p-1"
              disabled={isProcessing}
              title="Cancel transaction"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </>
        )
      case "pending":
        return (
          <>
            {transaction.paymentProofUrl && (
              <button
                onClick={() => handleUpdateStatus(transaction.id, "waiting_verification")}
                className="text-blue-600 hover:text-blue-900 p-1"
                disabled={isProcessing}
                title="Move to waiting verification"
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => handleUpdateStatus(transaction.id, "waiting_paid")}
              className="text-orange-600 hover:text-orange-900 p-1"
              disabled={isProcessing}
              title="Set to waiting payment"
            >
              <ClockIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleUpdateStatus(transaction.id, "canceled")}
              className="text-red-600 hover:text-red-900 p-1"
              disabled={isProcessing}
              title="Cancel transaction"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </>
        )
      case "waiting_paid":
        return (
          <>
            <button
              onClick={() => handleUpdateStatus(transaction.id, "pending")}
              className="text-yellow-600 hover:text-yellow-900 p-1"
              disabled={isProcessing}
              title="Set to pending"
            >
              <ClockIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleUpdateStatus(transaction.id, "canceled")}
              className="text-red-600 hover:text-red-900 p-1"
              disabled={isProcessing}
              title="Cancel transaction"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </>
        )
      case "verified":
      case "canceled":
        return null
      default:
        return null
    }
  }

  // Simplified pagination that works on all screen sizes
  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="bg-white px-2 py-3 flex items-center justify-center border-t border-gray-200 mt-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Previous button */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* First page */}
          <button
            onClick={() => setCurrentPage(1)}
            className={`relative inline-flex items-center justify-center w-8 h-8 rounded-md border text-sm font-medium ${
              currentPage === 1
                ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            1
          </button>

          {/* Ellipsis if needed */}
          {currentPage > 3 && totalPages > 4 && (
            <span className="relative inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700">
              ...
            </span>
          )}

          {/* Current page (if not first or last) */}
          {currentPage !== 1 && currentPage !== totalPages && (
            <button
              onClick={() => setCurrentPage(currentPage)}
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#FF7757] bg-[#FF7757] text-sm font-medium text-white"
            >
              {currentPage}
            </button>
          )}

          {/* Ellipsis if needed */}
          {currentPage < totalPages - 2 && totalPages > 4 && (
            <span className="relative inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700">
              ...
            </span>
          )}

          {/* Last page (if not the same as first page) */}
          {totalPages > 1 && (
            <button
              onClick={() => setCurrentPage(totalPages)}
              className={`relative inline-flex items-center justify-center w-8 h-8 rounded-md border text-sm font-medium ${
                currentPage === totalPages
                  ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                  : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {totalPages}
            </button>
          )}

          {/* Next button */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // Check if a transaction is new (for highlighting)
  const isNewTransaction = (transaction) => {
    return newTransactions.some((t) => t.id === transaction.id)
  }

  // Get activity title from transaction
  const getActivityTitle = (transaction) => {
    if (transaction.activity?.title) {
      return transaction.activity.title
    }

    if (transaction.items && transaction.items.length > 0) {
      return transaction.items[0]?.activity?.title || "Unknown Activity"
    }

    return "Unknown Activity"
  }

  // Get total quantity from transaction
  const getTotalQuantity = (transaction) => {
    if (transaction.quantity) {
      return transaction.quantity
    }

    if (transaction.items && transaction.items.length > 0) {
      return transaction.items.reduce((total, item) => total + (item.quantity || 1), 0)
    }

    return 1
  }

  // Render skeleton loader for mobile view
  const renderMobileSkeletons = () => {
    return Array(3)
      .fill()
      .map((_, index) => (
        <div key={index} className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div className="w-2/3">
              <div className="h-5 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse"></div>
          </div>

          <div className="flex items-center mb-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="ml-3 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>

          <div className="mb-3 bg-gray-100 p-2 rounded">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-1 animate-pulse"></div>
            <div className="flex justify-between mt-1">
              <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/6 animate-pulse"></div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>

          <div className="flex justify-end space-x-2 mt-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      ))
  }

  // Render skeleton loader for tablet view
  const renderTabletSkeletons = () => {
    return Array(5)
      .fill()
      .map((_, index) => (
        <tr key={index} className="border-b border-gray-200">
          <td className="px-2 py-3">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 rounded-full mr-2 animate-pulse"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </td>
          <td className="px-2 py-3">
            <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-12 mb-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </td>
          <td className="px-2 py-3">
            <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse"></div>
          </td>
          <td className="px-2 py-3">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          </td>
          <td className="px-2 py-3 text-right">
            <div className="flex justify-end">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </td>
        </tr>
      ))
  }

  // Render skeleton loader for desktop view
  const renderDesktopSkeletons = () => {
    return Array(5)
      .fill()
      .map((_, index) => (
        <tr key={index} className="border-b border-gray-200">
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-40 mb-1 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-28 animate-pulse"></div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex justify-end gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </td>
        </tr>
      ))
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-16">
      {/* MODIFIED: Added left padding to account for collapsed sidebar */}
      <div className="flex-1 lg:ml-16 xl:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            {/* Search bar */}
            <div className="relative flex-grow">
              <label htmlFor="search-transactions" className="block text-xs font-medium text-gray-700 mb-1">
                Search Transactions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  id="search-transactions"
                  type="text"
                  placeholder="Search by ID, name, email or activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-[#FF7757]"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Status filter */}
            <div className="w-full sm:w-44">
              <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <div className="relative">
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-[#FF7757] bg-white appearance-none"
                  disabled={loading}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="waiting_paid">Waiting Payment</option>
                  <option value="waiting_verification">Waiting Verification</option>
                  <option value="verified">Verified</option>
                  <option value="canceled">Canceled</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-4 py-2 bg-[#FF7757] text-white rounded-lg hover:bg-[#FF6347] transition-colors flex items-center justify-center gap-2 shadow-sm"
              disabled={loading}
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Transaction count and last refreshed */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <p className="text-sm text-gray-600">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? "transaction" : "transactions"} found
          </p>
          <p className="text-xs text-gray-500">Last refreshed: {lastRefreshed.toLocaleTimeString()}</p>
        </div>

        {/* New transactions notification */}
        {newTransactions.length > 0 && (
          <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {newTransactions.length} new transaction(s) waiting for verification
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state with skeleton loaders */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Mobile skeleton */}
            <div className="block sm:hidden">{renderMobileSkeletons()}</div>

            {/* Tablet skeleton */}
            <div className="hidden sm:block lg:hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID/User
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Activity/Amount
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>{renderTabletSkeletons()}</tbody>
              </table>
            </div>

            {/* Desktop skeleton */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Activity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Payment Proof
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>{renderDesktopSkeletons()}</tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {filteredTransactions.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-8 text-center">
                <div className="flex flex-col items-center justify-center py-12">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">No transactions found</p>
                  <p className="text-gray-400 mt-2">Try changing your search or filter criteria</p>
                  {apiError && <p className="text-red-500 mt-2">{apiError}</p>}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md overflow-hidden">
                {/* Mobile view - cards */}
                <div className="block sm:hidden">
                  <div className="divide-y divide-gray-200">
                    {currentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className={`p-4 hover:bg-gray-50 ${isNewTransaction(transaction) ? "bg-blue-50" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="truncate max-w-[70%]">
                            <p className="font-medium text-gray-900 truncate">{transaction.id}</p>
                            <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(transaction.status)}`}
                          >
                            {formatStatus(transaction.status)}
                          </span>
                        </div>

                        <div className="flex items-center mb-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                            {transaction.user?.avatar ? (
                              <img
                                src={transaction.user.avatar || "/placeholder.svg"}
                                alt={transaction.user.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <PlaceholderImage
                                text={transaction.user?.name?.charAt(0) || "U"}
                                className="h-10 w-10 rounded-full"
                              />
                            )}
                          </div>
                          <div className="ml-3 truncate">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {transaction.user?.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{transaction.user?.email || "No email"}</p>
                          </div>
                        </div>

                        {/* Activity information */}
                        <div className="mb-3 bg-gray-50 p-2 rounded">
                          <p className="text-sm font-medium text-gray-700">Activity:</p>
                          <p className="text-sm text-gray-900">
                            {transaction.activity?.title || getActivityTitle(transaction)}
                          </p>
                          <div className="flex justify-between mt-1">
                            <p className="text-xs text-gray-500">Quantity:</p>
                            <p className="text-xs font-medium">
                              {transaction.quantity || getTotalQuantity(transaction)}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm text-gray-500">Amount:</p>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</p>
                        </div>

                        {/* Payment proof indicator */}
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm text-gray-500">Payment Proof:</p>
                          {transaction.paymentProofUrl ? (
                            <button
                              onClick={() => handleOpenViewModal(transaction)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Proof
                            </button>
                          ) : (
                            <span className="text-red-600 flex items-center text-sm">
                              <X className="h-4 w-4 mr-1" />
                              Not uploaded
                            </span>
                          )}
                        </div>

                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => handleOpenViewModal(transaction)}
                            className="p-2 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full"
                            title="View details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {getActionButtons(transaction)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tablet view - simplified table */}
                <div className="hidden sm:block lg:hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th
                          scope="col"
                          className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          ID/User
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Activity/Amount
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Payment
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className={`hover:bg-gray-50 ${isNewTransaction(transaction) ? "bg-blue-50" : ""}`}
                        >
                          <td className="px-2 py-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden mr-2">
                                {transaction.user?.avatar ? (
                                  <img
                                    src={transaction.user.avatar || "/placeholder.svg"}
                                    alt={transaction.user.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <PlaceholderImage
                                    text={transaction.user?.name?.charAt(0) || "U"}
                                    className="h-8 w-8 rounded-full"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900 max-w-[120px] truncate">
                                  {transaction.id}
                                </div>
                                <div className="text-xs text-gray-500 max-w-[120px] truncate">
                                  {transaction.user?.name || "Unknown"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <div className="text-xs text-gray-900 max-w-[120px] truncate">
                              {transaction.activity?.title || getActivityTitle(transaction)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {transaction.quantity || getTotalQuantity(transaction)}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(transaction.status)}`}
                            >
                              {formatStatus(transaction.status)}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            {transaction.paymentProofUrl ? (
                              <span className="text-green-600 flex items-center text-xs">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center text-xs">
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-right">
                            {shouldUseActionMenu(windowWidth) ? (
                              <div className="relative action-menu-container">
                                <button
                                  onClick={(e) => toggleActionMenu(e, transaction.id)}
                                  className="p-1 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  <EllipsisVerticalIcon className="h-5 w-5" />
                                </button>
                                {showActionMenu === transaction.id && (
                                  <div
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="py-1">
                                      <button
                                        onClick={() => handleOpenViewModal(transaction)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        View Details
                                      </button>
                                      {getActionButtons(transaction) && (
                                        <>
                                          {transaction.status === "waiting_verification" && (
                                            <>
                                              <button
                                                onClick={() => handleUpdateStatus(transaction.id, "verified")}
                                                className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-100"
                                                disabled={isProcessing}
                                              >
                                                Verify
                                              </button>
                                              <button
                                                onClick={() => handleUpdateStatus(transaction.id, "pending")}
                                                className="block w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-100"
                                                disabled={isProcessing}
                                              >
                                                Set to Pending
                                              </button>
                                              <button
                                                onClick={() => handleUpdateStatus(transaction.id, "canceled")}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                                                disabled={isProcessing}
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          )}

                                          {transaction.status === "pending" && (
                                            <>
                                              {transaction.paymentProofUrl && (
                                                <button
                                                  onClick={() =>
                                                    handleUpdateStatus(transaction.id, "waiting_verification")
                                                  }
                                                  className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
                                                  disabled={isProcessing}
                                                >
                                                  Move to Verification
                                                </button>
                                              )}
                                              <button
                                                onClick={() => handleUpdateStatus(transaction.id, "waiting_paid")}
                                                className="block w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-100"
                                                disabled={isProcessing}
                                              >
                                                Set to Waiting Payment
                                              </button>
                                              <button
                                                onClick={() => handleUpdateStatus(transaction.id, "canceled")}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                                                disabled={isProcessing}
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          )}

                                          {transaction.status === "waiting_paid" && (
                                            <>
                                              <button
                                                onClick={() => handleUpdateStatus(transaction.id, "pending")}
                                                className="block w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-100"
                                                disabled={isProcessing}
                                              >
                                                Set to Pending
                                              </button>
                                              <button
                                                onClick={() => handleUpdateStatus(transaction.id, "canceled")}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                                                disabled={isProcessing}
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleOpenViewModal(transaction)}
                                  className="text-indigo-600 hover:text-indigo-900 p-2 rounded"
                                  title="View details"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                                {getActionButtons(transaction)}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Desktop view - full table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          User
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Activity
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Amount
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Payment Proof
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className={`hover:bg-gray-50 ${isNewTransaction(transaction) ? "bg-blue-50" : ""}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-3">
                                {transaction.user?.avatar ? (
                                  <img
                                    src={transaction.user.avatar || "/placeholder.svg"}
                                    alt={transaction.user.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <PlaceholderImage
                                    text={transaction.user?.name?.charAt(0) || "U"}
                                    className="h-10 w-10 rounded-full"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{transaction.user?.name || "Unknown"}</div>
                                <div className="text-gray-500">{transaction.user?.email || "No email"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.activity?.title || getActivityTitle(transaction)}
                            <div className="text-gray-500">
                              Qty: {transaction.quantity || getTotalQuantity(transaction)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(transaction.status)}`}
                            >
                              {formatStatus(transaction.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.paymentProofUrl ? (
                              <button
                                onClick={() => handleOpenViewModal(transaction)}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View Proof
                              </button>
                            ) : (
                              <span className="text-red-600 flex items-center">
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Not uploaded
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenViewModal(transaction)}
                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded"
                                title="View details"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              {getActionButtons(transaction)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {renderPagination()}
          </>
        )}

        {/* View Transaction Modal */}
        <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Transaction Details">
          {currentTransaction ? (
            <>
              {currentTransaction.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7757]"></div>
                  <p className="ml-3 text-gray-600">Loading transaction details...</p>
                </div>
              ) : currentTransaction.fetchError ? (
                <div className="text-red-500 py-6">Error: {currentTransaction.fetchError}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Basic Information</h3>
                    <p>
                      <strong>Transaction ID:</strong> {currentTransaction.id}
                    </p>
                    <p>
                      <strong>Status:</strong> {formatStatus(currentTransaction.status)}
                    </p>
                    <p>
                      <strong>Date:</strong> {formatDate(currentTransaction.createdAt)}
                    </p>
                    <p>
                      <strong>Amount:</strong> {formatCurrency(currentTransaction.amount)}
                    </p>
                    <p>
                      <strong>Source:</strong> {currentTransaction.source || "Unknown"}
                    </p>
                  </div>

                  {/* User Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">User Information</h3>
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-3">
                        {currentTransaction.user?.avatar ? (
                          <img
                            src={currentTransaction.user.avatar || "/placeholder.svg"}
                            alt={currentTransaction.user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <PlaceholderImage
                            text={currentTransaction.user?.name?.charAt(0) || "U"}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{currentTransaction.user?.name || "Unknown"}</div>
                        <div className="text-gray-500">{currentTransaction.user?.email || "No email"}</div>
                        <div className="text-gray-500">{currentTransaction.user?.phone || "No phone"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Activity Information</h3>
                    <p>
                      <strong>Activity:</strong>{" "}
                      {currentTransaction.activity?.title || getActivityTitle(currentTransaction)}
                    </p>
                    <p>
                      <strong>Quantity:</strong> {currentTransaction.quantity || getTotalQuantity(currentTransaction)}
                    </p>
                    <p>
                      <strong>Price per unit:</strong> {formatCurrency(currentTransaction.activity?.price || 0)}
                    </p>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Information</h3>
                    <p>
                      <strong>Method:</strong> {currentTransaction.paymentMethod?.name || "Unknown"}
                    </p>
                    {currentTransaction.paymentProofUrl ? (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-700 mb-1">Payment Proof</h4>
                        <img
                          src={currentTransaction.paymentProofUrl || "/placeholder.svg"}
                          alt="Payment Proof"
                          className="rounded-md shadow-md max-h-48 object-contain"
                        />
                        <a
                          href={currentTransaction.paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 hover:underline"
                        >
                          View Full Image
                        </a>
                      </div>
                    ) : (
                      <p>No payment proof uploaded.</p>
                    )}
                  </div>

                  {/* Items Information */}
                  {currentTransaction.items && currentTransaction.items.length > 0 && (
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Items</h3>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <ul className="divide-y divide-gray-200">
                          {currentTransaction.items.map((item, index) => (
                            <li key={index} className="py-2">
                              <div className="flex justify-between">
                                <span className="font-medium">{item.activity?.title || "Unknown Activity"}</span>
                                <span>Quantity: {item.quantity || 1}</span>
                              </div>
                              {item.price && (
                                <div className="text-sm text-gray-600">Price: {formatCurrency(item.price)}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                {getActionButtons(currentTransaction)}
                <button
                  onClick={handleCloseViewModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <p>No transaction selected.</p>
          )}
        </Modal>
      </div>
      <BottomNav />
      <Toaster position="bottom-right" />
    </div>
  )
}

export default Transactions
