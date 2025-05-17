"use client"

import { useState, useEffect } from "react"
import { useWishlist } from "../contexts/WishlistContext"
import { useAuth } from "../contexts/AuthContext"
import { Link } from "react-router-dom"
import { HeartIcon, MagnifyingGlassIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid"
import PlaceholderImage from "../components/PlaceholderImage"
import toast from "react-hot-toast"
import api from "../api"

const Wishlist = () => {
  const { user } = useAuth()
  const { wishlist, removeFromWishlist, clearWishlist, refreshWishlist } = useWishlist()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [apiWishlist, setApiWishlist] = useState([])
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const itemsPerPage = 8

  // Load wishlist from API
  useEffect(() => {
    const fetchWishlistFromApi = async () => {
      if (!user) return

      setLoading(true)
      try {
        const response = await api.get("/api/v1/wishlist")
        if (response.data && response.data.data) {
          console.log("Wishlist fetched from API:", response.data.data)
          setApiWishlist(response.data.data)
          setLastRefreshed(new Date())
        }
      } catch (error) {
        console.error("Error fetching wishlist from API:", error)
        // Don't show error toast here as we'll fall back to context wishlist
      } finally {
        setLoading(false)
      }
    }

    fetchWishlistFromApi()
  }, [user])

  // Handle manual refresh
  const handleManualRefresh = async () => {
    toast.loading("Refreshing wishlist...", { id: "refresh-wishlist" })
    setLoading(true)

    try {
      await refreshWishlist()

      // Also refresh from API directly
      try {
        const response = await api.get("/api/v1/wishlist")
        if (response.data && response.data.data) {
          setApiWishlist(response.data.data)
        }
      } catch (apiError) {
        console.warn("Could not refresh from API:", apiError)
      }

      setLastRefreshed(new Date())
      toast.success("Wishlist refreshed", { id: "refresh-wishlist" })
    } catch (error) {
      console.error("Error refreshing wishlist:", error)
      toast.error("Failed to refresh wishlist", { id: "refresh-wishlist" })
    } finally {
      setLoading(false)
    }
  }

  // Combine API wishlist with context wishlist, prioritizing API data
  const combinedWishlist = apiWishlist.length > 0 ? apiWishlist : wishlist

  // Filter wishlist items based on search term and category
  const filteredItems = combinedWishlist.filter((item) => {
    // Skip undefined items or items without activity or title
    if (!item || !item.activity || !item.activity.title) return false

    const matchesSearch = item.activity.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      categoryFilter === "all" || (item.activity.categoryId && item.activity.categoryId === categoryFilter)
    return matchesSearch && matchesCategory
  })

  // Get unique categories from wishlist items
  const categories = [
    { id: "all", name: "All Categories" },
    ...Array.from(
      new Map(
        combinedWishlist
          .filter((item) => item && item.activity && item.activity.category)
          .map((item) => [
            item.activity.category.id,
            { id: item.activity.category.id, name: item.activity.category.name },
          ]),
      ).values(),
    ),
  ]

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

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

  const handleRemoveFromWishlist = (item) => {
    try {
      // Remove using the context function (which will handle API and localStorage)
      removeFromWishlist(item.activity.id)

      // Also update local state
      setApiWishlist((prev) => prev.filter((i) => i.activity.id !== item.activity.id))

      toast.success(`${item.activity.title} removed from favorites`)
    } catch (error) {
      console.error("Error removing item from wishlist:", error)
      toast.error("Failed to remove item from favorites")
    }
  }

  const handleClearAllWishlist = () => {
    if (window.confirm("Are you sure you want to clear all items from your wishlist?")) {
      try {
        // Clear using the context function (which will handle API and localStorage)
        clearWishlist()

        // Also update local state
        setApiWishlist([])

        toast.success("Wishlist cleared successfully")
      } catch (error) {
        console.error("Error clearing wishlist:", error)
        toast.error("Failed to clear wishlist")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-20 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-md font-bold flex items-center">
            <HeartSolidIcon className="h-6 w-6 text-red-500 mr-2" />
            My Favorites
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-2">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              </span>
              <button
                onClick={handleManualRefresh}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                title="Refresh wishlist"
              >
                <ArrowPathIcon className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            {filteredItems.length > 0 && (
              <button
                onClick={handleClearAllWishlist}
                className="flex items-center text-sm text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filters and search */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {/* Category filter */}
            <div className="w-full md:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Last refreshed info */}
        <div className="text-xs text-gray-500 mb-4 text-right">
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </div>

        {/* Wishlist items */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/4 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <HeartIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-500 mb-6">
                  You haven't added any activities to your favorites list yet. Browse activities and click the heart
                  icon to add them here.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF7757] hover:bg-[#ff6242] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7757]"
                >
                  Explore Activities
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative h-48">
                        {item.activity.imageUrls && item.activity.imageUrls[0] ? (
                          <img
                            src={item.activity.imageUrls[0] || "/placeholder.svg"}
                            alt={item.activity.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : (
                          <PlaceholderImage text={item.activity.title.charAt(0)} className="w-full h-full" />
                        )}
                        <button
                          onClick={() => handleRemoveFromWishlist(item)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                          aria-label="Remove from favorites"
                        >
                          <HeartSolidIcon className="h-5 w-5 text-red-500" />
                        </button>
                        {item.addedAt && (
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            Added: {new Date(item.addedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">{item.activity.title}</h3>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.activity.shortDescription}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-[#FF7757]">
                            ${item.activity.price?.toLocaleString()}
                          </span>
                          <Link
                            to={`/activity/${item.activity.id}`}
                            className="px-3 py-1 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] text-sm"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg
                          className="h-5 w-5"
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
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
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
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg
                          className="h-5 w-5"
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
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Wishlist
