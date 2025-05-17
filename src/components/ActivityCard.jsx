"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { HeartIcon, ShoppingCartIcon, EyeIcon } from "@heroicons/react/24/outline"
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid"
import { useWishlist } from "../contexts/WishlistContext"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import PlaceholderImage from "./PlaceholderImage"
import toast from "react-hot-toast"

const ActivityCard = ({ activity, onLoginRedirect }) => {
  const wishlistContext = useWishlist()
  const { isInWishlist, addToWishlist, removeFromWishlist } = wishlistContext || {}
  const { addToCart } = useCart() || {}
  const { user, isAdmin } = useAuth() || {}
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleWishlistToggle = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Don't show wishlist functionality for admin users
    if (isAdmin && isAdmin()) {
      return
    }

    if (!user) {
      toast.error("Please login to add items to wishlist")
      if (onLoginRedirect) {
        setTimeout(() => {
          onLoginRedirect()
        }, 1500) // Redirect after 1.5 seconds so the user can see the toast message
      }
      return
    }

    if (isInWishlist && isInWishlist(activity.id)) {
      removeFromWishlist && removeFromWishlist(activity.id)
      toast.success("Removed from wishlist")
    } else {
      if (addToWishlist && addToWishlist(activity)) {
        toast.success("Added to wishlist")
      }
    }
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error("Please login to add items to cart")
      if (onLoginRedirect) {
        setTimeout(() => {
          onLoginRedirect()
        }, 1500) // Redirect after 1.5 seconds so the user can see the toast message
      }
      return
    }

    setIsAddingToCart(true)
    try {
      if (addToCart) {
        const success = await addToCart(activity.id)
        if (success) {
          toast.success(`${activity.title} added to your cart!`)
        }
      }
    } catch (error) {
      console.error("Error in handleAddToCart:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <Link to={`/activity/${activity.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] h-full">
        <div className="relative h-48">
          {activity.imageUrls && activity.imageUrls.length > 0 ? (
            <img
              src={activity.imageUrls[0] || "/placeholder.svg"}
              alt={activity.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "flex"
              }}
            />
          ) : null}
          <PlaceholderImage
            text={activity.title}
            className="w-full h-full"
            style={{ display: activity.imageUrls && activity.imageUrls.length > 0 ? "none" : "flex" }}
          />

          {/* Wishlist button - hidden for admin users */}
          {isAdmin && !isAdmin() && (
            <button
              onClick={handleWishlistToggle}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md"
            >
              {isInWishlist && isInWishlist(activity.id) ? (
                <HeartIconSolid className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-1 truncate">{activity.title}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <span>
              {activity.city}, {activity.province}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{activity.description}</p>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#FF7757] font-bold">Rp{activity.price.toLocaleString()}</p>
            </div>

            {/* Show different button based on user role */}
            {isAdmin && isAdmin() ? (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                className="flex items-center justify-center p-2 bg-white text-white rounded-md hover:bg-white"
              >
                {/* <EyeIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">View</span> */}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="flex items-center justify-center p-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] disabled:opacity-50"
              >
                {isAddingToCart ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShoppingCartIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default ActivityCard
