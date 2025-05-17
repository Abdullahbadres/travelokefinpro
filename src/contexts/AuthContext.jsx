"use client"

import { createContext, useState, useEffect, useContext } from "react"
import api, { getLoggedUser } from "../api"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("accessToken")
      if (token) {
        try {
          const response = await getLoggedUser()
          setUser(response.data.data)
          setIsLoggedIn(true)
        } catch (error) {
          console.error("Error fetching user data:", error)
          localStorage.removeItem("accessToken")
          setIsLoggedIn(false)
        }
      }
      setLoading(false)
    }

    checkLoggedIn()
  }, [])

  const login = async (credentials) => {
    try {
      console.log("Attempting login with credentials:", {
        email: credentials.email,
        password: "********", // Don't log the actual password
      })

      // First, get the token from login endpoint
      const response = await api.post("/api/v1/login", credentials)
      const token = response.data.token

      // Store token in localStorage
      localStorage.setItem("accessToken", token)

      // Fetch user details after login with the new token
      const userResponse = await api.get("/api/v1/user", {
        headers: { Authorization: `Bearer ${token}` },
      })

      const userData = userResponse.data.data

      // Store user data in state
      setUser(userData)
      setIsLoggedIn(true)

      // Store user data in localStorage for persistence
      localStorage.setItem("name", userData.name || "User")
      localStorage.setItem("email", userData.email || "user@email.com")
      localStorage.setItem("profilePictureUrl", userData.profilePictureUrl || "")
      localStorage.setItem("role", userData.role || "user")

      toast.success("Login successful!")
      return { success: true, user: userData }
    } catch (error) {
      console.error("Login error details:", error)

      // More detailed error information
      if (error.response) {
        console.error("Server response data:", error.response.data)
        console.error("Server response status:", error.response.status)
        console.error("Server response headers:", error.response.headers)

        // Show more specific error message if available
        const errorMessage = error.response.data?.message || "Login failed. Please check your credentials."
        toast.error(errorMessage)
      } else if (error.request) {
        console.error("No response received:", error.request)
        toast.error("No response from server. Please try again later.")
      } else {
        console.error("Error setting up request:", error.message)
        toast.error("Error setting up request: " + error.message)
      }

      return { success: false, error: error.response?.data?.message || error.message }
    }
  }

  const logout = async () => {
    try {
      await api.get("/api/v1/logout")

      // Clear all localStorage items
      localStorage.removeItem("accessToken")
      localStorage.removeItem("name")
      localStorage.removeItem("email")
      localStorage.removeItem("profilePictureUrl")
      localStorage.removeItem("role")

      // Reset state
      setUser(null)
      setIsLoggedIn(false)

      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Logout failed")
    }
  }

  const isAdmin = () => {
    return user?.role === "admin" || localStorage.getItem("role") === "admin"
  }

  const getUserInitials = () => {
    const name = user?.name || localStorage.getItem("name") || "?"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        getUserInitials,
        isLoggedIn,
        setIsLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
