"use client"

import { useState, useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"

const DataTable = ({ data, columns, actions, itemsPerPage = 7, onEdit, onDelete, onView, loading }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [data.length])

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll to top of table on page change
    if (typeof window !== "undefined") {
      const tableElement = document.querySelector("[data-table-container]")
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  // Generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = isMobile ? 3 : isTablet ? 4 : 5 // Responsive pagination

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden" data-table-container>
      {/* Mobile Card View */}
      {isMobile && (
        <div className="p-4 space-y-4">
          {currentData.length > 0 ? (
            currentData.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                {columns.map((column) => {
                  if (column.key === "actions") return null // Skip actions column for now
                  return (
                    <div key={column.key} className="mb-2">
                      <div className="text-sm font-medium text-gray-500">{column.header}</div>
                      <div className="mt-1">{column.render ? column.render(item) : item[column.key]}</div>
                    </div>
                  )
                })}

                {/* Actions */}
                <div className="flex justify-end space-x-2 mt-4">
                  {onView && (
                    <button
                      onClick={() => onView(item)}
                      className="p-2 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full"
                      aria-label="View details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-full"
                      aria-label="Edit"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="p-2 text-red-600 hover:text-red-900 bg-red-50 rounded-full"
                      aria-label="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      )}

      {/* Tablet and Desktop Table View */}
      {!isMobile && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                {actions && (
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td
                        key={`${item.id}-${column.key}`}
                        className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {column.render ? column.render(item) : item[column.key]}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {onView && (
                            <button
                              onClick={() => onView(item)}
                              className="text-indigo-600 hover:text-indigo-900"
                              aria-label="View details"
                            >
                              View
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="text-blue-600 hover:text-blue-900"
                              aria-label="Edit"
                            >
                              Edit
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="text-red-600 hover:text-red-900"
                              aria-label="Delete"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          {/* Mobile and Tablet Pagination */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <span className="sr-only sm:not-sr-only">Prev</span>
              <ChevronLeftIcon className="h-5 w-5 sm:hidden" aria-hidden="true" />
            </button>

            <div className="hidden sm:flex space-x-1">
              {/* First page always shown */}
              <button
                onClick={() => handlePageChange(1)}
                className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                  currentPage === 1
                    ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
                aria-label="Page 1"
                aria-current={currentPage === 1 ? "page" : undefined}
              >
                1
              </button>

              {/* Show ellipsis if needed */}
              {currentPage > 3 && (
                <span className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              )}

              {/* Current page neighborhood */}
              {currentPage !== 1 && currentPage !== totalPages && (
                <button
                  className="z-10 bg-[#FF7757] border-[#FF7757] text-white relative inline-flex items-center px-3 py-2 border text-sm font-medium"
                  aria-label={`Page ${currentPage}`}
                  aria-current="page"
                >
                  {currentPage}
                </button>
              )}

              {/* Show ellipsis if needed */}
              {currentPage < totalPages - 2 && (
                <span className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              )}

              {/* Last page always shown if not page 1 */}
              {totalPages > 1 && (
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                    currentPage === totalPages
                      ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                  aria-label={`Page ${totalPages}`}
                  aria-current={currentPage === totalPages ? "page" : undefined}
                >
                  {totalPages}
                </button>
              )}
            </div>

            {/* Extra small screens just show current/total */}
            <span className="sm:hidden text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <span className="sr-only sm:not-sr-only">Next</span>
              <ChevronRightIcon className="h-5 w-5 sm:hidden" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
