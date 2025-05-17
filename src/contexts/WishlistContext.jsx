"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import toast from "react-hot-toast"
import api from "../api"

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Load wishlist from API and fallback to localStorage
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true)
        if (user) {
          // First try to get wishlist from API
          try {
            const response = await api.get("/api/v1/wishlist")
            if (response.data && response.data.data) {
              console.log("Wishlist loaded from API:", response.data.data)
              setWishlist(response.data.data)

              // Update localStorage with the latest data from API
              const userKey = `wishlist_${user.email || user.id}`
              localStorage.setItem(userKey, JSON.stringify(response.data.data))
              return
            }
          } catch (apiError) {
            console.warn("Could not fetch wishlist from API, falling back to localStorage:", apiError)
          }

          // Fallback to localStorage if API fails
          const userKey = `wishlist_${user.email || user.id}`
          const savedWishlist = localStorage.getItem(userKey)
          if (savedWishlist) {
            console.log("Wishlist loaded from localStorage")
            setWishlist(JSON.parse(savedWishlist))
          } else {
            setWishlist([])
          }
        } else {
          setWishlist([])
        }
      } catch (error) {
        console.error("Error loading wishlist:", error)
        toast.error("Failed to load favorites")
      } finally {
        setLoading(false)
      }
    }

    loadWishlist()
  }, [user])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (user && wishlist.length > 0) {
      const userKey = `wishlist_${user.email || user.id}`
      localStorage.setItem(userKey, JSON.stringify(wishlist))
    }
  }, [wishlist, user])

  const addToWishlist = async (activity) => {
    if (!user) {
      toast.error("Please login to add to favorites")
      return
    }

    // Check if activity is already in wishlist
    const isInWishlist = wishlist.some((item) => item.activity && item.activity.id === activity.id)

    if (isInWishlist) {
      toast.error("Already in your favorites")
      return
    }

    const newWishlistItem = {
      id: `wishlist_${Date.now()}`,
      activity: {
        ...activity,
        // Ensure these properties exist for the Wishlist component
        title: activity.title || "Unnamed Activity",
        shortDescription: activity.description || activity.shortDescription || "",
        price: activity.price || 0,
        imageUrls: activity.imageUrls || [],
      },
      addedAt: new Date().toISOString(),
    }

    try {
      // Try to add to API first
      try {
        const response = await api.post("/api/v1/wishlist", {
          activityId: activity.id,
        })
        console.log("Added to wishlist via API:", response.data)
      } catch (apiError) {
        console.warn("Could not add to wishlist via API, using local only:", apiError)
      }

      // Update local state regardless of API success
      setWishlist((prevWishlist) => [...prevWishlist, newWishlistItem])

      // Store in localStorage
      if (user) {
        const userKey = `wishlist_${user.email || user.id}`
        const updatedWishlist = [...wishlist, newWishlistItem]
        localStorage.setItem(userKey, JSON.stringify(updatedWishlist))
      }

      toast.success("Added to favorites")
    } catch (error) {
      console.error("Error adding to wishlist:", error)
      toast.error("Failed to add to favorites")
    }
  }

  const removeFromWishlist = async (activityId) => {
    try {
      // Try to remove from API first
      try {
        await api.delete(`/api/v1/wishlist/${activityId}`)
        console.log("Removed from wishlist via API")
      } catch (apiError) {
        console.warn("Could not remove from wishlist via API, using local only:", apiError)
      }

      // Update local state regardless of API success
      const updatedWishlist = wishlist.filter((item) => !item.activity || item.activity.id !== activityId)
      setWishlist(updatedWishlist)

      // Update localStorage
      if (user) {
        const userKey = `wishlist_${user.email || user.id}`
        localStorage.setItem(userKey, JSON.stringify(updatedWishlist))
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      toast.error("Failed to remove from wishlist")
    }
  }

  const isInWishlist = (activityId) => {
    return wishlist.some((item) => item.activity && item.activity.id === activityId)
  }

  const refreshWishlist = async () => {
    setLoading(true)
    try {
      // Try to refresh from API
      try {
        const response = await api.get("/api/v1/wishlist")
        if (response.data && response.data.data) {
          setWishlist(response.data.data)

          // Update localStorage with the latest data
          if (user) {
            const userKey = `wishlist_${user.email || user.id}`
            localStorage.setItem(userKey, JSON.stringify(response.data.data))
          }
          return
        }
      } catch (apiError) {
        console.warn("Could not refresh wishlist from API:", apiError)
      }

      // Fallback to localStorage
      if (user) {
        const userKey = `wishlist_${user.email || user.id}`
        const savedWishlist = localStorage.getItem(userKey)
        if (savedWishlist) {
          setWishlist(JSON.parse(savedWishlist))
        }
      }
    } catch (error) {
      console.error("Error refreshing wishlist:", error)
      toast.error("Failed to refresh wishlist")
    } finally {
      setLoading(false)
    }
  }

  const clearWishlist = async () => {
    try {
      // Try to clear from API first
      try {
        await api.delete("/api/v1/wishlist")
        console.log("Cleared wishlist via API")
      } catch (apiError) {
        console.warn("Could not clear wishlist via API, using local only:", apiError)
      }

      // Update local state regardless of API success
      setWishlist([])

      // Clear from localStorage
      if (user) {
        const userKey = `wishlist_${user.email || user.id}`
        localStorage.removeItem(userKey)
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error)
      toast.error("Failed to clear wishlist")
    }
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        refreshWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
