"use client"

import { useState, useEffect } from "react"
import BottomNav from "../../components/admin/BottomNav"
import Modal from "../../components/admin/Modal"
import { getBanners, createBanner, updateBanner, deleteBanner } from "../../api"
import PlaceholderImage from "../../components/PlaceholderImage"
import toast from "react-hot-toast"
import { EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { uploadImage } from "../../api/index"

const Banners = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentBanner, setCurrentBanner] = useState(null)
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
    fetchBanners()

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBanners()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await getBanners()
      setBanners(response.data.data)
    } catch (error) {
      console.error("Error fetching banners:", error)
      toast.error("Failed to fetch banners")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setCurrentBanner(banner)
      setFormData({
        name: banner.name || "",
        imageUrl: banner.imageUrl || "",
      })
      setImagePreview(banner.imageUrl || "")
    } else {
      setCurrentBanner(null)
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
    setCurrentBanner(null)
  }

  const handleOpenViewModal = (banner) => {
    setCurrentBanner(banner)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setCurrentBanner(null)
  }

  const handleOpenDeleteModal = (banner) => {
    setCurrentBanner(banner)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentBanner(null)
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
      // Check file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPG, JPEG, PNG, GIF, WEBP, SVG)")
        return
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size should be less than 10MB")
        return
      }

      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form data
    if (!formData.name.trim()) {
      toast.error("Banner name is required", { id: "banner-toast" })
      return
    }

    try {
      setSubmitting(true)
      toast.loading("Processing your request...", { id: "banner-toast" })

      // Create a copy of the form data to work with
      const bannerData = { ...formData }

      // Upload image if a new one is selected
      if (imageFile) {
        try {
          const uploadResponse = await uploadImage(imageFile)
          console.log("Upload response:", uploadResponse)

          // Check the actual structure of the response
          if (uploadResponse && uploadResponse.data) {
            // The API returns the URL directly in the 'url' field, not in data.imageUrl
            if (uploadResponse.data.url) {
              bannerData.imageUrl = uploadResponse.data.url
              console.log("Successfully extracted image URL:", bannerData.imageUrl)
            } else {
              console.warn("Upload response doesn't contain url field:", uploadResponse.data)
              toast.error("Image upload response format is unexpected", { id: "banner-toast" })
            }
          } else {
            console.warn("Upload response format is unexpected:", uploadResponse)
            toast.error("Image upload failed, continuing with banner creation without image", { id: "banner-toast" })
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
          toast.error("Failed to upload image. Continuing without image.", { id: "banner-toast" })
          // Continue without image if upload fails
        }
      }

      let response
      if (currentBanner) {
        // Update existing banner
        response = await updateBanner(currentBanner.id, bannerData)
        console.log("Update banner response:", response)

        if (response.data && (response.data.message || response.data.data)) {
          toast.success("Banner updated successfully", { id: "banner-toast" })

          // Update the banner in the local state
          setBanners((prevBanners) =>
            prevBanners.map((banner) =>
              banner.id === currentBanner.id
                ? { ...banner, ...bannerData, updatedAt: new Date().toISOString() }
                : banner,
            ),
          )
        } else {
          throw new Error("Failed to update banner")
        }
      } else {
        // Create new banner
        console.log("Creating banner with data:", bannerData)
        response = await createBanner(bannerData)
        console.log("Create banner response:", response)

        if (response.data) {
          // Check if the response contains data or a success message
          if (response.data.data || response.data.message) {
            toast.success("Banner created successfully", { id: "banner-toast" })

            // Add the new banner to the local state
            if (response.data.data) {
              setBanners((prevBanners) => [...prevBanners, response.data.data])
            } else {
              // If we don't have the created banner data, refresh to get the latest
              fetchBanners()
            }
          } else {
            console.error("Unexpected response format:", response.data)
            throw new Error("Failed to create banner: Unexpected response format")
          }
        } else {
          throw new Error("Failed to create banner: No data in response")
        }
      }

      // Refresh banners to ensure we have the latest data
      fetchBanners()

      // Close modal and reset form
      handleCloseModal()
    } catch (error) {
      console.error("Error saving banner:", error)
      toast.error(error.response?.data?.message || "Failed to save banner", { id: "banner-toast" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentBanner) return

    try {
      setSubmitting(true)
      toast.loading("Deleting banner...", { id: "delete-toast" })

      const response = await deleteBanner(currentBanner.id)

      if (response.data && response.data.message) {
        toast.success("Banner deleted successfully", { id: "delete-toast" })

        // Remove the deleted banner from the local state
        setBanners((prevBanners) => prevBanners.filter((banner) => banner.id !== currentBanner.id))

        handleCloseDeleteModal()
      } else {
        throw new Error("Failed to delete banner")
      }
    } catch (error) {
      console.error("Error deleting banner:", error)
      toast.error("Failed to delete banner", { id: "delete-toast" })
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(banners.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBanners = banners.slice(startIndex, endIndex)

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

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (banner) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded overflow-hidden mr-3">
            {banner.imageUrl ? (
              <img
                src={banner.imageUrl || "/placeholder.svg"}
                alt={banner.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none"
                  e.target.nextSibling.style.display = "flex"
                }}
              />
            ) : null}
            <PlaceholderImage
              text={banner.name?.charAt(0) || "?"}
              className="w-full h-full"
              style={{ display: banner.imageUrl ? "none" : "flex" }}
            />
          </div>
          <span className="font-medium">{banner.name}</span>
        </div>
      ),
    },
    {
      key: "imageUrl",
      header: "Image Preview",
      render: (banner) => (
        <div className="w-32 h-16 rounded overflow-hidden">
          {banner.imageUrl ? (
            <img
              src={banner.imageUrl || "/placeholder.svg"}
              alt={banner.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "flex"
              }}
            />
          ) : null}
          <PlaceholderImage
            text={banner.name}
            className="w-full h-full"
            style={{ display: banner.imageUrl ? "none" : "flex" }}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (banner) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => handleOpenViewModal(banner)}
            className="p-1 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleOpenModal(banner)}
            className="p-1 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-full"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleOpenDeleteModal(banner)}
            className="p-1 text-red-600 hover:text-red-900 bg-red-50 rounded-full"
            title="Delete"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-16">
      <div className="flex-1 lg:ml-16 p-4 md:p-8 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Banners</h1>
          <div className="flex space-x-4">
            <button
              onClick={fetchBanners}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242]"
            >
              Add New Banner
            </button>
          </div>
        </div>

        {loading && banners.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md h-96 animate-pulse"></div>
        ) : (
          <>
            {/* Mobile Card View */}
            {isMobile && (
              <div className="space-y-4">
                {currentBanners.map((banner) => (
                  <div key={banner.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                        {banner.imageUrl ? (
                          <img
                            src={banner.imageUrl || "/placeholder.svg"}
                            alt={banner.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : null}
                        <PlaceholderImage
                          text={banner.name?.charAt(0) || "?"}
                          className="w-full h-full"
                          style={{ display: banner.imageUrl ? "none" : "flex" }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{banner.name}</h3>
                        <p className="text-xs text-gray-500">ID: {banner.id}</p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenViewModal(banner)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(banner)}
                        className="p-2 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-full"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(banner)}
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

            {/* Desktop Table View */}
            {!isMobile && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentBanners.map((banner) => (
                      <tr key={banner.id} className="hover:bg-gray-50">
                        {columns.map((column) => (
                          <td key={`${banner.id}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                            {column.render ? column.render(banner) : banner[column.key]}
                          </td>
                        ))}
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
                      <span className="font-medium">{Math.min(endIndex, banners.length)}</span> of{" "}
                      <span className="font-medium">{banners.length}</span> results
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

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentBanner ? "Edit Banner" : "Add New Banner"}>
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
              {submitting ? "Saving..." : currentBanner ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Banner Details">
        {currentBanner && (
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                {currentBanner.imageUrl ? (
                  <img
                    src={currentBanner.imageUrl || "/placeholder.svg"}
                    alt={currentBanner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PlaceholderImage text={currentBanner.name?.charAt(0) || "?"} className="w-full h-full" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">{currentBanner.name}</h3>
            </div>

            <div className="pt-2">
              <p className="text-sm text-gray-500">ID: {currentBanner.id}</p>
              <p className="text-sm text-gray-500">Created: {new Date(currentBanner.createdAt).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Updated: {new Date(currentBanner.updatedAt).toLocaleString()}</p>
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete Banner">
        <div>
          <p className="mb-4">Are you sure you want to delete this banner?</p>
          <p className="font-medium mb-6">{currentBanner?.name}</p>

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
      <br />
      <BottomNav />
    </div>
  )
}

export default Banners
