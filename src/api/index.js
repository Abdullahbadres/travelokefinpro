import axios from "axios"

// Update the API_KEY and BASE_URL constants at the top of the file
const API_KEY = import.meta.env.VITE_API_KEY
const BASE_URL = import.meta.env.VITE_BASE_URL

// You can also set a default JWT token for testing if needed
// localStorage.setItem("accessToken", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1pZnRhaGZhcmhhbkBnbWFpbC5jb20iLCJ1c2VySWQiOiI5NWE4MDNjMy1iNTFlLTQ3YTAtOTBkYi0yYzJmM2Y0ODE1YTkiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjI4NDgzODl9.Yblw19ySKtguk-25Iw_4kBKPfqcNqKWx9gjf505DIAk")

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    apiKey: API_KEY,
    "Content-Type": "application/json",
  },
})

// Add a request interceptor to include the JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("accessToken")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth endpoints
export const register = (userData) => api.post("/api/v1/register", userData)
export const login = (credentials) => api.post("/api/v1/login", credentials)
export const getLoggedUser = () => api.get("/api/v1/user")
export const logout = () => api.get("/api/v1/logout")
export const getAllUsers = () => api.get("/api/v1/all-user")
export const updateProfile = (userData) => api.post("/api/v1/update-profile", userData)

// Activities endpoints
export const getActivities = () => api.get("/api/v1/activities")
export const getActivityById = (id) => api.get(`/api/v1/activity/${id}`)
export const getActivitiesByCategory = (categoryId) => api.get(`/api/v1/activities-by-category/${categoryId}`)
export const createActivity = (activityData) => api.post("/api/v1/create-activity", activityData)
export const updateActivity = (id, activityData) => api.post(`/api/v1/update-activity/${id}`, activityData)
export const deleteActivity = (id) => api.delete(`/api/v1/delete-activity/${id}`)

// Categories endpoints
export const getCategories = () => api.get("/api/v1/categories")
export const getCategoryById = (id) => api.get(`/api/v1/category/${id}`)
export const createCategory = (categoryData) => api.post("/api/v1/create-category", categoryData)
export const updateCategory = (id, categoryData) => api.post(`/api/v1/update-category/${id}`, categoryData)
export const deleteCategory = (id) => api.delete(`/api/v1/delete-category/${id}`)

// Promos endpoints
export const getPromos = () => api.get("/api/v1/promos")
export const getPromoById = (id) => api.get(`/api/v1/promo/${id}`)
export const createPromo = (promoData) => api.post("/api/v1/create-promo", promoData)
export const updatePromo = (id, promoData) => api.post(`/api/v1/update-promo/${id}`, promoData)
export const deletePromo = (id) => api.delete(`/api/v1/delete-promo/${id}`)

// Banners endpoints
export const getBanners = () => api.get("/api/v1/banners")
export const getBannerById = (id) => api.get(`/api/v1/banner/${id}`)
export const createBanner = (bannerData) => api.post("/api/v1/create-banner", bannerData)
export const updateBanner = (id, bannerData) => api.post(`/api/v1/update-banner/${id}`, bannerData)
export const deleteBanner = (id) => api.delete(`/api/v1/delete-banner/${id}`)

// Cart endpoints
export const getCarts = () => api.get("/api/v1/carts")
export const addToCart = (activityId) => api.post("/api/v1/add-cart", { activityId })
export const updateCart = (cartId, quantity) => api.post(`/api/v1/update-cart/${cartId}`, { quantity })
export const deleteCart = (cartId) => api.delete(`/api/v1/delete-cart/${cartId}`)

// Transactions endpoints
export const getTransactions = () => {
  console.log("📡 Fetching user transactions...")
  return api
    .get("/api/v1/my-transactions")
    .then((response) => {
      console.log("✅ User transactions response:", response.data)
      return response
    })
    .catch((error) => {
      console.error("❌ Error fetching user transactions:", error.response?.data || error)
      throw error
    })
}

export const getAllTransactions = () => {
  console.log("📡 Fetching all transactions (admin)...")
  return api
    .get("/api/v1/all-transactions")
    .then((response) => {
      console.log("✅ All transactions response status:", response.status)
      console.log("✅ All transactions count:", response.data?.data?.length || 0)

      // Check if we have the expected data structure
      if (response.data && Array.isArray(response.data.data)) {
        // Log a few transaction IDs for debugging
        const transactionIds = response.data.data.slice(0, 5).map((t) => t.id)
        console.log("📋 Sample transaction IDs:", transactionIds)
      }

      return response
    })
    .catch((error) => {
      console.error("❌ Error fetching all transactions:", error.response?.data || error)

      // If the API returns a 403, the user might not have admin permissions
      if (error.response?.status === 403) {
        console.error("🚫 Permission denied to fetch all transactions. User might not be an admin.")
      }

      throw error
    })
}

export const getMyTransactions = () => {
  console.log("📡 Fetching my transactions...")
  return api
    .get("/api/v1/my-transactions")
    .then((response) => {
      console.log("✅ My transactions response status:", response.status)
      console.log("✅ My transactions count:", response.data?.data?.length || 0)

      // Check if we have the expected data structure
      if (response.data && Array.isArray(response.data.data)) {
        // Log a few transaction IDs for debugging
        const transactionIds = response.data.data.slice(0, 5).map((t) => t.id)
        console.log("📋 Sample transaction IDs:", transactionIds)
      }

      return response
    })
    .catch((error) => {
      console.error("❌ Error fetching my transactions:", error.response?.data || error)
      throw error
    })
}

export const createTransaction = (transactionData) => {
  console.log("📡 Creating transaction with data:", transactionData)

  // Validate required fields sesuai dengan API
  if (!transactionData.cartIds || !Array.isArray(transactionData.cartIds) || transactionData.cartIds.length === 0) {
    console.error("❌ cartIds is required and must be a non-empty array")
    return Promise.reject(new Error("cartIds is required and must be a non-empty array"))
  }

  if (!transactionData.paymentMethodId) {
    console.error("❌ paymentMethodId is required")
    return Promise.reject(new Error("paymentMethodId is required"))
  }

  // Prepare API payload sesuai dengan Postman collection
  const apiPayload = {
    cartIds: transactionData.cartIds,
    paymentMethodId: transactionData.paymentMethodId,
  }

  // Add promo code if provided
  if (transactionData.promoCode) {
    apiPayload.promoCode = transactionData.promoCode
  }

  console.log("📤 API payload:", apiPayload)

  return api
    .post("/api/v1/create-transaction", apiPayload)
    .then((response) => {
      console.log("✅ Create transaction response status:", response.status)
      console.log("✅ Create transaction response data:", response.data)

      // Check if we have the expected data structure
      if (response.data && response.data.data && response.data.data.id) {
        console.log("🎉 Transaction created successfully with ID:", response.data.data.id)
      } else {
        console.warn("⚠️ Transaction created but returned unexpected data structure:", response.data)
      }

      return response
    })
    .catch((error) => {
      console.error("❌ Error creating transaction:", error.response?.data || error)

      // Enhanced error logging
      if (error.response) {
        console.error("📋 Error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })
      }

      throw error
    })
}

export const updateTransactionStatus = (transactionId, statusData) => {
  console.log(`📡 Updating transaction ${transactionId} with status:`, statusData)

  // Add validation for transaction ID
  if (!transactionId) {
    console.error("❌ Transaction ID is required")
    return Promise.reject(new Error("Transaction ID is required"))
  }

  // Add validation for status data
  if (!statusData || !statusData.status) {
    console.error("❌ Status data is invalid:", statusData)
    return Promise.reject(new Error("Status data is invalid"))
  }

  console.log(`📤 Making API request to update transaction ${transactionId} status to ${statusData.status}`)

  return api
    .post(`/api/v1/update-transaction-status/${transactionId}`, statusData)
    .then((response) => {
      console.log("✅ Update transaction status response:", response.data)

      // Validate the response
      if (!response.data) {
        console.warn(`⚠️ Transaction ${transactionId} update returned empty response`)
      } else if (response.data.code !== "200" && response.data.status !== "success") {
        console.warn(`⚠️ Transaction ${transactionId} update returned non-success status:`, response.data)
      } else {
        console.log(`🎉 Transaction ${transactionId} successfully updated to ${statusData.status}`)
      }

      return response
    })
    .catch((error) => {
      console.error("❌ Error updating transaction status:", error.response?.data || error)

      // Enhanced error logging
      if (error.response) {
        console.error(`📋 Server responded with status ${error.response.status}:`, error.response.data)

        // If the API returns a 404, the transaction might not exist
        if (error.response.status === 404) {
          console.error(`🔍 Transaction ${transactionId} not found in the API`)
        }

        // If the API returns a 403, the user might not have permission
        if (error.response.status === 403) {
          console.error(`🚫 Permission denied to update transaction ${transactionId}`)
        }
      } else if (error.request) {
        console.error("📡 No response received from server:", error.request)
      } else {
        console.error("⚙️ Error setting up request:", error.message)
      }

      throw error
    })
}

export const getTransactionById = (id) => {
  console.log(`📡 Fetching transaction details for ID: ${id}`)

  // Add validation for transaction ID
  if (!id) {
    console.error("❌ Transaction ID is required")
    return Promise.reject(new Error("Transaction ID is required"))
  }

  return api
    .get(`/api/v1/transaction/${id}`)
    .then((response) => {
      console.log(`✅ Transaction ${id} response status:`, response.status)

      // Check if we have the expected data structure
      if (response.data && response.data.data) {
        console.log(`🎉 Transaction ${id} details retrieved successfully`)

        // Log some basic transaction info for debugging
        const transaction = response.data.data
        console.log(`📋 Transaction ${id} summary:`, {
          status: transaction.status,
          amount: transaction.amount,
          createdAt: transaction.createdAt,
          userId: transaction.userId || transaction.user?.id,
        })
      } else {
        console.warn(`⚠️ Transaction ${id} returned unexpected data structure:`, response.data)
      }

      return response
    })
    .catch((error) => {
      console.error(`❌ Error fetching transaction ${id}:`, error.response?.data || error)

      // Enhanced error logging
      if (error.response) {
        console.error(`📋 Server responded with status ${error.response.status}:`, error.response.data)

        // If the API returns a 404, the transaction doesn't exist
        if (error.response.status === 404) {
          console.error(`🔍 Transaction ${id} not found in the API`)
        }

        // If the API returns a 403, the user might not have permission
        if (error.response.status === 403) {
          console.error(`🚫 Permission denied to view transaction ${id}`)
        }
      } else if (error.request) {
        console.error("📡 No response received from server:", error.request)
      } else {
        console.error("⚙️ Error setting up request:", error.message)
      }

      throw error
    })
}

// ENHANCED: Image upload function with better error handling and progress tracking
export const uploadImage = (imageFile) => {
  console.log("📡 Starting image upload process...")
  console.log("📎 File details:", {
    name: imageFile.name,
    size: imageFile.size,
    type: imageFile.type,
  })

  // Validate file before upload
  if (!imageFile) {
    console.error("❌ No image file provided")
    return Promise.reject(new Error("No image file provided"))
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  if (!validTypes.includes(imageFile.type)) {
    console.error("❌ Invalid file type:", imageFile.type)
    return Promise.reject(new Error("Invalid file type. Please use JPG, PNG, GIF, or WEBP"))
  }

  if (imageFile.size > 10 * 1024 * 1024) {
    console.error("❌ File too large:", imageFile.size)
    return Promise.reject(new Error("File size must be less than 10MB"))
  }

  const formData = new FormData()
  formData.append("image", imageFile)

  console.log("📤 Uploading image to server...")

  return api
    .post("/api/v1/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30 second timeout
    })
    .then((response) => {
      console.log("✅ Upload image response:", response.data)

      // Validate response structure
      if (!response.data) {
        throw new Error("Empty response from server")
      }

      // Handle different response structures
      let imageUrl = null
      if (response.data.url) {
        imageUrl = response.data.url
      } else if (response.data.data && response.data.data.url) {
        imageUrl = response.data.data.url
      } else if (response.data.imageUrl) {
        imageUrl = response.data.imageUrl
      }

      if (!imageUrl) {
        console.error("❌ Server response missing URL:", response.data)
        throw new Error("Server did not return image URL")
      }

      console.log("🎉 Image uploaded successfully:", imageUrl)

      // Return consistent structure
      return {
        data: {
          url: imageUrl,
          imageUrl: imageUrl, // Add alternative field name
          success: true,
          uploadedAt: new Date().toISOString(),
          originalResponse: response.data,
        },
      }
    })
    .catch((error) => {
      console.error("❌ Upload image error:", error)

      if (error.response) {
        console.error("📋 Server error details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        })

        if (error.response.status === 413) {
          throw new Error("File too large for server")
        } else if (error.response.status === 415) {
          throw new Error("Unsupported file type")
        } else if (error.response.status >= 500) {
          throw new Error("Server error. Please try again later")
        }
      } else if (error.request) {
        console.error("📡 Network error:", error.request)
        throw new Error("Network error. Please check your connection")
      }

      throw error
    })
}

// CRITICAL: Enhanced payment proof upload function with proper API integration
export const uploadPaymentProof = (transactionId, formData) => {
  console.log(`📡 Uploading payment proof for transaction ${transactionId}`)

  // Validate inputs
  if (!transactionId) {
    console.error("❌ Transaction ID is required")
    return Promise.reject(new Error("Transaction ID is required"))
  }

  if (!formData) {
    console.error("❌ Form data is required")
    return Promise.reject(new Error("Form data is required"))
  }

  // Log form data contents untuk debugging
  if (formData && formData.get) {
    const proofFile = formData.get("proof")
    if (proofFile) {
      console.log("📎 Payment proof file:", proofFile.name, "Size:", proofFile.size)
    } else {
      console.warn("⚠️ No 'proof' field found in form data")
    }
  }

  console.log(`📤 Uploading payment proof for transaction ${transactionId}...`)

  // Gunakan endpoint yang benar dari Postman collection
  return api
    .post(`/api/v1/update-transaction-proof-payment/${transactionId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 second timeout for file uploads
    })
    .then((response) => {
      console.log("✅ Upload payment proof response:", response.data)

      // Validate response
      if (!response.data) {
        console.warn("⚠️ Empty response from payment proof upload")
      } else if (response.data.code === "200" || response.data.status === "success") {
        console.log("🎉 Payment proof uploaded successfully")
      } else {
        console.warn("⚠️ Payment proof upload returned non-success status:", response.data)
      }

      return response
    })
    .catch((error) => {
      console.error("❌ Error uploading payment proof:", error.response?.data || error)

      // Enhanced error logging
      if (error.response) {
        console.error(`📋 Server responded with status ${error.response.status}:`, error.response.data)

        if (error.response.status === 404) {
          throw new Error(`Transaction ${transactionId} not found`)
        } else if (error.response.status === 413) {
          throw new Error("Payment proof file too large")
        } else if (error.response.status >= 500) {
          throw new Error("Server error during upload. Please try again")
        }
      } else if (error.request) {
        console.error("📡 Network error during payment proof upload:", error.request)
        throw new Error("Network error. Please check your connection")
      }

      throw error
    })
}

// CRITICAL: New function untuk upload payment proof dengan integrasi penuh
export const uploadPaymentProofWithIntegration = async (transactionId, imageFile) => {
  console.log(`🚀 STARTING INTEGRATED PAYMENT PROOF UPLOAD for transaction ${transactionId}`)
  console.log("📎 File details:", {
    name: imageFile.name,
    size: imageFile.size,
    type: imageFile.type,
  })

  try {
    // STEP 1: Upload image first
    console.log("🔄 Step 1: Uploading image to server...")
    const imageUploadResponse = await uploadImage(imageFile)

    console.log("✅ Image upload response:", imageUploadResponse)

    if (!imageUploadResponse.data || !imageUploadResponse.data.url) {
      throw new Error("Failed to upload image to server - no URL returned")
    }

    const imageUrl = imageUploadResponse.data.url
    console.log("✅ Image uploaded successfully to URL:", imageUrl)

    // STEP 2: Update transaction with payment proof URL
    console.log("🔄 Step 2: Updating transaction with payment proof...")
    const updateResponse = await updateTransactionProofPayment(transactionId, {
      proofPaymentUrl: imageUrl,
    })

    console.log("✅ Transaction updated with payment proof:", updateResponse.data)

    // Return combined response with proper structure
    return {
      data: {
        success: true,
        imageUrl: imageUrl,
        proofPaymentUrl: imageUrl, // CRITICAL: Add this field
        transactionUpdate: updateResponse.data,
        message: "Payment proof uploaded and transaction updated successfully",
        uploadedAt: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("❌ Error in integrated payment proof upload:", error)

    // Return error with details for better debugging
    return {
      data: {
        success: false,
        error: error.message,
        imageUrl: null,
        proofPaymentUrl: null,
      },
      error: error,
    }
  }
}

// Enhanced function untuk update transaction proof payment dengan URL (fallback method)
export const updateTransactionProofPayment = (transactionId, proofData) => {
  console.log(`📡 Updating transaction ${transactionId} proof payment with data:`, proofData)

  // Validate inputs
  if (!transactionId) {
    console.error("❌ Transaction ID is required")
    return Promise.reject(new Error("Transaction ID is required"))
  }

  if (!proofData || !proofData.proofPaymentUrl) {
    console.error("❌ Proof payment URL is required")
    return Promise.reject(new Error("Proof payment URL is required"))
  }

  console.log(`📤 Updating transaction ${transactionId} with proof payment URL...`)

  return api
    .post(`/api/v1/update-transaction-proof-payment/${transactionId}`, proofData, {
      timeout: 30000, // 30 second timeout
    })
    .then((response) => {
      console.log("✅ Update transaction proof payment response:", response.data)

      // Validate response
      if (!response.data) {
        console.warn("⚠️ Empty response from proof payment update")
      } else if (response.data.code === "200" || response.data.status === "success") {
        console.log("🎉 Transaction proof payment updated successfully")
      } else {
        console.warn("⚠️ Proof payment update returned non-success status:", response.data)
      }

      return response
    })
    .catch((error) => {
      console.error("❌ Error updating transaction proof payment:", error.response?.data || error)

      if (error.response) {
        console.error(`📋 Server error details:`, {
          status: error.response.status,
          data: error.response.data,
        })

        if (error.response.status === 404) {
          throw new Error(`Transaction ${transactionId} not found`)
        } else if (error.response.status === 400) {
          throw new Error("Invalid proof payment data")
        } else if (error.response.status >= 500) {
          throw new Error("Server error. Please try again later")
        }
      }

      throw error
    })
}

export const cancelTransaction = (transactionId) => api.post(`/api/v1/cancel-transaction/${transactionId}`)

// Payment methods endpoints
export const getPaymentMethods = () => api.get("/api/v1/payment-methods")

// Add a new function to retry failed API requests
export const retryApiRequest = async (apiFunction, params, maxRetries = 3) => {
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 API request attempt ${attempt}/${maxRetries}`)
      const response = await apiFunction(...params)
      return response
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error)
      lastError = error

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`❌ All ${maxRetries} attempts failed`)
  throw lastError
}

// Wishlist endpoints
export const getWishlist = () => api.get("/api/v1/wishlist")
export const addToWishlist = (activityId) => api.post("/api/v1/add-wishlist", { activityId })
export const removeFromWishlist = (id) => api.delete(`/api/v1/delete-wishlist/${id}`)

export default api
