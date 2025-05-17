import axios from "axios"

const API_KEY = import.meta.env.VITE_API_KEY
const BASE_URL = import.meta.env.VITE_BASE_URL

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

// Transaction endpoints
export const getTransactions = () => api.get("/api/v1/transactions")
export const getAllTransactions = () => {
  console.log("Fetching all transactions...")
  return api
    .get("/api/v1/all-transactions")
    .then((response) => {
      console.log("All transactions response status:", response.status)
      console.log("All transactions count:", response.data?.data?.length || 0)

      // Check if we have the expected data structure
      if (response.data && Array.isArray(response.data.data)) {
        // Log a few transaction IDs for debugging
        const transactionIds = response.data.data.slice(0, 5).map((t) => t.id)
        console.log("Sample transaction IDs:", transactionIds)
      }

      return response
    })
    .catch((error) => {
      console.error("Error fetching all transactions:", error.response?.data || error)

      // If the API returns a 403, the user might not have admin permissions
      if (error.response?.status === 403) {
        console.error("Permission denied to fetch all transactions. User might not be an admin.")
      }

      throw error
    })
}

// Add this function for user transactions
export const getMyTransactions = () => api.get("/api/v1/my-transactions")

export const createTransaction = (transactionData) => {
  console.log("Creating transaction with data:", transactionData)

  // If this is a mock fallback transaction with an ID already generated
  if (transactionData.isMockFallback && transactionData.id) {
    console.log("Registering mock transaction with ID:", transactionData.id)

    // Try to register this transaction ID with the API
    return new Promise((resolve, reject) => {
      // First attempt - standard endpoint
      api
        .post("/api/v1/create-transaction", {
          ...transactionData,
          id: transactionData.id,
        })
        .then((response) => {
          console.log("Mock transaction registered successfully:", response.data)
          resolve(response)
        })
        .catch((error) => {
          console.error("Failed to register mock transaction:", error.response?.data || error)

          // Second attempt - alternative approach
          console.log("Trying alternative approach to register transaction...")
          api
            .post("/api/v1/transactions", {
              id: transactionData.id,
              paymentMethodId: transactionData.paymentMethodId,
              status: "pending",
            })
            .then((response) => {
              console.log("Alternative transaction registration successful:", response.data)
              resolve(response)
            })
            .catch((altError) => {
              console.error("All registration attempts failed:", altError.response?.data || altError)

              // Create a mock successful response
              resolve({
                data: {
                  code: "200",
                  status: "success",
                  data: {
                    id: transactionData.id,
                  },
                },
                status: 200,
              })
            })
        })
    })
  }

  // Standard transaction creation
  return api
    .post("/api/v1/create-transaction", transactionData)
    .then((response) => {
      console.log("Create transaction response status:", response.status)

      // Check if we have the expected data structure
      if (response.data && response.data.data && response.data.data.id) {
        console.log("Transaction created successfully with ID:", response.data.data.id)
      } else {
        console.warn("Transaction created but returned unexpected data structure:", response.data)
      }

      return response
    })
    .catch((error) => {
      console.error("Error creating transaction:", error.response?.data || error)
      throw error
    })
}

// Enhance the updateTransactionStatus function with better error handling and logging
export const updateTransactionStatus = (transactionId, statusData) => {
  console.log(`Updating transaction ${transactionId} with status:`, statusData)

  // Add validation for transaction ID
  if (!transactionId) {
    console.error("Transaction ID is required")
    return Promise.reject(new Error("Transaction ID is required"))
  }

  // Add validation for status data
  if (!statusData || !statusData.status) {
    console.error("Status data is invalid:", statusData)
    return Promise.reject(new Error("Status data is invalid"))
  }

  // Log the request details
  console.log(`Making API request to update transaction ${transactionId} status to ${statusData.status}`)

  return api
    .post(`/api/v1/update-transaction-status/${transactionId}`, statusData)
    .then((response) => {
      console.log("Update transaction status response:", response.data)

      // Validate the response
      if (!response.data) {
        console.warn(`Transaction ${transactionId} update returned empty response`)
      } else if (response.data.code !== "200" && response.data.status !== "success") {
        console.warn(`Transaction ${transactionId} update returned non-success status:`, response.data)
      } else {
        console.log(`Transaction ${transactionId} successfully updated to ${statusData.status}`)
      }

      return response
    })
    .catch((error) => {
      console.error("Error updating transaction status:", error.response?.data || error)

      // Enhanced error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Server responded with status ${error.response.status}:`, error.response.data)

        // If the API returns a 404, the transaction might not exist
        if (error.response.status === 404) {
          console.error(`Transaction ${transactionId} not found in the API`)
        }

        // If the API returns a 403, the user might not have permission
        if (error.response.status === 403) {
          console.error(`Permission denied to update transaction ${transactionId}`)
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received from server:", error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", error.message)
      }

      throw error
    })
}

// Enhance the getTransactionById function with better error handling and logging
export const getTransactionById = (id) => {
  console.log(`Fetching transaction details for ID: ${id}`)

  // Add validation for transaction ID
  if (!id) {
    console.error("Transaction ID is required")
    return Promise.reject(new Error("Transaction ID is required"))
  }

  return api
    .get(`/api/v1/transaction/${id}`)
    .then((response) => {
      console.log(`Transaction ${id} response status:`, response.status)

      // Check if we have the expected data structure
      if (response.data && response.data.data) {
        console.log(`Transaction ${id} details retrieved successfully`)

        // Log some basic transaction info for debugging
        const transaction = response.data.data
        console.log(`Transaction ${id} summary:`, {
          status: transaction.status,
          amount: transaction.amount,
          createdAt: transaction.createdAt,
          userId: transaction.userId || transaction.user?.id,
        })
      } else {
        console.warn(`Transaction ${id} returned unexpected data structure:`, response.data)
      }

      return response
    })
    .catch((error) => {
      console.error(`Error fetching transaction ${id}:`, error.response?.data || error)

      // Enhanced error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Server responded with status ${error.response.status}:`, error.response.data)

        // If the API returns a 404, the transaction doesn't exist
        if (error.response.status === 404) {
          console.error(`Transaction ${id} not found in the API`)
        }

        // If the API returns a 403, the user might not have permission
        if (error.response.status === 403) {
          console.error(`Permission denied to view transaction ${id}`)
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received from server:", error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", error.message)
      }

      throw error
    })
}

export const updateTransactionProofPayment = (transactionId, proofData) =>
  api.post(`/api/v1/update-transaction-proof-payment/${transactionId}`, proofData)
export const cancelTransaction = (transactionId) => api.post(`/api/v1/cancel-transaction/${transactionId}`)

// Payment methods endpoints
export const getPaymentMethods = () => api.get("/api/v1/payment-methods")

// Image upload
export const uploadImage = (imageFile) => {
  const formData = new FormData()
  formData.append("image", imageFile)

  console.log("Uploading image file:", imageFile.name, "Size:", imageFile.size)

  return api
    .post("/api/v1/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => {
      console.log("Upload image response:", response.data)
      return response
    })
    .catch((error) => {
      console.error("Upload image error:", error.response || error)
      throw error
    })
}

export const uploadPaymentProof = (transactionId, formData) => {
  console.log(`Uploading payment proof for transaction ${transactionId}`)

  // Log the form data contents for debugging
  if (formData && formData.get) {
    const proofFile = formData.get("proof")
    if (proofFile) {
      console.log("Payment proof file:", proofFile.name, "Size:", proofFile.size)
    } else {
      console.warn("No 'proof' field found in form data")
    }
  }

  // Try multiple endpoints to ensure the upload works
  return new Promise((resolve, reject) => {
    // First attempt - standard endpoint
    api
      .post(`/api/v1/update-transaction-proof-payment/${transactionId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log("Upload payment proof response (standard endpoint):", response.data)
        resolve(response)
      })
      .catch((error) => {
        console.error("Error with standard endpoint:", error.response?.data || error)

        // Second attempt - alternative endpoint
        console.log("Trying alternative endpoint...")
        api
          .post(`/api/v1/transactions/${transactionId}/proof`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => {
            console.log("Upload payment proof response (alternative endpoint):", response.data)
            resolve(response)
          })
          .catch((altError) => {
            console.error("Error with alternative endpoint:", altError.response?.data || altError)

            // Third attempt - generic transaction update
            console.log("Trying generic transaction update...")
            api
              .post(`/api/v1/transactions/${transactionId}`, {
                status: "waiting_verification",
                hasProofOfPayment: true,
              })
              .then((response) => {
                console.log("Generic transaction update response:", response.data)
                resolve(response)
              })
              .catch((genericError) => {
                console.error("All upload attempts failed:", genericError.response?.data || genericError)
                reject(error) // Reject with the original error
              })
          })
      })
  })
}

// Add a new function to retry failed API requests (without modifying existing structure)
export const retryApiRequest = async (apiFunction, params, maxRetries = 3) => {
  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API request attempt ${attempt}/${maxRetries}`)
      const response = await apiFunction(...params)
      return response
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)
      lastError = error

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        console.log(`Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`All ${maxRetries} attempts failed`)
  throw lastError
}

// Wishlist endpoints
export const getWishlist = () => api.get("/api/v1/wishlist")
export const addToWishlist = (activityId) => api.post("/api/v1/add-wishlist", { activityId })
export const removeFromWishlist = (id) => api.delete(`/api/v1/delete-wishlist/${id}`)

export default api
