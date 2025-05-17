"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getPromos } from "../api"
import { MagnifyingGlassIcon, TagIcon } from "@heroicons/react/24/outline"
import PlaceholderImage from "../components/PlaceholderImage"
import toast from "react-hot-toast"

const Promos = () => {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        setLoading(true)
        const response = await getPromos()
        console.log("Promos data:", response.data)
        setPromos(response.data.data || [])
      } catch (error) {
        console.error("Error fetching promos:", error)
        toast.error("Failed to load promotions")
      } finally {
        setLoading(false)
      }
    }

    fetchPromos()
  }, [])

  // Filter promos based on search term
  const filteredPromos = promos.filter((promo) => {
    return (
      promo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredPromos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPromos = filteredPromos.slice(startIndex, endIndex)

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

  // Format date to readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  // Check if promo is active
  const isPromoActive = (promo) => {
    const now = new Date()
    const startDate = new Date(promo.startDate)
    const endDate = new Date(promo.endDate)
    return now >= startDate && now <= endDate
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-20 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <TagIcon className="h-6 w-6 text-[#FF7757] mr-2" />
            Available Promotions
          </h1>
          <div className="text-sm text-gray-500">
            {filteredPromos.length} {filteredPromos.length === 1 ? "promo" : "promos"} available
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search promotions by title, code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757] focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Promos list */}
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
            {filteredPromos.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <TagIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No promotions found</h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? `No promotions match your search for "${searchTerm}"`
                    : "There are no active promotions at the moment. Please check back later."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {currentPromos.map((promo) => (
                    <div
                      key={promo.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative h-48">
                        {promo.imageUrl ? (
                          <img
                            src={promo.imageUrl || "/placeholder.svg"}
                            alt={promo.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : (
                          <PlaceholderImage text={promo.title?.charAt(0) || "P"} className="w-full h-full" />
                        )}
                        {isPromoActive(promo) ? (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                            ACTIVE
                          </div>
                        ) : (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded">
                            INACTIVE
                          </div>
                        )}
                        {promo.code && (
                          <div className="absolute bottom-2 left-2 px-3 py-1 bg-white bg-opacity-90 text-[#FF7757] text-sm font-bold rounded border border-[#FF7757]">
                            {promo.code}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-1">{promo.title}</h3>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{promo.description}</p>
                        <div className="text-xs text-gray-500 mb-3">
                          <div>
                            Valid: {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                          </div>
                          {promo.minimumPurchase && (
                            <div className="mt-1">Min. purchase: ${promo.minimumPurchase.toLocaleString()}</div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-[#FF7757]">
                            {promo.discountPercentage ? `${promo.discountPercentage}% OFF` : "Special Offer"}
                          </span>
                          <Link
                            to={`/promo/${promo.id}`}
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
                    <nav className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1
                        // Show first page, last page, and pages around current page
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`px-3 py-1 rounded-md ${
                                currentPage === pageNumber
                                  ? "bg-[#FF7757] text-white"
                                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          )
                        } else if (
                          (pageNumber === currentPage - 2 && currentPage > 3) ||
                          (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                        ) {
                          // Show ellipsis
                          return <span key={pageNumber}>...</span>
                        }
                        return null
                      })}

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
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

export default Promos
