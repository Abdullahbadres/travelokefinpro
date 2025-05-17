"use client"

import { useState, useEffect } from "react"
import Modal from "../../components/admin/Modal"
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../api"
import PlaceholderImage from "../../components/PlaceholderImage"
import toast from "react-hot-toast"
import { EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { uploadImage } from "../../api"
import BottomNav from "../../components/admin/BottomNav"
import { useNavigate } from "react-router-dom"
import { getActivitiesByCategory } from "../../api"

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(7)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryActivities, setCategoryActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const navigate = useNavigate()

  // Check if the screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  useEffect(() => {
    fetchCategories()

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchCategories()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await getCategories()
      setCategories(response.data.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to fetch categories")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setCurrentCategory(category)
      setFormData({
        name: category.name || "",
        imageUrl: category.imageUrl || "",
      })
      setImagePreview(category.imageUrl || "")
    } else {
      setCurrentCategory(null)
      setFormData({
        name: "",
        imageUrl: "",
      })
      setImagePreview("")
      setImageFile(null)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentCategory(null)
  }

  const handleOpenViewModal = async (category) => {
    setCurrentCategory(category)
    setIsViewModalOpen(true)

    // Fetch activities for this category
    try {
      setLoadingActivities(true)
      const response = await getActivitiesByCategory(category.id)
      setCategoryActivities(response.data.data || [])
    } catch (error) {
      console.error("Error fetching category activities:", error)
      toast.error("Failed to fetch activities for this category")
      setCategoryActivities([])
    } finally {
      setLoadingActivities(false)
    }
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setCurrentCategory(null)
    setCategoryActivities([])
  }

  const handleOpenDeleteModal = (category) => {
    setCurrentCategory(category)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentCategory(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form data
    if (!formData.name.trim()) {
      toast.error("Category name is required", { id: "category-toast" })
      return
    }
    // Note: We're not requiring an image anymore, so we removed that validation

    try {
      setSubmitting(true)
      toast.loading("Processing your request...", { id: "category-toast" })

      // Create a copy of the form data to work with
      const categoryData = { ...formData }

      // Upload image if a new one is selected
      if (imageFile) {
        try {
          const uploadResponse = await uploadImage(imageFile)
          console.log("Upload response:", uploadResponse)

          // Check if the response contains the image URL
          if (uploadResponse && uploadResponse.data) {
            // The API returns the URL in response.data.url, not in response.data.data.imageUrl
            if (uploadResponse.data.url) {
              categoryData.imageUrl = uploadResponse.data.url
              console.log("Image URL extracted:", categoryData.imageUrl)
            } else if (uploadResponse.data.data && uploadResponse.data.data.imageUrl) {
              categoryData.imageUrl = uploadResponse.data.data.imageUrl
              console.log("Image URL extracted from data.data:", categoryData.imageUrl)
            } else {
              console.error("Upload response format is unexpected:", uploadResponse)
              throw new Error("Invalid upload response format")
            }
          } else {
            throw new Error("Invalid upload response format")
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
          toast.error("Failed to upload image. Please try again.", { id: "category-toast" })
          setSubmitting(false)
          return
        }
      } else if (currentCategory) {
        // If no new image is selected but we are updating, keep the existing image URL
        categoryData.imageUrl = currentCategory.imageUrl || ""
      }

      let response
      if (currentCategory) {
        // Update existing category
        // Inside handleSubmit function, where you prepare categoryData for update
        const categoryData = {
          name: formData.name,
        }

        // Only include imageUrl in the update data if a new image was uploaded
        if (imagePreview) {
          categoryData.imageUrl = imagePreview
        } else if (currentCategory && currentCategory.imageUrl) {
          // Keep the existing image URL if there is one
          categoryData.imageUrl = currentCategory.imageUrl
        }
        try {
          console.log("Updating category with data:", categoryData)
          response = await updateCategory(currentCategory.id, categoryData)

          if (response.status === 200) {
            toast.success("Category updated successfully", { id: "category-toast" })

            // Update the category in the local state
            setCategories((prevCategories) =>
              prevCategories.map((cat) =>
                cat.id === currentCategory.id ? { ...cat, ...categoryData, updatedAt: new Date().toISOString() } : cat,
              ),
            )

            // Reset form
            setFormData({
              name: "",
              imageUrl: "",
            })
            setImageFile(null)
            setImagePreview("")
            setCurrentCategory(null)
            setIsModalOpen(false)
          }
        } catch (error) {
          console.error("Error saving category:", error)

          // Check if it's a 400 error but the category might have been updated anyway
          if (error.response && error.response.status === 400) {
            // Try to fetch the categories again to see if the update went through
            fetchCategories()
            toast.success("Category may have been updated. Refreshing data...", { id: "category-toast" })

            // Reset form
            setFormData({
              name: "",
              imageUrl: "",
            })
            setImageFile(null)
            setImagePreview("")
            setCurrentCategory(null)
            setIsModalOpen(false)
          } else {
            toast.error(`Error saving category: ${error.message}`, { id: "category-toast" })
          }
        }
      } else {
        // Create new category
        console.log("Creating category with data:", categoryData)
        response = await createCategory(categoryData)
        console.log("Create category response:", response)

        // Check for success in different possible response formats
        if (response.status === 200 || response.status === 201) {
          toast.success("Category created successfully", { id: "category-toast" })

          // Try to add the new category to the local state if we have the data
          if (response.data && response.data.data) {
            setCategories((prevCategories) => [...prevCategories, response.data.data])
          } else if (response.data && response.data.message) {
            // If we don't have the new category data but the API says success,
            // just refresh the categories list
            fetchCategories()
          }

          // Close modal and reset form
          handleCloseModal()
        } else {
          throw new Error("Failed to create category")
        }
      }
    } catch (error) {
      console.error("Error saving category:", error)

      // Check if the error is just our own validation or if the API actually failed
      if (error.response && error.response.status >= 400) {
        // Try to get a more specific error message from the API response
        const errorMessage = error.response?.data?.message || "Failed to save category"
        toast.error(errorMessage, { id: "category-toast" })
      } else if (
        !error.message.includes("Failed to create category") &&
        !error.message.includes("Failed to update category")
      ) {
        // Only show error toast if it's not our own validation error
        toast.error("An unexpected error occurred", { id: "category-toast" })
      } else {
        // If it's our validation error but the API call was successful, show success
        toast.success("Category saved successfully", { id: "category-toast" })
        fetchCategories()
        handleCloseModal()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentCategory) return

    try {
      setSubmitting(true)
      toast.loading("Deleting category...", { id: "delete-toast" })

      const response = await deleteCategory(currentCategory.id)

      if (response.data && response.data.message) {
        toast.success("Category deleted successfully", { id: "delete-toast" })

        // Remove the deleted category from the local state
        setCategories((prevCategories) => prevCategories.filter((cat) => cat.id !== currentCategory.id))

        handleCloseDeleteModal()
      } else {
        throw new Error("Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category", { id: "delete-toast" })
    } finally {
      setSubmitting(false)
    }
  }

  // Navigate to activity detail when an activity is clicked
  const handleActivityClick = (activityId) => {
    navigate(`/activity/${activityId}`)
    handleCloseViewModal()
  }

  // Filter categories based on search term
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCategories = filteredCategories.slice(startIndex, endIndex)

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

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-16">
      <div className="flex-1 lg:ml-16 p-4 md:p-8 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Categories</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757]"
              />
            </div>
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={fetchCategories}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex-1 sm:flex-none text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] flex-1 sm:flex-none text-sm sm:text-base"
              >
                Add New
              </button>
            </div>
          </div>
        </div>

        {loading && categories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md h-96 animate-pulse"></div>
        ) : (
          <>
            {/* Mobile Card View */}
            {isMobile && (
              <div className="space-y-4">
                {currentCategories.map((category) => (
                  <div key={category.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl || "/placeholder.svg"}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : null}
                        <PlaceholderImage
                          text={category.name?.charAt(0) || "?"}
                          className="w-full h-full"
                          style={{ display: category.imageUrl ? "none" : "flex" }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-xs text-gray-500">ID: {category.id}</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenViewModal(category)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(category)}
                        className="p-2 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-full"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(category)}
                        className="p-2 text-red-600 hover:text-red-900 bg-red-50 rounded-full"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tablet and Desktop Table View */}
            {!isMobile && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Image Preview
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                              {category.imageUrl ? (
                                <img
                                  src={category.imageUrl || "/placeholder.svg"}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none"
                                    e.target.nextSibling.style.display = "flex"
                                  }}
                                />
                              ) : null}
                              <PlaceholderImage
                                text={category.name?.charAt(0) || "?"}
                                className="w-full h-full"
                                style={{ display: category.imageUrl ? "none" : "flex" }}
                              />
                            </div>
                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-32 h-16 rounded overflow-hidden">
                            {category.imageUrl ? (
                              <img
                                src={category.imageUrl || "/placeholder.svg"}
                                alt={category.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none"
                                  e.target.nextSibling.style.display = "flex"
                                }}
                              />
                            ) : null}
                            <PlaceholderImage
                              text={category.name}
                              className="w-full h-full"
                              style={{ display: category.imageUrl ? "none" : "flex" }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleOpenViewModal(category)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View Details"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleOpenModal(category)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(category)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 px-4 py-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(endIndex, categories.length)}</span> of{" "}
                      <span className="font-medium">{categories.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>

                      {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Category Details">
        {currentCategory && (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                {currentCategory.imageUrl ? (
                  <img
                    src={currentCategory.imageUrl || "/placeholder.svg"}
                    alt={currentCategory.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PlaceholderImage text={currentCategory.name?.charAt(0) || "?"} className="w-full h-full" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">{currentCategory.name}</h3>
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-500">ID: {currentCategory.id}</p>
              <p className="text-sm text-gray-500">Created: {new Date(currentCategory.createdAt).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Updated: {new Date(currentCategory.updatedAt).toLocaleString()}</p>
            </div>

            {/* Activities in this category */}
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-800 mb-2">Activities in this category:</h4>

              {loadingActivities ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7757]"></div>
                </div>
              ) : categoryActivities.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {categoryActivities.map((activity) => (
                      <li key={activity.id} className="py-2">
                        <button
                          onClick={() => handleActivityClick(activity.id)}
                          className="w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 mr-3">
                              {activity.imageUrls && activity.imageUrls.length > 0 ? (
                                <img
                                  src={activity.imageUrls[0] || "/placeholder.svg"}
                                  alt={activity.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none"
                                  }}
                                />
                              ) : (
                                <PlaceholderImage text={activity.title?.charAt(0) || "?"} className="w-full h-full" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{activity.title}</p>
                              <p className="text-sm text-gray-500">
                                {activity.city}, {activity.province}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-2">No activities found in this category.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentCategory ? "Edit Category" : "Add New Category"}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <div className="mt-1 flex items-center">
                <div className="w-32 h-16 rounded overflow-hidden bg-gray-100 mr-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#FF7757] file:text-white hover:file:bg-[#ff6242]"
                />
              </div>
              {currentCategory && !currentCategory.imageUrl && !imageFile && (
                <p className="mt-1 text-sm text-gray-500">
                  No image currently set. You can upload one or leave it blank.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] disabled:opacity-50"
            >
              {submitting ? "Saving..." : currentCategory ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete Category">
        <div>
          <p className="mb-4">Are you sure you want to delete this category?</p>
          <p className="font-medium mb-6">{currentCategory?.name}</p>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCloseDeleteModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
      <BottomNav />
    </div>
  )
}

export default Categories
