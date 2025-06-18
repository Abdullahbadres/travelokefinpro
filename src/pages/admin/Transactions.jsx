"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  getAllTransactions,
  updateTransactionStatus,
  getTransactionById,
  getActivityById,
  getAllUsers,
} from "../../api"
import toast from "react-hot-toast"
import {
  Eye,
  CheckCircle,
  Clock,
  X,
  Users,
  Database,
  RefreshCwIcon as Refresh,
  AlertCircle,
  FileText,
} from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons"
import { useAuth } from "../../contexts/AuthContext"
import Modal from "../../components/admin/Modal"

// Define storage keys for consistent access across components
const STORAGE_KEYS = {
  USER_TRANSACTIONS: "userTransactions",
  PAYMENT_PROOFS: "uploadedPaymentProofs",
  CART_TRANSACTIONS: "cartTransactions",
  CHECKOUT_TRANSACTIONS: "checkoutTransactions",
  ADMIN_TRANSACTIONS: "adminTransactions",
  TRANSACTION_HISTORY: "transactionHistory",
  USER_SESSIONS: "userSessions",
  PAYMENT_METHODS: "paymentMethods",
}

// Cache for storing fetched data
const dataCache = {
  users: new Map(),
  activities: new Map(),
  transactions: new Map(),
  paymentMethods: new Map(),
}

// Enhanced transaction status flow
const TRANSACTION_STATUS = {
  PENDING: "pending", // Belum upload bukti bayar dari user
  HOLD: "hold", // Sudah upload bukti bayar, diproses pending oleh admin
  PAID: "paid", // Sudah upload bukti bayar, menunggu verifikasi admin
  COMPLETED: "completed", // Sudah diverifikasi dan diselesaikan oleh admin
  CANCELLED: "cancelled", // Dibatalkan oleh admin
  VERIFIED: "verified", // Alias untuk completed
}

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

  // Enhanced state management for transaction details
  const [transactionDetails, setTransactionDetails] = useState({}) // Store detailed transaction data by ID
  const [loadingDetails, setLoadingDetails] = useState({}) // Track loading state for each transaction detail fetch

  const [loadingSkeletons, setLoadingSkeletons] = useState(Array(5).fill(true))
  const refreshTimeoutRef = useRef(null)
  const { user } = useAuth()

  // Enhanced state for comprehensive data management
  const [dataIntegrationStatus, setDataIntegrationStatus] = useState({
    api: { status: "pending", count: 0, lastFetch: null },
    localStorage: { status: "pending", count: 0, lastScan: null },
    sessionStorage: { status: "pending", count: 0, lastScan: null },
    total: 0,
  })

  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmTransaction, setConfirmTransaction] = useState(null)
  const [isPaymentProofModalOpen, setIsPaymentProofModalOpen] = useState(false)
  const [paymentProofUrl, setPaymentProofUrl] = useState("")
  const [highlightedTransaction, setHighlightedTransaction] = useState(null)

  // Enhanced verification modal states
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const [verificationTransaction, setVerificationTransaction] = useState(null)
  const [verificationAction, setVerificationAction] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

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

  // Enhanced function to fetch detailed transaction data
  const fetchTransactionDetails = useCallback(
    async (transactionId) => {
      // Check if already loading or already have details
      if (loadingDetails[transactionId] || transactionDetails[transactionId]) {
        return transactionDetails[transactionId]
      }

      try {
        // Set loading state
        setLoadingDetails((prev) => ({ ...prev, [transactionId]: true }))

        console.log(`🔍 Fetching detailed data for transaction: ${transactionId}`)

        // Fetch transaction details from API
        const response = await getTransactionById(transactionId)

        if (response.data && response.data.data) {
          const detailedData = response.data.data

          // Store in transactionDetails state
          setTransactionDetails((prev) => ({
            ...prev,
            [transactionId]: {
              ...detailedData,
              fetchedAt: new Date().toISOString(),
              source: "api_detailed",
            },
          }))

          console.log(`✅ Transaction details fetched for: ${transactionId}`)
          return detailedData
        }
      } catch (error) {
        console.error(`❌ Error fetching transaction details for ${transactionId}:`, error)

        // Store error state
        setTransactionDetails((prev) => ({
          ...prev,
          [transactionId]: {
            error: error.message,
            fetchedAt: new Date().toISOString(),
            source: "api_error",
          },
        }))
      } finally {
        // Clear loading state
        setLoadingDetails((prev) => ({ ...prev, [transactionId]: false }))
      }

      return null
    },
    [loadingDetails, transactionDetails],
  )

  // Enhanced function to get transaction details with caching
  const getTransactionDetails = useCallback(
    (transactionId) => {
      const details = transactionDetails[transactionId]
      const isLoading = loadingDetails[transactionId]

      return {
        data: details,
        isLoading,
        hasError: details?.error,
        needsFetch: !details && !isLoading,
      }
    },
    [transactionDetails, loadingDetails],
  )

  // Function untuk generate dummy payment proof URL jika diperlukan
  const generateDummyPaymentProofUrl = (transactionId) => {
    // Generate dummy image URL berdasarkan transaction ID untuk konsistensi
    const imageVariants = [
      "https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Payment+Proof+Uploaded",
      "https://via.placeholder.com/400x300/2196F3/FFFFFF?text=Bank+Transfer+Receipt",
      "https://via.placeholder.com/400x300/FF9800/FFFFFF?text=E-Wallet+Payment",
      "https://via.placeholder.com/400x300/9C27B0/FFFFFF?text=Payment+Receipt",
      "https://via.placeholder.com/400x300/F44336/FFFFFF?text=Transaction+Proof",
    ]

    // Gunakan hash dari transaction ID untuk konsistensi
    const hash = transactionId.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return imageVariants[Math.abs(hash) % imageVariants.length]
  }

  // Enhanced function untuk real-time detection apakah transaction sudah upload bukti bayar
  const hasUploadedPaymentProof = (transaction, paymentProofs = []) => {
    console.log(`🔍 Checking payment proof for transaction ${transaction.id}:`)

    // 1. Check dari transaction object langsung
    if (transaction.paymentProofUrl || transaction.proofPaymentUrl) {
      console.log(`✅ Found payment proof URL in transaction object`)
      return {
        hasProof: true,
        proofUrl: transaction.paymentProofUrl || transaction.proofPaymentUrl,
        source: "transaction_object",
      }
    }

    // 2. Check dari payment proof data yang sudah di-scan
    const matchingProof = paymentProofs.find(
      (proof) =>
        proof.transactionId === transaction.id ||
        proof.id === transaction.id ||
        (proof.transactionId && transaction.id && proof.transactionId.includes(transaction.id)) ||
        (transaction.id && proof.transactionId && transaction.id.includes(proof.transactionId)),
    )

    if (matchingProof) {
      console.log(`✅ Found matching payment proof in scanned data`)
      return {
        hasProof: true,
        proofUrl:
          matchingProof.proofUrl || matchingProof.imageUrl || matchingProof.paymentProofUrl || matchingProof.url,
        source: "scanned_proof_data",
        proofData: matchingProof,
      }
    }

    // 3. Check dari status dan flags yang menandakan sudah upload
    if (
      transaction.hasPaymentProof ||
      transaction.needsVerification ||
      transaction.needsAdminVerification ||
      transaction.status === "hold" ||
      transaction.status === "paid"
    ) {
      console.log(`✅ Found payment proof indicators in transaction status/flags`)
      return {
        hasProof: true,
        proofUrl: null, // Will generate dummy if needed
        source: "status_indicators",
      }
    }

    // 4. Check dari metadata upload
    if (
      transaction.paymentProofUploadedAt ||
      transaction.paymentProofFileName ||
      (transaction.updatedAt &&
        transaction.createdAt &&
        new Date(transaction.updatedAt) > new Date(transaction.createdAt))
    ) {
      console.log(`✅ Found payment proof metadata indicators`)
      return {
        hasProof: true,
        proofUrl: null,
        source: "metadata_indicators",
      }
    }

    console.log(`❌ No payment proof found for transaction ${transaction.id}`)
    return {
      hasProof: false,
      proofUrl: null,
      source: null,
    }
  }

  // Enhanced function to scan ALL localStorage data comprehensively
  const scanAllLocalStorageData = () => {
    try {
      const allTransactions = []
      const allPaymentProofs = []
      const scannedKeys = []

      console.log("🔍 Starting comprehensive localStorage scan...")

      // Scan semua localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        try {
          const data = localStorage.getItem(key)
          if (!data) continue

          // Parse data safely
          let parsedData
          try {
            parsedData = JSON.parse(data)
          } catch (parseError) {
            continue // Skip non-JSON data
          }

          // Check untuk transaction-related data
          if (
            key.toLowerCase().includes("transaction") ||
            key.toLowerCase().includes("checkout") ||
            key.toLowerCase().includes("cart") ||
            key.toLowerCase().includes("order") ||
            key.toLowerCase().includes("payment") ||
            Object.values(STORAGE_KEYS).includes(key)
          ) {
            scannedKeys.push(key)

            // Handle array data
            if (Array.isArray(parsedData)) {
              parsedData.forEach((item) => {
                if (item && typeof item === "object" && item.id) {
                  // Check jika ini transaction
                  if (item.amount || item.total || item.price || item.status || item.transactionId) {
                    allTransactions.push({
                      ...item,
                      source: `localStorage_${key}`,
                      scanTimestamp: new Date().toISOString(),
                    })
                  }
                  // Enhanced payment proof detection - lebih comprehensive
                  if (
                    item.proofUrl ||
                    item.imageUrl ||
                    item.paymentProofUrl ||
                    item.proofPaymentUrl || // Sesuai dengan API
                    item.transactionId ||
                    (item.fileName && (item.fileName.includes("payment") || item.fileName.includes("proof"))) ||
                    item.needsVerification ||
                    item.needsAdminVerification ||
                    item.status === "uploaded" ||
                    item.status === "hold" ||
                    item.status === "paid" ||
                    item.hasPaymentProof ||
                    item.paymentProofUploadedAt ||
                    (item.type && item.type.includes("payment"))
                  ) {
                    allPaymentProofs.push({
                      ...item,
                      source: `localStorage_${key}`,
                      scanTimestamp: new Date().toISOString(),
                    })
                  }
                }
              })
            }
            // Handle single object data
            else if (parsedData && typeof parsedData === "object") {
              if (parsedData.id && (parsedData.amount || parsedData.total || parsedData.status)) {
                allTransactions.push({
                  ...parsedData,
                  source: `localStorage_${key}`,
                  scanTimestamp: new Date().toISOString(),
                })
              }
              // Enhanced payment proof detection untuk single object
              if (
                parsedData.proofUrl ||
                parsedData.imageUrl ||
                parsedData.paymentProofUrl ||
                parsedData.proofPaymentUrl || // Sesuai dengan API
                parsedData.transactionId ||
                (parsedData.fileName &&
                  (parsedData.fileName.includes("payment") || parsedData.fileName.includes("proof"))) ||
                parsedData.needsVerification ||
                parsedData.needsAdminVerification ||
                parsedData.status === "uploaded" ||
                parsedData.status === "hold" ||
                parsedData.status === "paid" ||
                parsedData.hasPaymentProof ||
                parsedData.paymentProofUploadedAt ||
                (parsedData.type && parsedData.type.includes("payment"))
              ) {
                allPaymentProofs.push({
                  ...parsedData,
                  source: `localStorage_${key}`,
                  scanTimestamp: new Date().toISOString(),
                })
              }
            }
          }
        } catch (error) {
          console.warn(`Error processing localStorage key ${key}:`, error)
        }
      }

      console.log(`✅ localStorage scan completed:`, {
        scannedKeys: scannedKeys.length,
        transactions: allTransactions.length,
        paymentProofs: allPaymentProofs.length,
        keys: scannedKeys,
        proofDetails: allPaymentProofs.map((p) => ({
          transactionId: p.transactionId || p.id,
          hasProofUrl: !!(p.proofUrl || p.imageUrl || p.paymentProofUrl || p.proofPaymentUrl),
          source: p.source,
          uploadedAt: p.uploadedAt || p.paymentProofUploadedAt,
          needsVerification: p.needsVerification || p.needsAdminVerification,
          status: p.status,
        })),
      })

      return { transactions: allTransactions, paymentProofs: allPaymentProofs, scannedKeys }
    } catch (error) {
      console.error("❌ Error scanning localStorage:", error)
      return { transactions: [], paymentProofs: [], scannedKeys: [] }
    }
  }

  // Enhanced function to scan sessionStorage data
  const scanAllSessionStorageData = () => {
    try {
      const allTransactions = []
      const scannedKeys = []

      console.log("🔍 Starting sessionStorage scan...")

      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (!key) continue

        try {
          const data = sessionStorage.getItem(key)
          if (!data) continue

          let parsedData
          try {
            parsedData = JSON.parse(data)
          } catch (parseError) {
            continue
          }

          if (
            key.toLowerCase().includes("transaction") ||
            key.toLowerCase().includes("cart") ||
            key.toLowerCase().includes("checkout") ||
            key.toLowerCase().includes("payment")
          ) {
            scannedKeys.push(key)

            if (Array.isArray(parsedData)) {
              parsedData.forEach((item) => {
                if (item && typeof item === "object" && item.id) {
                  allTransactions.push({
                    ...item,
                    source: `sessionStorage_${key}`,
                    scanTimestamp: new Date().toISOString(),
                  })
                }
              })
            } else if (parsedData && typeof parsedData === "object" && parsedData.id) {
              allTransactions.push({
                ...parsedData,
                source: `sessionStorage_${key}`,
                scanTimestamp: new Date().toISOString(),
              })
            }
          }
        } catch (error) {
          console.warn(`Error processing sessionStorage key ${key}:`, error)
        }
      }

      console.log(`✅ sessionStorage scan completed:`, {
        scannedKeys: scannedKeys.length,
        transactions: allTransactions.length,
        keys: scannedKeys,
      })

      return { transactions: allTransactions, scannedKeys }
    } catch (error) {
      console.error("❌ Error scanning sessionStorage:", error)
      return { transactions: [], scannedKeys: [] }
    }
  }

  // Enhanced function to fetch user details with comprehensive caching
  const fetchUserDetails = async (userId) => {
    if (!userId) return null

    // Check cache first
    if (dataCache.users.has(userId)) {
      return dataCache.users.get(userId)
    }

    try {
      const response = await getAllUsers()
      if (response.data && Array.isArray(response.data.data)) {
        const users = response.data.data

        // Cache all users
        users.forEach((userData) => {
          if (userData.id) {
            dataCache.users.set(userData.id, userData)
          }
        })

        const userData = users.find((user) => user.id === userId)
        return userData || null
      }
    } catch (error) {
      console.error(`Error fetching user details for ${userId}:`, error)
    }

    return null
  }

  // Enhanced function to fetch activity details with caching
  const fetchActivityDetails = async (activityId) => {
    if (!activityId) return null

    if (dataCache.activities.has(activityId)) {
      return dataCache.activities.get(activityId)
    }

    try {
      const response = await getActivityById(activityId)
      if (response.data && response.data.data) {
        const activityData = response.data.data
        dataCache.activities.set(activityId, activityData)
        return activityData
      }
    } catch (error) {
      console.error(`Error fetching activity details for ${activityId}:`, error)
    }

    return null
  }

  // Enhanced function to determine transaction status based on payment proof and admin actions
  const determineTransactionStatus = (transaction, paymentProofInfo) => {
    console.log(`🔍 Determining status for transaction ${transaction.id}:`, {
      currentStatus: transaction.status,
      hasPaymentProof: paymentProofInfo.hasProof,
      paymentProofSource: paymentProofInfo.source,
      adminProcessed: transaction.adminProcessed,
      needsVerification: transaction.needsVerification,
      needsAdminVerification: transaction.needsAdminVerification,
    })

    // If transaction has explicit admin status, use it
    if (transaction.adminStatus) {
      console.log(`✅ Using admin status: ${transaction.adminStatus}`)
      return transaction.adminStatus
    }

    // Check if admin has already processed this transaction
    if (transaction.adminProcessed) {
      const finalStatus =
        transaction.adminAction === "approve" || transaction.adminAction === "verify"
          ? TRANSACTION_STATUS.COMPLETED
          : TRANSACTION_STATUS.CANCELLED
      console.log(`✅ Admin processed, final status: ${finalStatus}`)
      return finalStatus
    }

    // Check for payment proof
    if (paymentProofInfo.hasProof) {
      // If payment proof exists, check current status and admin flags
      if (
        transaction.needsAdminVerification ||
        transaction.needsVerification ||
        paymentProofInfo.source === "scanned_proof_data" ||
        paymentProofInfo.source === "transaction_object"
      ) {
        console.log(`✅ Payment proof found, needs verification: ${TRANSACTION_STATUS.PAID}`)
        return TRANSACTION_STATUS.PAID // Ready for admin verification
      }

      // If status is still pending but has proof, move to hold
      if (transaction.status === TRANSACTION_STATUS.PENDING) {
        console.log(`✅ Payment proof found, moving from pending to: ${TRANSACTION_STATUS.HOLD}`)
        return TRANSACTION_STATUS.HOLD
      }

      // If already in hold or paid status, keep it
      if ([TRANSACTION_STATUS.HOLD, TRANSACTION_STATUS.PAID].includes(transaction.status)) {
        console.log(`✅ Keeping current status: ${transaction.status}`)
        return transaction.status
      }

      // Default to paid if has proof but no clear status
      console.log(`✅ Has proof, defaulting to: ${TRANSACTION_STATUS.PAID}`)
      return TRANSACTION_STATUS.PAID
    }

    // No payment proof uploaded yet
    console.log(`✅ No payment proof, status: ${TRANSACTION_STATUS.PENDING}`)
    return TRANSACTION_STATUS.PENDING
  }

  // Enhanced comprehensive transaction fetching function
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setApiError(null)
      console.log("🚀 Starting comprehensive transaction integration...")

      const integrationStatus = {
        api: { status: "pending", count: 0, lastFetch: null },
        localStorage: { status: "pending", count: 0, lastScan: null },
        sessionStorage: { status: "pending", count: 0, lastScan: null },
        total: 0,
      }

      // 1. Fetch from API
      let apiTransactions = []
      try {
        console.log("📡 Fetching from API...")
        const response = await getAllTransactions()

        if (response.data && Array.isArray(response.data.data)) {
          apiTransactions = response.data.data.map((t) => ({
            ...t,
            source: "api",
            fetchTimestamp: new Date().toISOString(),
          }))

          integrationStatus.api = {
            status: "success",
            count: apiTransactions.length,
            lastFetch: new Date().toISOString(),
          }

          console.log(`✅ API transactions fetched: ${apiTransactions.length}`)
        }
      } catch (apiError) {
        console.error("❌ API fetch error:", apiError)
        integrationStatus.api = {
          status: "error",
          count: 0,
          lastFetch: new Date().toISOString(),
          error: apiError.message,
        }
      }

      // 2. Scan localStorage comprehensively
      let localStorageData = { transactions: [], paymentProofs: [] }
      try {
        console.log("💾 Scanning localStorage...")
        localStorageData = scanAllLocalStorageData()

        integrationStatus.localStorage = {
          status: "success",
          count: localStorageData.transactions.length,
          lastScan: new Date().toISOString(),
          scannedKeys: localStorageData.scannedKeys,
        }

        console.log(`✅ localStorage transactions found: ${localStorageData.transactions.length}`)
        console.log(`✅ localStorage payment proofs found: ${localStorageData.paymentProofs.length}`)
      } catch (localError) {
        console.error("❌ localStorage scan error:", localError)
        integrationStatus.localStorage = {
          status: "error",
          count: 0,
          lastScan: new Date().toISOString(),
          error: localError.message,
        }
      }

      // 3. Scan sessionStorage
      let sessionStorageData = { transactions: [] }
      try {
        console.log("🔄 Scanning sessionStorage...")
        sessionStorageData = scanAllSessionStorageData()

        integrationStatus.sessionStorage = {
          status: "success",
          count: sessionStorageData.transactions.length,
          lastScan: new Date().toISOString(),
        }

        console.log(`✅ sessionStorage transactions found: ${sessionStorageData.transactions.length}`)
      } catch (sessionError) {
        console.error("❌ sessionStorage scan error:", sessionError)
        integrationStatus.sessionStorage = {
          status: "error",
          count: 0,
          lastScan: new Date().toISOString(),
          error: sessionError.message,
        }
      }

      // 4. Combine and deduplicate transactions
      const allTransactions = [...apiTransactions, ...localStorageData.transactions, ...sessionStorageData.transactions]

      console.log(`📊 Total transactions before deduplication: ${allTransactions.length}`)

      // Enhanced deduplication with priority: API > localStorage > sessionStorage
      const uniqueTransactions = []
      const transactionIds = new Set()
      const duplicateLog = []

      // Sort by priority (API first, then by timestamp)
      const sortedTransactions = allTransactions.sort((a, b) => {
        if (a.source === "api" && b.source !== "api") return -1
        if (a.source !== "api" && b.source === "api") return 1

        const dateA = new Date(a.createdAt || a.timestamp || 0)
        const dateB = new Date(b.createdAt || b.timestamp || 0)
        return dateB - dateA
      })

      for (const transaction of sortedTransactions) {
        if (transaction.id && !transactionIds.has(transaction.id)) {
          uniqueTransactions.push(transaction)
          transactionIds.add(transaction.id)
        } else if (transaction.id) {
          duplicateLog.push({
            id: transaction.id,
            source: transaction.source,
            duplicate: true,
          })
        }
      }

      console.log(`✅ Unique transactions after deduplication: ${uniqueTransactions.length}`)
      if (duplicateLog.length > 0) {
        console.log(`🔄 Duplicates removed: ${duplicateLog.length}`, duplicateLog)
      }

      // 5. Enhance transactions with payment proofs and determine proper status
      console.log("🔍 Enhancing transactions with payment proofs...")
      const enhancedTransactions = uniqueTransactions.map((transaction) => {
        // Real-time detection of payment proof
        const paymentProofInfo = hasUploadedPaymentProof(transaction, localStorageData.paymentProofs)

        console.log(`🔍 Processing transaction ${transaction.id}:`, {
          hasPaymentProof: paymentProofInfo.hasProof,
          proofSource: paymentProofInfo.source,
          currentStatus: transaction.status,
          proofUrl: !!paymentProofInfo.proofUrl,
        })

        // Determine the correct status based on payment proof and admin actions
        const correctStatus = determineTransactionStatus(transaction, paymentProofInfo)

        // Get payment proof URL, generate dummy if needed
        let paymentProofUrl = paymentProofInfo.proofUrl

        // Jika tidak ada payment proof URL tapi terdeteksi ada bukti bayar, generate dummy
        if (!paymentProofUrl && paymentProofInfo.hasProof) {
          paymentProofUrl = generateDummyPaymentProofUrl(transaction.id)
          console.log(`🖼️ Generated dummy payment proof for transaction ${transaction.id}`)
        }

        const enhancedTransaction = {
          ...transaction,
          status: correctStatus,
          paymentProofUrl: paymentProofUrl,
          paymentProofData: paymentProofInfo.proofData,
          hasPaymentProof: paymentProofInfo.hasProof,
          updatedAt:
            paymentProofInfo.proofData?.uploadedAt || paymentProofInfo.proofData?.timestamp || transaction.updatedAt,

          // Enhanced verification tracking
          needsVerification:
            paymentProofInfo.proofData?.needsVerification || transaction.needsVerification || paymentProofInfo.hasProof,
          needsAdminVerification:
            paymentProofInfo.proofData?.needsAdminVerification ||
            transaction.needsAdminVerification ||
            paymentProofInfo.hasProof,
          verificationHistory: transaction.verificationHistory || [],
          adminNotes: transaction.adminNotes || "",
          lastAdminAction: transaction.lastAdminAction || null,
          adminActionBy: transaction.adminActionBy || null,
          adminActionAt: transaction.adminActionAt || null,

          // Payment proof metadata
          paymentProofUploadedAt: paymentProofInfo.proofData?.uploadedAt || transaction.paymentProofUploadedAt,
          paymentProofFileName: paymentProofInfo.proofData?.fileName || null,
          paymentProofFileSize: paymentProofInfo.proofData?.fileSize || null,

          // Real-time detection metadata
          paymentProofSource: paymentProofInfo.source,
          isDummyPaymentProof: !paymentProofInfo.proofUrl && paymentProofInfo.hasProof,
        }

        console.log(`✅ Enhanced transaction ${transaction.id}:`, {
          finalStatus: enhancedTransaction.status,
          hasPaymentProof: enhancedTransaction.hasPaymentProof,
          paymentProofUrl: !!enhancedTransaction.paymentProofUrl,
          needsVerification: enhancedTransaction.needsVerification,
          paymentProofSource: enhancedTransaction.paymentProofSource,
        })

        return enhancedTransaction
      })

      console.log("✅ Payment proof enhancement completed:", {
        totalTransactions: enhancedTransactions.length,
        withPaymentProof: enhancedTransactions.filter((t) => t.hasPaymentProof).length,
        needingVerification: enhancedTransactions.filter((t) => t.needsVerification).length,
        realTimeDetected: enhancedTransactions.filter((t) => t.paymentProofSource).length,
        statusBreakdown: {
          pending: enhancedTransactions.filter((t) => t.status === TRANSACTION_STATUS.PENDING).length,
          hold: enhancedTransactions.filter((t) => t.status === TRANSACTION_STATUS.HOLD).length,
          paid: enhancedTransactions.filter((t) => t.status === TRANSACTION_STATUS.PAID).length,
          completed: enhancedTransactions.filter((t) => t.status === TRANSACTION_STATUS.COMPLETED).length,
          cancelled: enhancedTransactions.filter((t) => t.status === TRANSACTION_STATUS.CANCELLED).length,
        },
      })

      // 6. Enrich with user data only (removed activity fetching for performance)
      console.log("🔍 Enriching transactions with user data...")
      const enrichedTransactions = await Promise.all(
        enhancedTransactions.map(async (transaction) => {
          try {
            // Fetch user details only
            let userData = null
            if (transaction.userId) {
              userData = await fetchUserDetails(transaction.userId)
            }

            // Calculate proper amounts from transaction data directly
            let totalAmount = 0
            let quantity = 1

            // Get quantity from various sources
            quantity = transaction.quantity || transaction.qty || (transaction.items && transaction.items.length) || 1

            // Calculate total amount with priority order
            if (transaction.totalAmount) {
              totalAmount = transaction.totalAmount
            } else if (transaction.amount) {
              totalAmount = transaction.amount
            } else if (transaction.total) {
              totalAmount = transaction.total
            } else if (transaction.items && transaction.items.length > 0) {
              // Calculate from items if available
              totalAmount = transaction.items.reduce((sum, item) => {
                const itemPrice = item.price || 0
                const itemQty = item.quantity || 1
                return sum + itemPrice * itemQty
              }, 0)
            }

            // Enhanced transaction object (simplified without activity details)
            return {
              ...transaction,
              // User information
              user: {
                id: transaction.userId || transaction.user?.id,
                name: userData?.name || transaction.userName || transaction.user?.name || "Unknown User",
                email: userData?.email || transaction.userEmail || transaction.user?.email || "No email",
                phone: userData?.phone || transaction.userPhone || transaction.user?.phone || "No phone",
                role: userData?.role || transaction.userRole || transaction.user?.role || "user",
                avatar: userData?.profilePictureUrl || transaction.user?.avatar || null,
              },
              // Payment method information
              paymentMethod: {
                id: transaction.paymentMethodId || transaction.paymentMethod?.id,
                name: transaction.paymentMethodName || transaction.paymentMethod?.name || "Unknown Method",
              },
              // Enhanced amount and quantity
              amount: totalAmount,
              totalAmount: totalAmount,
              quantity: quantity,

              // Enhanced verification status
              canVerify:
                transaction.status === TRANSACTION_STATUS.PAID || transaction.status === TRANSACTION_STATUS.HOLD,
              canCancel: [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.HOLD, TRANSACTION_STATUS.PAID].includes(
                transaction.status,
              ),
              isVerified: transaction.status === TRANSACTION_STATUS.COMPLETED,
              isCancelled: transaction.status === TRANSACTION_STATUS.CANCELLED,

              // Debug information
              _debug: {
                originalAmount: transaction.amount,
                originalTotal: transaction.total,
                calculatedAmount: totalAmount,
                quantity: quantity,
                dataSource: transaction.source,
                originalStatus: transaction.status,
                determinedStatus: transaction.status,
                paymentProofSource: transaction.paymentProofSource,
              },
            }
          } catch (enrichError) {
            console.warn(`Error enriching transaction ${transaction.id}:`, enrichError)

            // Return transaction with fallback values
            return {
              ...transaction,
              user: {
                id: transaction.userId || transaction.user?.id,
                name: transaction.userName || transaction.user?.name || "Unknown User",
                email: transaction.userEmail || transaction.user?.email || "No email",
                phone: transaction.userPhone || transaction.user?.phone || "No phone",
                role: transaction.userRole || transaction.user?.role || "user",
                avatar: transaction.user?.avatar || null,
              },
              paymentMethod: {
                id: transaction.paymentMethodId || transaction.paymentMethod?.id,
                name: transaction.paymentMethodName || transaction.paymentMethod?.name || "Unknown Method",
              },
              amount: transaction.amount || transaction.total || 0,
              totalAmount: transaction.amount || transaction.total || 0,
              quantity: transaction.quantity || 1,
              canVerify: false,
              canCancel: false,
              isVerified: false,
              isCancelled: false,
            }
          }
        }),
      )

      // 7. Sort by creation date (newest first)
      enrichedTransactions.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0)
        const dateB = new Date(b.createdAt || b.timestamp || 0)
        return dateB - dateA
      })

      // 8. Check for new transactions (using ref to avoid dependency loop)
      const currentTransactionIds = enrichedTransactions.map((t) => t.id)
      const newTransactionsList = enrichedTransactions.filter(
        (t) => t.status === TRANSACTION_STATUS.PAID || (t.paymentProofUrl && t.status === TRANSACTION_STATUS.HOLD),
      )

      // Only show new transaction notification if we have previous data
      if (newTransactionsList.length > 0 && !loading) {
        const hasNewVerifications = newTransactionsList.some(
          (t) => (t.status === TRANSACTION_STATUS.PAID || t.status === TRANSACTION_STATUS.HOLD) && t.paymentProofUrl,
        )

        if (hasNewVerifications) {
          setNewTransactions(newTransactionsList.slice(0, 5)) // Limit to prevent performance issues
        }
      }

      // 9. Update state
      integrationStatus.total = enrichedTransactions.length
      setDataIntegrationStatus(integrationStatus)
      setTransactions(enrichedTransactions)
      setLastRefreshed(new Date())
      setLoadingSkeletons(Array(5).fill(false))

      // 10. Log final results
      console.log("🎉 Transaction integration completed successfully:", {
        total: enrichedTransactions.length,
        api: integrationStatus.api.count,
        localStorage: integrationStatus.localStorage.count,
        sessionStorage: integrationStatus.sessionStorage.count,
        withPaymentProof: enrichedTransactions.filter((t) => t.paymentProofUrl).length,
        realTimeDetected: enrichedTransactions.filter((t) => t.paymentProofSource).length,
        byStatus: {
          pending: enrichedTransactions.filter((t) => t.status === TRANSACTION_STATUS.PENDING).length,
          hold: enrichedTransactions.filter((t) => t.status === TRANSACTION_STATUS.HOLD).length,
          paid: enrichedTransactions.filter((t) => t.status === TRANSACTION_STATUS.PAID).length,
          completed: enrichedTransactions.filter((t) => t.status === TRANSACTION_STATUS.COMPLETED).length,
          cancelled: enrichedTransactions.filter((t) => t.status === TRANSACTION_STATUS.CANCELLED).length,
        },
      })

      // Show success notification
      if (enrichedTransactions.length > 0) {
        const proofCount = enrichedTransactions.filter((t) => t.hasPaymentProof).length
        toast.success(
          `✅ Successfully integrated ${enrichedTransactions.length} transactions (${proofCount} with payment proofs)`,
        )
      }
    } catch (error) {
      console.error("❌ Critical error in transaction integration:", error)
      setApiError(`Failed to integrate transactions: ${error.message}`)
      toast.error("Failed to integrate transaction data")
      setLoadingSkeletons(Array(5).fill(false))
    } finally {
      setLoading(false)
    }
  }, [refreshTrigger])

  // Enhanced function to handle transaction verification with detailed tracking
  const handleTransactionVerification = async (transactionId, action, notes = "") => {
    try {
      setIsProcessing(true)
      console.log(`🔄 Processing verification for transaction ${transactionId}: ${action}`)

      const loadingToastId = toast.loading(`Processing ${action}...`)

      // Determine new status based on action
      let newStatus
      switch (action) {
        case "verify":
        case "approve":
          newStatus = TRANSACTION_STATUS.COMPLETED
          break
        case "cancel":
        case "reject":
          newStatus = TRANSACTION_STATUS.CANCELLED
          break
        case "hold":
          newStatus = TRANSACTION_STATUS.HOLD
          break
        case "paid":
          newStatus = TRANSACTION_STATUS.PAID
          break
        default:
          newStatus = action
      }

      try {
        // Update via API
        const response = await updateTransactionStatus(transactionId, {
          status: newStatus,
          reason: notes,
          adminAction: action,
          adminNotes: notes,
        })

        if (response.data && (response.data.code === "200" || response.data.status === "success")) {
          // Create verification history entry
          const verificationEntry = {
            action: action,
            status: newStatus,
            adminId: user?.id,
            adminName: user?.name || "Admin",
            notes: notes,
            timestamp: new Date().toISOString(),
          }

          // Update local state with enhanced tracking
          setTransactions((prevTransactions) =>
            prevTransactions.map((transaction) =>
              transaction.id === transactionId
                ? {
                    ...transaction,
                    status: newStatus,
                    updatedAt: new Date().toISOString(),
                    adminNotes: notes,
                    lastAdminAction: action,
                    adminActionBy: user?.name || "Admin",
                    adminActionAt: new Date().toISOString(),
                    adminProcessed: true,
                    adminAction: action,
                    verificationHistory: [...(transaction.verificationHistory || []), verificationEntry],
                  }
                : transaction,
            ),
          )

          // Update all localStorage sources with verification tracking
          const updateData = {
            status: newStatus,
            updatedAt: new Date().toISOString(),
            adminNotes: notes,
            lastAdminAction: action,
            adminActionBy: user?.name || "Admin",
            adminActionAt: new Date().toISOString(),
            adminProcessed: true,
            adminAction: action,
            verificationHistory: [verificationEntry],
          }

          // Update all possible localStorage keys
          Object.values(STORAGE_KEYS).forEach((key) => {
            try {
              const data = localStorage.getItem(key)
              if (data) {
                const parsedData = JSON.parse(data)
                if (Array.isArray(parsedData)) {
                  const updatedData = parsedData.map((item) =>
                    item.id === transactionId ? { ...item, ...updateData } : item,
                  )
                  localStorage.setItem(key, JSON.stringify(updatedData))
                }
              }
            } catch (error) {
              console.warn(`Error updating localStorage key ${key}:`, error)
            }
          })

          toast.dismiss(loadingToastId)
          toast.success(`✅ Transaction ${action}ed successfully`)

          // Dispatch comprehensive verification event for user notification
          const verificationEvent = new CustomEvent("transactionVerified", {
            detail: {
              transactionId,
              action,
              newStatus,
              notes,
              adminName: user?.name || "Admin",
              timestamp: new Date().toISOString(),
              source: "admin_verification",
            },
          })
          window.dispatchEvent(verificationEvent)

          // Also dispatch status update event
          const statusUpdateEvent = new CustomEvent("transactionStatusUpdated", {
            detail: {
              transactionId,
              newStatus,
              reason: notes,
              updatedBy: user?.name || "Admin",
              timestamp: new Date().toISOString(),
              source: "admin_dashboard",
              action: action,
            },
          })
          window.dispatchEvent(statusUpdateEvent)

          console.log(`✅ Verification events dispatched for transaction: ${transactionId}`)
        } else {
          toast.dismiss(loadingToastId)
          throw new Error(`Failed to ${action} transaction`)
        }
      } catch (apiError) {
        toast.dismiss(loadingToastId)
        console.error(`❌ API Error during verification:`, apiError)

        if (apiError.response?.status === 403) {
          toast.error(`❌ Permission denied. Admin rights required.`)
        } else if (apiError.response?.status === 404) {
          toast.error(`❌ Transaction not found.`)
        } else {
          toast.error(`❌ Failed to ${action} transaction: ${apiError.message}`)
        }
      }

      // Close modals
      if (isViewModalOpen && currentTransaction?.id === transactionId) {
        handleCloseViewModal()
      }
      if (isVerificationModalOpen) {
        setIsVerificationModalOpen(false)
        setVerificationTransaction(null)
        setVerificationAction("")
        setAdminNotes("")
      }

      setShowActionMenu(null)
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error(`❌ Error during verification:`, error)
      toast.error(`❌ Failed to ${action} transaction: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Enhanced function to handle verification modal
  const handleOpenVerificationModal = (transaction, action) => {
    setVerificationTransaction(transaction)
    setVerificationAction(action)
    setAdminNotes("")
    setIsVerificationModalOpen(true)
  }

  const handleCloseVerificationModal = () => {
    setIsVerificationModalOpen(false)
    setVerificationTransaction(null)
    setVerificationAction("")
    setAdminNotes("")
  }

  const executeVerification = () => {
    if (verificationTransaction && verificationAction) {
      handleTransactionVerification(verificationTransaction.id, verificationAction, adminNotes)
    }
  }

  // Legacy function for backward compatibility
  const handleUpdateStatus = async (transactionId, newStatus, reason = "") => {
    return handleTransactionVerification(transactionId, newStatus, reason)
  }

  // Function untuk handle confirmation modal
  const handleConfirmAction = (action, transaction) => {
    handleOpenVerificationModal(transaction, action)
  }

  const executeConfirmedAction = () => {
    executeVerification()
  }

  // Enhanced function untuk open transaction details modal with detailed data fetching
  const handleOpenViewModal = async (transaction) => {
    try {
      setCurrentTransaction(transaction)
      setIsViewModalOpen(true)

      // Check if we need to fetch detailed data
      const detailsState = getTransactionDetails(transaction.id)

      if (detailsState.needsFetch) {
        // Fetch detailed transaction data
        const detailedData = await fetchTransactionDetails(transaction.id)

        if (detailedData) {
          // Merge detailed data with current transaction
          setCurrentTransaction((prev) => ({
            ...prev,
            ...detailedData,
            detailedDataFetched: true,
          }))
        }
      } else if (detailsState.data && !detailsState.hasError) {
        // Use cached detailed data
        setCurrentTransaction((prev) => ({
          ...prev,
          ...detailsState.data,
          detailedDataFetched: true,
        }))
      }
    } catch (error) {
      console.error("Error opening view modal:", error)
      toast.error("Failed to open transaction details")
    }
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setCurrentTransaction(null)
  }

  // Initial data load and setup real-time refresh
  useEffect(() => {
    console.log("🚀 Initializing admin transaction dashboard...")
    fetchTransactions()
  }, [fetchTransactions])

  // Separate useEffect for auto-refresh interval
  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Setup real-time refresh every 15 seconds for better performance
    const interval = setInterval(() => {
      console.log("⏰ Auto-refreshing transactions...")
      setRefreshTrigger((prev) => prev + 1)
    }, 15000)

    return () => {
      clearInterval(interval)
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  // Enhanced event listeners untuk comprehensive real-time updates
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Monitor ALL storage changes yang mungkin berisi transaction data
      if (
        e.key &&
        (e.key.toLowerCase().includes("transaction") ||
          e.key.toLowerCase().includes("payment") ||
          e.key.toLowerCase().includes("checkout") ||
          e.key.toLowerCase().includes("cart") ||
          e.key.toLowerCase().includes("order") ||
          Object.values(STORAGE_KEYS).includes(e.key))
      ) {
        console.log("🔄 Storage change detected, refreshing:", e.key)

        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current)
        }

        refreshTimeoutRef.current = setTimeout(() => {
          setRefreshTrigger((prev) => prev + 1)
        }, 500) // Lebih cepat untuk real-time feel
      }
    }

    // Enhanced event handlers untuk semua kemungkinan transaction events
    const eventHandlers = {
      newTransactionCreated: (event) => {
        console.log("🆕 New transaction created:", event.detail)
        toast.success(`New transaction: ${event.detail.transactionId?.substring(0, 8)}...`)
        setRefreshTrigger((prev) => prev + 1)
      },
      paymentProofUploaded: (event) => {
        console.log("💳 Payment proof uploaded:", event.detail)

        // Show notification dengan detail user
        const userName = event.detail.userName || event.detail.userEmail || "Unknown User"
        toast.success(`🔔 New payment proof uploaded by ${userName}`, {
          duration: 6000,
          icon: "💳",
        })

        // Immediate refresh untuk admin
        setRefreshTrigger((prev) => prev + 1)

        // Highlight transaction jika ada
        if (event.detail.transactionId) {
          setHighlightedTransaction(event.detail.transactionId)
          setTimeout(() => setHighlightedTransaction(null), 5000)
        }
      },
      adminTransactionUpdate: (event) => {
        console.log("⚡ Admin transaction update:", event.detail)

        if (event.detail.type === "payment_proof_uploaded" && event.detail.requiresAction) {
          toast.success(`🚨 Transaction ${event.detail.transactionId?.substring(0, 8)}... requires verification!`, {
            duration: 8000,
            icon: "🚨",
          })
        }

        setRefreshTrigger((prev) => prev + 1)
      },
      transactionUpdated: (event) => {
        console.log("🔄 Transaction updated:", event.detail)
        setRefreshTrigger((prev) => prev + 1)
      },
      userCheckoutCompleted: (event) => {
        console.log("✅ User checkout completed:", event.detail)
        toast.info(`New checkout completed by ${event.detail.userName}`)
        setRefreshTrigger((prev) => prev + 1)
      },
      cartTransactionCreated: (event) => {
        console.log("🛒 Cart transaction created:", event.detail)
        setRefreshTrigger((prev) => prev + 1)
      },
    }

    // Register semua event listeners
    window.addEventListener("storage", handleStorageChange)
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      window.addEventListener(eventName, handler)
    })

    console.log("✅ All enhanced event listeners registered for admin dashboard")

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        window.removeEventListener(eventName, handler)
      })

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      console.log("🧹 All event listeners cleaned up")
    }
  }, [])

  // Real-time notification system
  useEffect(() => {
    const priorityTransactions = getPriorityTransactions()

    if (priorityTransactions.length > 0 && !loading) {
      const newVerificationCount = priorityTransactions.filter((t) => isNewPaymentProof(t)).length

      if (newVerificationCount > 0) {
        toast.success(
          `🔔 ${newVerificationCount} new payment proof${newVerificationCount > 1 ? "s" : ""} waiting for verification!`,
          {
            duration: 6000,
            icon: "🔔",
          },
        )
      }
    }
  }, [transactions, loading])

  // Keyboard shortcuts for admin efficiency
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (user?.role !== "admin" || isViewModalOpen || isVerificationModalOpen) return

      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault()
        handleManualRefresh()
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault()
        document.getElementById("search-transactions")?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [user, isViewModalOpen, isVerificationModalOpen])

  // Auto-scroll to new transactions
  useEffect(() => {
    if (newTransactions.length > 0) {
      setTimeout(() => {
        const firstNewTransaction = document.getElementById(`transaction-${newTransactions[0].id}`)
        if (firstNewTransaction) {
          firstNewTransaction.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
          setHighlightedTransaction(newTransactions[0].id)
          setTimeout(() => setHighlightedTransaction(null), 3000)
        }
      }, 1000)
    }
  }, [newTransactions])

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

  // Filter transactions based on search and status
  const filteredTransactions = transactions.filter((transaction) => {
    const statusMatch = filterStatus === "all" || transaction.status === filterStatus

    const searchLower = searchQuery.toLowerCase()
    const idMatch = transaction.id?.toLowerCase().includes(searchLower)
    const userNameMatch = transaction.user?.name?.toLowerCase().includes(searchLower)
    const userEmailMatch = transaction.user?.email?.toLowerCase().includes(searchLower)

    return statusMatch && (searchQuery === "" || idMatch || userNameMatch || userEmailMatch)
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString("id-ID")
    } catch (error) {
      return "Invalid Date"
    }
  }

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "Rp0"
    return `Rp${Number.parseFloat(amount).toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const getStatusBadge = (status) => {
    const badgeStyles = {
      [TRANSACTION_STATUS.PENDING]: "bg-yellow-100 text-yellow-800",
      [TRANSACTION_STATUS.HOLD]: "bg-blue-100 text-blue-800",
      [TRANSACTION_STATUS.PAID]: "bg-indigo-100 text-indigo-800",
      [TRANSACTION_STATUS.COMPLETED]: "bg-green-100 text-green-800",
      [TRANSACTION_STATUS.VERIFIED]: "bg-green-100 text-green-800",
      [TRANSACTION_STATUS.CANCELLED]: "bg-red-100 text-red-800",
    }

    return `inline-flex items-center px-2 py-1 rounded-full ${badgeStyles[status] || "bg-gray-100 text-gray-800"}`
  }

  const formatStatus = (status) => {
    if (!status) return "Unknown"

    const statusLabels = {
      [TRANSACTION_STATUS.PENDING]: "Pending Payment",
      [TRANSACTION_STATUS.HOLD]: "Payment Uploaded",
      [TRANSACTION_STATUS.PAID]: "Awaiting Verification",
      [TRANSACTION_STATUS.COMPLETED]: "Completed",
      [TRANSACTION_STATUS.VERIFIED]: "Verified",
      [TRANSACTION_STATUS.CANCELLED]: "Cancelled",
    }

    return statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Enhanced status description for user understanding
  const getStatusDescription = (status) => {
    const descriptions = {
      [TRANSACTION_STATUS.PENDING]: "User needs to upload payment proof",
      [TRANSACTION_STATUS.HOLD]: "Payment proof uploaded, pending admin review",
      [TRANSACTION_STATUS.PAID]: "Payment proof verified, awaiting final confirmation",
      [TRANSACTION_STATUS.COMPLETED]: "Transaction completed successfully",
      [TRANSACTION_STATUS.VERIFIED]: "Transaction verified and completed",
      [TRANSACTION_STATUS.CANCELLED]: "Transaction cancelled by admin",
    }

    return descriptions[status] || "Status unknown"
  }

  // Simplified pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="bg-white px-2 py-3 flex items-center justify-center border-t border-gray-200 mt-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2">
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

          {currentPage > 3 && totalPages > 4 && (
            <span className="relative inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700">
              ...
            </span>
          )}

          {Array.from({ length: Math.min(3, totalPages - 2) }, (_, i) => {
            const page = Math.max(2, Math.min(totalPages - 1, currentPage - 1 + i))
            if (page === 1 || page === totalPages) return null

            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center justify-center w-8 h-8 rounded-md border text-sm font-medium ${
                  currentPage === page
                    ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                    : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            )
          })}

          {currentPage < totalPages - 2 && totalPages > 4 && (
            <span className="relative inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700">
              ...
            </span>
          )}

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

  // Enhanced helper functions
  const getPriorityTransactions = () => {
    return transactions.filter(
      (t) =>
        t.status === TRANSACTION_STATUS.PAID ||
        (t.status === TRANSACTION_STATUS.HOLD && t.paymentProofUrl) ||
        t.needsVerification ||
        t.needsAdminVerification,
    )
  }

  const isNewPaymentProof = (transaction) => {
    if (!transaction.paymentProofUploadedAt && !transaction.updatedAt) return false

    const uploadTime = new Date(transaction.paymentProofUploadedAt || transaction.updatedAt)
    const now = new Date()
    const timeDiff = now - uploadTime

    // Consider as "new" if uploaded within last 30 minutes
    return timeDiff < 30 * 60 * 1000
  }

  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh triggered")
    setRefreshTrigger((prev) => prev + 1)
    toast.success("Refreshing transactions...")
  }

  const handlePaymentProofView = (url) => {
    setPaymentProofUrl(url)
    setIsPaymentProofModalOpen(true)
  }

  const handleClosePaymentProofModal = () => {
    setIsPaymentProofModalOpen(false)
    setPaymentProofUrl("")
  }

  // Enhanced action menu component
  const ActionMenu = ({ transaction, onClose }) => {
    const canVerify = transaction.status === TRANSACTION_STATUS.PAID || transaction.status === TRANSACTION_STATUS.HOLD
    const canCancel = [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.HOLD, TRANSACTION_STATUS.PAID].includes(
      transaction.status,
    )

    return (
      <div className="action-menu-container absolute right-0 top-8 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
        <div className="py-1" role="menu">
          <button
            onClick={() => {
              handleOpenViewModal(transaction)
              onClose()
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
          >
            <Eye className="mr-3 h-4 w-4" />
            View Details
          </button>

          {canVerify && (
            <>
              <button
                onClick={() => {
                  handleOpenVerificationModal(transaction, "verify")
                  onClose()
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                role="menuitem"
              >
                <CheckCircle className="mr-3 h-4 w-4" />
                Verify Payment
              </button>

              <button
                onClick={() => {
                  handleOpenVerificationModal(transaction, "hold")
                  onClose()
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                role="menuitem"
              >
                <Clock className="mr-3 h-4 w-4" />
                Put on Hold
              </button>
            </>
          )}

          {canCancel && (
            <button
              onClick={() => {
                handleOpenVerificationModal(transaction, "cancel")
                onClose()
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              role="menuitem"
            >
              <X className="mr-3 h-4 w-4" />
              Cancel Transaction
            </button>
          )}

          {transaction.paymentProofUrl && (
            <button
              onClick={() => {
                handlePaymentProofView(transaction.paymentProofUrl)
                onClose()
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
              role="menuitem"
            >
              <FileText className="mr-3 h-4 w-4" />
              View Payment Proof
            </button>
          )}
        </div>
      </div>
    )
  }

  // Enhanced loading skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white shadow rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  )

  // Enhanced transaction card component
  const TransactionCard = ({ transaction, isHighlighted }) => {
    return (
      <div
        id={`transaction-${transaction.id}`}
        className={`bg-white shadow rounded-lg p-4 sm:p-6 transition-all duration-300 ${
          isHighlighted ? "ring-2 ring-[#FF7757] shadow-lg" : ""
        } hover:shadow-md`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-[#FF7757] to-[#E66647] flex items-center justify-center">
              <span className="text-white font-bold text-lg">TX</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                Transaction #{transaction.id.substring(0, 8)}...
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">ID: {transaction.id}</p>
              <p className="text-xs text-gray-400">
                {formatDate(transaction.createdAt)} {transaction.source && `• ${transaction.source}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(transaction.status)}`}>
              {formatStatus(transaction.status)}
            </span>

            <div className="relative">
              <button
                onClick={() => setShowActionMenu(showActionMenu === transaction.id ? null : transaction.id)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4 text-gray-400" />
              </button>

              {showActionMenu === transaction.id && (
                <ActionMenu transaction={transaction} onClose={() => setShowActionMenu(null)} />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Customer</p>
            <p className="text-sm font-medium text-gray-900">{transaction.user?.name || "Unknown User"}</p>
            <p className="text-xs text-gray-500">{transaction.user?.email || "No email"}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
            <p className="text-xs text-gray-500">Qty: {transaction.quantity || 1}</p>
          </div>
        </div>

        {/* Payment Proof Indicator */}
        {transaction.paymentProofUrl && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Payment Proof Available</span>
                {transaction.isDummyPaymentProof && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Demo</span>
                )}
              </div>
              <button
                onClick={() => handlePaymentProofView(transaction.paymentProofUrl)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View
              </button>
            </div>
            {transaction.paymentProofSource && (
              <p className="text-xs text-blue-600 mt-1">Source: {transaction.paymentProofSource}</p>
            )}
          </div>
        )}

        {/* Status Description */}
        <div className="mb-4">
          <p className="text-xs text-gray-500">{getStatusDescription(transaction.status)}</p>
          {transaction.adminNotes && (
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-medium">Admin Notes:</span> {transaction.adminNotes}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleOpenViewModal(transaction)}
            className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Eye className="inline h-3 w-3 mr-1" />
            View
          </button>

          {(transaction.status === TRANSACTION_STATUS.PAID || transaction.status === TRANSACTION_STATUS.HOLD) && (
            <>
              <button
                onClick={() => handleOpenVerificationModal(transaction, "verify")}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="inline h-3 w-3 mr-1" />
                Verify
              </button>

              <button
                onClick={() => handleOpenVerificationModal(transaction, "cancel")}
                disabled={isProcessing}
                className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <X className="inline h-3 w-3 mr-1" />
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && transaction._debug && (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-gray-500">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(transaction._debug, null, 2)}
            </pre>
          </details>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor and manage all transactions with real-time payment proof detection
            </p>
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <span>Last updated: {formatDate(lastRefreshed.toISOString())}</span>
              <span>•</span>
              <span>Total: {transactions.length}</span>
              <span>•</span>
              <span>With Payment Proof: {transactions.filter((t) => t.hasPaymentProof).length}</span>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7757] disabled:opacity-50"
            >
              <Refresh className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Enhanced Data Integration Status */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">API Data</p>
                <p className="text-xs text-blue-700">
                  {dataIntegrationStatus.api.count} transactions
                  {dataIntegrationStatus.api.status === "error" && " (Error)"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Local Storage</p>
                <p className="text-xs text-green-700">
                  {dataIntegrationStatus.localStorage.count} transactions
                  {dataIntegrationStatus.localStorage.scannedKeys &&
                    ` (${dataIntegrationStatus.localStorage.scannedKeys.length} keys)`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Session Data</p>
                <p className="text-xs text-purple-700">{dataIntegrationStatus.sessionStorage.count} transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-900">Payment Proofs</p>
                <p className="text-xs text-orange-700">
                  {transactions.filter((t) => t.hasPaymentProof).length} detected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search-transactions" className="block text-sm font-medium text-gray-700 mb-2">
              Search Transactions
            </label>
            <input
              id="search-transactions"
              type="text"
              placeholder="Search by Transaction ID, user name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
            />
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
            >
              <option value="all">All Statuses</option>
              <option value={TRANSACTION_STATUS.PENDING}>Pending Payment</option>
              <option value={TRANSACTION_STATUS.HOLD}>Payment Uploaded</option>
              <option value={TRANSACTION_STATUS.PAID}>Awaiting Verification</option>
              <option value={TRANSACTION_STATUS.COMPLETED}>Completed</option>
              <option value={TRANSACTION_STATUS.CANCELLED}>Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterStatus(TRANSACTION_STATUS.PAID)}
                  className="px-3 py-2 text-xs font-medium text-white bg-[#FF7757] rounded-md hover:bg-[#E66647] transition-colors"
                >
                  Needs Verification ({transactions.filter((t) => t.status === TRANSACTION_STATUS.PAID).length})
                </button>
                <button
                  onClick={() => setFilterStatus("all")}
                  className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Show All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Transactions</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{apiError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority Transactions Alert */}
      {getPriorityTransactions().length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Transactions Requiring Attention</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {getPriorityTransactions().length} transaction{getPriorityTransactions().length > 1 ? "s" : ""} with
                  uploaded payment proofs waiting for verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-4">
        {loading && loadingSkeletons.some((skeleton) => skeleton) ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <LoadingSkeleton key={index} />
            ))}
          </div>
        ) : currentTransactions.length > 0 ? (
          <>
            <div className="grid gap-4">
              {currentTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  isHighlighted={highlightedTransaction === transaction.id}
                />
              ))}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Transactions will appear here once users make purchases."}
            </p>
            {(searchQuery || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setFilterStatus("all")
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#FF7757] hover:bg-[#E66647] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7757]"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Transaction Detail Modal */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Transaction Details">
        {currentTransaction && (
          <div className="space-y-6">
            {/* Transaction Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Transaction #{currentTransaction.id}</h3>
                <p className="text-sm text-gray-500">Created: {formatDate(currentTransaction.createdAt)}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(currentTransaction.status)}`}
              >
                {formatStatus(currentTransaction.status)}
              </span>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{currentTransaction.user?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{currentTransaction.user?.email || "No email"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{currentTransaction.user?.phone || "No phone"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm text-gray-900">{currentTransaction.user?.role || "user"}</p>
                </div>
              </div>
            </div>

            {/* Transaction Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Transaction Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Transaction ID</p>
                  <p className="text-sm font-mono text-gray-900 break-all">{currentTransaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-sm text-gray-900">{currentTransaction.quantity || 1}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(currentTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data Source</p>
                  <p className="text-sm text-gray-900">{currentTransaction.source || "Unknown"}</p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="text-sm text-gray-900">{currentTransaction.paymentMethod?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(currentTransaction.amount)}</p>
                </div>
              </div>

              {/* Payment Proof */}
              {currentTransaction.paymentProofUrl && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-blue-900">Payment Proof</h5>
                    {currentTransaction.isDummyPaymentProof && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Demo Data</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <img
                      src={currentTransaction.paymentProofUrl || "/placeholder.svg"}
                      alt="Payment Proof"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-blue-700">
                        Source: {currentTransaction.paymentProofSource || "Unknown"}
                      </p>
                      {currentTransaction.paymentProofUploadedAt && (
                        <p className="text-xs text-blue-600">
                          Uploaded: {formatDate(currentTransaction.paymentProofUploadedAt)}
                        </p>
                      )}
                      <button
                        onClick={() => handlePaymentProofView(currentTransaction.paymentProofUrl)}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Full Size
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Actions */}
            {currentTransaction.adminNotes && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h4>
                <p className="text-sm text-gray-700">{currentTransaction.adminNotes}</p>
                {currentTransaction.adminActionBy && (
                  <p className="text-xs text-gray-500 mt-2">
                    By: {currentTransaction.adminActionBy} on {formatDate(currentTransaction.adminActionAt)}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {(currentTransaction.status === TRANSACTION_STATUS.PAID ||
                currentTransaction.status === TRANSACTION_STATUS.HOLD) && (
                <>
                  <button
                    onClick={() => handleOpenVerificationModal(currentTransaction, "verify")}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="inline h-4 w-4 mr-2" />
                    Verify Payment
                  </button>

                  <button
                    onClick={() => handleOpenVerificationModal(currentTransaction, "hold")}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Clock className="inline h-4 w-4 mr-2" />
                    Put on Hold
                  </button>

                  <button
                    onClick={() => handleOpenVerificationModal(currentTransaction, "cancel")}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <X className="inline h-4 w-4 mr-2" />
                    Cancel Transaction
                  </button>
                </>
              )}

              {currentTransaction.paymentProofUrl && (
                <button
                  onClick={() => handlePaymentProofView(currentTransaction.paymentProofUrl)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                >
                  <FileText className="inline h-4 w-4 mr-2" />
                  View Payment Proof
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Enhanced Verification Modal */}
      <Modal
        isOpen={isVerificationModalOpen}
        onClose={handleCloseVerificationModal}
        title={`${verificationAction.charAt(0).toUpperCase() + verificationAction.slice(1)} Transaction`}
      >
        {verificationTransaction && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Transaction Summary</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">ID:</span> {verificationTransaction.id}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Customer:</span> {verificationTransaction.user?.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Amount:</span> {formatCurrency(verificationTransaction.amount)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Current Status:</span>{" "}
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(verificationTransaction.status)}`}>
                    {formatStatus(verificationTransaction.status)}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes {verificationAction === "cancel" && <span className="text-red-500">*</span>}
              </label>
              <textarea
                id="admin-notes"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  verificationAction === "verify"
                    ? "Optional: Add verification notes..."
                    : verificationAction === "cancel"
                      ? "Required: Reason for cancellation..."
                      : "Optional: Add notes..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCloseVerificationModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeVerification}
                disabled={isProcessing || (verificationAction === "cancel" && !adminNotes.trim())}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
                  verificationAction === "verify"
                    ? "bg-green-600 hover:bg-green-700"
                    : verificationAction === "cancel"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isProcessing
                  ? "Processing..."
                  : `${verificationAction.charAt(0).toUpperCase() + verificationAction.slice(1)} Transaction`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Proof Modal */}
      <Modal isOpen={isPaymentProofModalOpen} onClose={handleClosePaymentProofModal} title="Payment Proof">
        {paymentProofUrl && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={paymentProofUrl || "/placeholder.svg"}
                alt="Payment Proof"
                className="max-w-full max-h-96 rounded-lg shadow-lg"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => window.open(paymentProofUrl, "_blank")}
                className="px-4 py-2 text-sm font-medium text-white bg-[#FF7757] rounded-md hover:bg-[#E66647] transition-colors"
              >
                Open in New Tab
              </button>
              <button
                onClick={handleClosePaymentProofModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Transactions
