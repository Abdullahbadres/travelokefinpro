"use client"

import { useState, useEffect } from "react"
import BottomNav from "../../components/admin/BottomNav"
import Modal from "../../components/admin/Modal"
import { getPromos, deletePromo } from "../../api"
import PlaceholderImage from "../../components/PlaceholderImage"
import toast from "react-hot-toast"
import { EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

const Promos = () => {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentPromo, setCurrentPromo] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    discountPercentage: 0,
    promoCode: "",
    termsConditions: "",
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const itemsPerPage = 6

  useEffect(() => {
    fetchPromos()

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPromos()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchPromos = async () => {
    try {
      setLoading(true)
      const response = await getPromos()
      setPromos(response.data.data)
    } catch (error) {
      console.error("Error fetching promos:", error)
      toast.error("Failed to fetch promos")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setCurrentPromo(promo)
      setFormData({
        title: promo.title || "",
        description: promo.description || "",
        imageUrl: promo.imageUrl || "",
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().split("T")[0] : "",
        endDate: promo.endDate ? new Date(promo.endDate).toISOString().split("T")[0] : "",
        discountPercentage: promo.discountPercentage || 0,
        promoCode: promo.promoCode || "",
        termsConditions: promo.termsConditions || "",
      })
      setImagePreview(promo.imageUrl || "")
    } else {
      setCurrentPromo(null)
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        startDate: "",
        endDate: "",
        discountPercentage: 0,
        promoCode: "",
        termsConditions: "",
      })
      setImagePreview("")
      setImageFile(null)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentPromo(null)
    setImageFile(null)
    setImagePreview("")
  }

  const handleOpenViewModal = (promo) => {
    setCurrentPromo(promo)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setCurrentPromo(null)
  }

  const handleOpenDeleteModal = (promo) => {
    setCurrentPromo(promo)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentPromo(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ["discountPercentage"].includes(name) ? Number.parseFloat(value) : value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      // Create a local URL for preview
      const localImageUrl = URL.createObjectURL(file)
      setImagePreview(localImageUrl)
      // Also update the form data with this local URL for now
      setFormData((prev) => ({
        ...prev,
        imageUrl: localImageUrl,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      // Create a copy of the form data to work with
      const promoData = { ...formData }

      // For demo purposes, simulate a successful image upload
      if (imageFile) {
        // In a real app, you would upload the image to a server here
        // For now, we'll just use the local preview URL as if it were uploaded
        const mockImageUrl = imagePreview
        promoData.imageUrl = mockImageUrl
      }

      // Simulate API delay
      setTimeout(() => {
        try {
          if (currentPromo) {
            // Update existing promo
            const updatedPromo = {
              ...currentPromo,
              ...promoData,
              updatedAt: new Date().toISOString(),
            }

            // Update the promo in the local state
            setPromos((prevPromos) => prevPromos.map((promo) => (promo.id === currentPromo.id ? updatedPromo : promo)))

            toast.success("Promo updated successfully")
          } else {
            // Create new promo
            const newPromo = {
              id: `mock-${Date.now()}`,
              ...promoData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }

            // Add the new promo to the local state
            setPromos((prevPromos) => [...prevPromos, newPromo])

            toast.success("Promo created successfully")
          }

          // Close modal and reset form
          handleCloseModal()
        } catch (error) {
          console.error("Error saving promo:", error)
          toast.error("Failed to save promo")
        } finally {
          setSubmitting(false)
        }
      }, 1000)
    } catch (error) {
      console.error("Error in form submission:", error)
      toast.error("An unexpected error occurred")
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentPromo) return

    try {
      setSubmitting(true)

      // For demo purposes, simulate a successful delete
      setTimeout(async () => {
        try {
          await deletePromo(currentPromo.id)
          toast.success("Promo deleted successfully")

          // Remove the deleted promo from the local state
          setPromos((prevPromos) => prevPromos.filter((promo) => promo.id !== currentPromo.id))

          handleCloseDeleteModal()
        } catch (error) {
          console.error("Error deleting promo:", error)
          toast.error("Failed to delete promo")
        } finally {
          setSubmitting(false)
        }
      }, 1000)
    } catch (error) {
      console.error("Error deleting promo:", error)
      toast.error("Failed to delete promo")
      setSubmitting(false)
    }
  }

  // Filter promos based on search term
  const filteredPromos = promos.filter(
    (promo) =>
      promo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.promoCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate pagination
  const totalPages = Math.ceil(filteredPromos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPromos = filteredPromos.slice(startIndex, endIndex)

  // Simplified pagination that works on all screen sizes
  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="bg-white px-2 py-3 flex items-center justify-center border-t border-gray-200 mt-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Previous button */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* First page */}
          <button
            onClick={() => setCurrentPage(1)}
            className={`relative inline-flex items-center justify-center w-8 h-8 rounded-md border text-sm font-medium ${
              currentPage === 1
                ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            1
          </button>

          {/* Ellipsis if needed */}
          {currentPage > 3 && totalPages > 4 && (
            <span className="relative inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700">
              ...
            </span>
          )}

          {/* Current page (if not first or last) */}
          {currentPage !== 1 && currentPage !== totalPages && (
            <button
              onClick={() => setCurrentPage(currentPage)}
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#FF7757] bg-[#FF7757] text-sm font-medium text-white"
            >
              {currentPage}
            </button>
          )}

          {/* Ellipsis if needed */}
          {currentPage < totalPages - 2 && totalPages > 4 && (
            <span className="relative inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-700">
              ...
            </span>
          )}

          {/* Last page (if not the same as first page) */}
          {totalPages > 1 && (
            <button
              onClick={() => setCurrentPage(totalPages)}
              className={`relative inline-flex items-center justify-center w-8 h-8 rounded-md border text-sm font-medium ${
                currentPage === totalPages
                  ? "z-10 bg-[#FF7757] border-[#FF7757] text-white"
                  : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {totalPages}
            </button>
          )}

          {/* Next button */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-16">

      <div className="flex-1 lg:ml-16 p-4 md:p-8 transition-all duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Promotions</h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search promos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#FF7757] focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242] whitespace-nowrap"
            >
              Add New Promo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md h-64 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            {filteredPromos.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No promotions found. Create your first promotion!</p>
              </div>
            ) : (
              <>
                {/* Card Grid View */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPromos.map((promo) => (
                    <div key={promo.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                      <div className="h-40 relative">
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

                        {/* Discount badge */}
                        {promo.discountPercentage > 0 && (
                          <div className="absolute top-2 right-2 bg-[#FF7757] text-white px-2 py-1 rounded-md font-bold">
                            {promo.discountPercentage}% OFF
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg mb-1 line-clamp-1">{promo.title}</h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{promo.description}</p>

                        <div className="mt-auto">
                          {promo.promoCode && (
                            <div className="bg-gray-100 p-2 rounded mb-2 text-center">
                              <span className="text-xs text-gray-500">PROMO CODE</span>
                              <p className="font-mono font-bold">{promo.promoCode}</p>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              {promo.startDate && promo.endDate ? (
                                <>
                                  {new Date(promo.startDate).toLocaleDateString()} -{" "}
                                  {new Date(promo.endDate).toLocaleDateString()}
                                </>
                              ) : (
                                "No date specified"
                              )}
                            </div>

                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleOpenViewModal(promo)}
                                className="p-1 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full"
                                title="View Details"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleOpenModal(promo)}
                                className="p-1 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-full"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(promo)}
                                className="p-1 text-red-600 hover:text-red-900 bg-red-50 rounded-full"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Updated pagination */}
                {renderPagination()}
              </>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentPromo ? "Edit Promotion" : "Add New Promotion"}
      >
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image</label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#FF7757] file:text-white hover:file:bg-[#ff6242]"
                />
              </div>

              {/* Image preview */}
              {imagePreview && (
                <div className="mt-2">
                  <div className="relative h-32 rounded overflow-hidden">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Percentage</label>
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleChange}
                min="0"
                max="100"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Promo Code</label>
              <input
                type="text"
                name="promoCode"
                value={formData.promoCode}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
              <textarea
                name="termsConditions"
                value={formData.termsConditions}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              />
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
              {submitting ? "Saving..." : currentPromo ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Promotion Details">
        {currentPromo && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="flex justify-center mb-4">
              <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                {currentPromo.imageUrl ? (
                  <img
                    src={currentPromo.imageUrl || "/placeholder.svg"}
                    alt={currentPromo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PlaceholderImage text={currentPromo.title?.charAt(0) || "P"} className="w-full h-full" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">{currentPromo.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{currentPromo.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Discount</p>
                <p className="text-sm text-gray-900">{currentPromo.discountPercentage}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Promo Code</p>
                <p className="text-sm font-mono font-bold text-gray-900">{currentPromo.promoCode || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Start Date</p>
                <p className="text-sm text-gray-900">
                  {currentPromo.startDate ? new Date(currentPromo.startDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">End Date</p>
                <p className="text-sm text-gray-900">
                  {currentPromo.endDate ? new Date(currentPromo.endDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            {currentPromo.termsConditions && (
              <div>
                <p className="text-sm font-medium text-gray-700">Terms & Conditions</p>
                <p className="text-sm text-gray-500">{currentPromo.termsConditions}</p>
              </div>
            )}

            <div className="pt-2">
              <p className="text-xs text-gray-500">ID: {currentPromo.id}</p>
              <p className="text-xs text-gray-500">Created: {new Date(currentPromo.createdAt).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Updated: {new Date(currentPromo.updatedAt).toLocaleString()}</p>
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
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete Promotion">
        <div>
          <p className="mb-4">Are you sure you want to delete this promotion?</p>
          <p className="font-medium mb-6">{currentPromo?.title}</p>

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

export default Promos
