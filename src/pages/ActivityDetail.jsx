"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { getActivityById } from "../api"
import { useCart } from "../contexts/CartContext"
import { useWishlist } from "../contexts/WishlistContext"
import { useAuth } from "../contexts/AuthContext"
import { HeartIcon } from "@heroicons/react/24/outline"
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid"
import PlaceholderImage from "../components/PlaceholderImage"
import toast from "react-hot-toast"

const ActivityDetail = () => {
  const { id } = useParams()
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addToCart } = useCart()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { user } = useAuth()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true)
        const response = await getActivityById(id)
        setActivity(response.data.data)
      } catch (error) {
        console.error("Error fetching activity:", error)
        toast.error("Failed to fetch activity details")
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [id])

  const handleWishlistToggle = () => {
    if (!activity) return

    if (isInWishlist(activity.id)) {
      removeFromWishlist(activity.id)
      toast.success("Removed from wishlist")
    } else {
      if (addToWishlist(activity)) {
        toast.success("Added to wishlist")
      }
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart")
      return
    }

    setIsAddingToCart(true)
    try {
      await addToCart(activity.id)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const isAdmin = () => {
    if (!user) return false
    // Assuming user object has an isAdmin property.  Adjust as needed.
    return user.role === "admin"
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">Activity not found</p>
          <Link to="/" className="inline-block px-6 py-3 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242]">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
          {/* Image Gallery */}
          <div>
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-4">
              {activity.imageUrls && activity.imageUrls.length > 0 ? (
                <img
                  src={activity.imageUrls[selectedImage] || "/placeholder.svg"}
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
                style={{
                  display: activity.imageUrls && activity.imageUrls.length > 0 ? "none" : "flex",
                }}
              />

              {/* Wishlist button */}
              {!isAdmin() && (
                <button
                  onClick={handleWishlistToggle}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md"
                >
                  {isInWishlist(activity.id) ? (
                    <HeartIconSolid className="h-6 w-6 text-red-500" />
                  ) : (
                    <HeartIcon className="h-6 w-6 text-gray-600" />
                  )}
                </button>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {activity.imageUrls && activity.imageUrls.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {activity.imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className={`h-16 rounded-md overflow-hidden cursor-pointer ${
                      selectedImage === index ? "ring-2 ring-[#FF7757]" : "opacity-70"
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`${activity.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none"
                        e.target.parentNode.classList.add("placeholder-image")
                        e.target.parentNode.innerHTML = `<div class="text-center p-1"><p class="text-xs">Image ${
                          index + 1
                        }</p></div>`
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{activity.title}</h1>
            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="ml-1 text-gray-700">
                  {activity.rating} ({activity.total_reviews} reviews)
                </span>
              </div>
              <span className="text-gray-500">
                {activity.city}, {activity.province}
              </span>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-[#FF7757] mb-2">Rp{activity.price.toLocaleString()}</div>
              {activity.price_discount > 0 && (
                <div className="text-sm text-gray-500">
                  <span className="line-through">Rp{(activity.price + activity.price_discount).toLocaleString()}</span>
                  <span className="ml-2 text-green-600">Save Rp{activity.price_discount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="prose max-w-none mb-8">
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{activity.description}</p>
            </div>

            {activity.facilities && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Facilities</h3>
                <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: activity.facilities }} />
              </div>
            )}

            {isAdmin() ? (
              <div className="bg-blue-100 text-blue-800 p-3 rounded-md mb-4">
                <p className="font-medium">Admin View Mode</p>
                <p className="text-sm">As an admin, you can view activity details but cannot add items to cart.</p>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="w-full py-3 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] transition-colors disabled:bg-gray-400 mb-4"
              >
                {isAddingToCart ? "Adding to Cart..." : "Add to Cart"}
              </button>
            )}
          </div>
        </div>

        {/* Location Section */}
        <div className="p-6 md:p-8 border-t">
          <h3 className="text-xl font-semibold mb-4">Location</h3>
          <div className="mb-4">
            <p className="text-gray-700">{activity.address}</p>
            <p className="text-gray-700">
              {activity.city}, {activity.province}
            </p>
          </div>

          {activity.location_maps && (
            <div
              className="w-full h-96 rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: activity.location_maps }}
            />
          )}
        </div>
      </div>
      {/* Only show wishlist button for non-admin users */}
      {!isAdmin() && (
        <button
          onClick={handleWishlistToggle}
          className="flex items-center justify-center py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {isInWishlist(activity.id) ? (
            <>
              <HeartIconSolid className="h-5 w-5 text-red-500 mr-2" />
              <span>Remove from Wishlist</span>
            </>
          ) : (
            <>
              <HeartIcon className="h-5 w-5 text-gray-600 mr-2" />
              <span>Add to Wishlist</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default ActivityDetail
