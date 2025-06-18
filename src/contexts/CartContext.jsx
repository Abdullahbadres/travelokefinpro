"use client"

import { createContext, useState, useEffect, useContext } from "react"
import { getCarts, addToCart as addToCartApi, updateCart as updateCartApi, deleteCart as deleteCartApi } from "../api"
import { useAuth } from "./AuthContext"
import toast from "react-hot-toast"

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      setCart([])
    }
  }, [user])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await getCarts()
      setCart(response.data.data)
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to fetch cart items")
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (activityId) => {
    try {
      setLoading(true)
      // Using the fixed API endpoint from api/index.js
      const response = await addToCartApi(activityId)

      if (response && response.data) {
        await fetchCart()
        toast.success("Added to cart successfully")
        return true
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to add to cart. Please try again later."
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateCartItem = async (cartId, quantity) => {
    try {
      setLoading(true)
      await updateCartApi(cartId, quantity)
      await fetchCart()
      toast.success("Cart updated")
      return true
    } catch (error) {
      console.error("Error updating cart:", error)
      toast.error("Failed to update cart")
      return false
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (cartId) => {
    try {
      setLoading(true)
      await deleteCartApi(cartId)
      await fetchCart()
      toast.success("Item removed from cart")
      return true
    } catch (error) {
      console.error("Error removing from cart:", error)
      toast.error("Failed to remove item from cart")
      return false
    } finally {
      setLoading(false)
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + item.activity.price * item.quantity
    }, 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const clearCart = async () => {
    try {
      setLoading(true)
      // Clear cart items one by one
      const clearPromises = cart.map((item) => deleteCartApi(item.id))
      await Promise.all(clearPromises)

      // Update local state
      setCart([])
      console.log("✅ Cart cleared successfully")
      return true
    } catch (error) {
      console.error("Error clearing cart:", error)
      // Force clear local state even if API fails
      setCart([])
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        getCartTotal,
        getCartCount,
        refreshCart: fetchCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
