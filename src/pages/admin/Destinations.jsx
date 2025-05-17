"use client"

import { useState, useEffect, useCallback } from "react"
import BottomNav from "../../components/admin/BottomNav"
import DataTable from "../../components/admin/DataTable"
import Modal from "../../components/admin/Modal"
import { getActivities, getCategories, createActivity, updateActivity, deleteActivity } from "../../api"
import PlaceholderImage from "../../components/PlaceholderImage"
import toast from "react-hot-toast"
import { uploadImage } from "../../api"

const Destinations = () => {
  const [activities, setActivities] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [currentActivity, setCurrentActivity] = useState(null)
  const [formData, setFormData] = useState({
    categoryId: "",
    title: "",
    description: "",
    imageUrls: [],
    price: 0,
    price_discount: 0,
    rating: 0,
    total_reviews: 0,
    facilities: "",
    address: "",
    province: "",
    city: "",
    location_maps: "",
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreview, setImagePreview] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Function to fetch data with real-time updates
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [activitiesRes, categoriesRes] = await Promise.all([getActivities(), getCategories()])
      setActivities(activitiesRes.data.data)
      setCategories(categoriesRes.data.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data load and setup real-time refresh
  useEffect(() => {
    fetchData()

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds

    setRefreshInterval(interval)

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [fetchData])

  const handleOpenModal = (activity = null) => {
    if (activity) {
      setCurrentActivity(activity)
      setFormData({
        categoryId: activity.categoryId || "",
        title: activity.title || "",
        description: activity.description || "",
        imageUrls: activity.imageUrls || [],
        price: activity.price || 0,
        price_discount: activity.price_discount || 0,
        rating: activity.rating || 0,
        total_reviews: activity.total_reviews || 0,
        facilities: activity.facilities || "",
        address: activity.address || "",
        province: activity.province || "",
        city: activity.city || "",
        location_maps: activity.location_maps || "",
      })
      setImagePreview(activity.imageUrls || [])
    } else {
      setCurrentActivity(null)
      setFormData({
        categoryId: categories.length > 0 ? categories[0].id : "",
        title: "",
        description: "",
        imageUrls: [],
        price: 0,
        price_discount: 0,
        rating: 0,
        total_reviews: 0,
        facilities: "",
        address: "",
        province: "",
        city: "",
        location_maps: "",
      })
      setImagePreview([])
      setImageFiles([])
    }
    setIsModalOpen(true)
  }

  const handleOpenViewModal = (activity) => {
    setCurrentActivity(activity)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setCurrentActivity(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setCurrentActivity(null)
  }

  const handleOpenDeleteModal = (activity) => {
    setCurrentActivity(activity)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setCurrentActivity(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ["price", "price_discount", "rating", "total_reviews"].includes(name) ? Number.parseFloat(value) : value,
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      // Check file types
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
      const invalidFiles = files.filter((file) => !validTypes.includes(file.type))

      if (invalidFiles.length > 0) {
        toast.error("Please select valid image files (JPG, JPEG, PNG, GIF)")
        return
      }

      // Check file sizes (max 5MB each)
      const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024)

      if (oversizedFiles.length > 0) {
        toast.error("Some files are too large. Maximum size is 5MB per file")
        return
      }

      setImageFiles(files)

      // Create preview URLs
      const previews = files.map((file) => URL.createObjectURL(file))
      setImagePreview(previews)

      // Clean up preview URLs when component unmounts
      return () => {
        previews.forEach(URL.revokeObjectURL)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      toast.loading("Processing your request...", { id: "submit-toast" })

      // Upload images if new ones are selected
      let imageUrls = formData.imageUrls

      if (imageFiles.length > 0) {
        try {
          const uploadPromises = imageFiles.map((file) => uploadImage(file))
          const uploadResults = await Promise.all(uploadPromises)

          const newImageUrls = uploadResults
            .map((result) => {
              if (result?.data?.data?.imageUrl) {
                return result.data.data.imageUrl
              }
              return null
            })
            .filter(Boolean)

          if (newImageUrls.length === 0 && imageFiles.length > 0) {
            toast.error("Failed to upload images. Please try again.", { id: "submit-toast" })
            setSubmitting(false)
            return
          }

          // Replace existing image URLs with new ones
          imageUrls = newImageUrls
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError)
          toast.error("Failed to upload images. Please try again.", { id: "submit-toast" })
          setSubmitting(false)
          return
        }
      }

      const activityData = {
        ...formData,
        imageUrls: imageUrls.length > 0 ? imageUrls : formData.imageUrls,
      }

      let result
      if (currentActivity) {
        // Update existing activity
        result = await updateActivity(currentActivity.id, activityData)
        toast.success("Destination updated successfully", { id: "submit-toast" })

        // Update the activity in the local state for immediate UI update
        setActivities((prevActivities) =>
          prevActivities.map((activity) =>
            activity.id === currentActivity.id ? { ...activity, ...activityData } : activity,
          ),
        )
      } else {
        // Create new activity
        result = await createActivity(activityData)
        toast.success("Destination created successfully", { id: "submit-toast" })

        // Add the new activity to the local state for immediate UI update
        if (result?.data?.data) {
          setActivities((prevActivities) => [...prevActivities, result.data.data])
        }
      }

      // Refresh activities list to ensure we have the latest data
      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error("Error saving destination:", error)
      toast.error(error.response?.data?.message || "Failed to save destination", { id: "submit-toast" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentActivity) return

    try {
      setSubmitting(true)
      toast.loading("Deleting destination...", { id: "delete-toast" })

      await deleteActivity(currentActivity.id)

      // Remove the deleted activity from the local state for immediate UI update
      setActivities((prevActivities) => prevActivities.filter((activity) => activity.id !== currentActivity.id))

      toast.success("Destination deleted successfully", { id: "delete-toast" })

      // Refresh activities list to ensure we have the latest data
      fetchData()
      handleCloseDeleteModal()
    } catch (error) {
      console.error("Error deleting destination:", error)
      toast.error("Failed to delete destination", { id: "delete-toast" })
    } finally {
      setSubmitting(false)
    }
  }

  // Filter activities based on search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Use debounced search term for filtering
  const filteredActivities = activities.filter(
    (activity) =>
      activity.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      activity.city.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      activity.province.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
  )

  const columns = [
    {
      key: "title",
      header: "Title",
      render: (activity) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded overflow-hidden mr-3">
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
              text={activity.title?.charAt(0) || "?"}
              className="w-full h-full"
              style={{ display: activity.imageUrls && activity.imageUrls.length > 0 ? "none" : "flex" }}
            />
          </div>
          <span className="font-medium">{activity.title}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (activity) => `$${activity.price.toLocaleString()}`,
    },
    {
      key: "location",
      header: "Location",
      render: (activity) => `${activity.city}, ${activity.province}`,
    },
    {
      key: "rating",
      header: "Rating",
      render: (activity) => (
        <div className="flex items-center">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
          <span className="ml-1">
            {activity.rating} ({activity.total_reviews})
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (activity) => {
        const category = categories.find((cat) => cat.id === activity.categoryId)
        return category ? category.name : "Unknown"
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (activity) => (
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => handleOpenViewModal(activity)}
            className="p-1 text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full"
            title="View Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={() => handleOpenModal(activity)}
            className="p-1 text-blue-600 hover:text-blue-900 bg-blue-50 rounded-full"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => handleOpenDeleteModal(activity)}
            className="p-1 text-red-600 hover:text-red-900 bg-red-50 rounded-full"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ),
    },
  ]

  // Clean up image preview URLs when component unmounts
  useEffect(() => {
    return () => {
      imagePreview.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [imagePreview])

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">

      <div className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-16 transition-all duration-300 overflow-x-hidden">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Destinations</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757]"
              />
            </div>
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={() => fetchData()}
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

        {loading && activities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md h-96 animate-pulse"></div>
        ) : (
          <DataTable
            data={filteredActivities}
            columns={columns}
            itemsPerPage={7}
            onEdit={handleOpenModal}
            onDelete={handleOpenDeleteModal}
            onView={handleOpenViewModal}
            loading={loading}
          />
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={handleCloseViewModal} title="Destination Details">
        {currentActivity && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Image Gallery */}
            <div className="flex justify-center mb-4">
              <div className="w-full rounded-lg overflow-hidden bg-gray-100">
                {currentActivity.imageUrls && currentActivity.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentActivity.imageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url || "/placeholder.svg"}
                        alt={`${currentActivity.title} - Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <PlaceholderImage text={currentActivity.title?.charAt(0) || "?"} className="w-full h-48" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">{currentActivity.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{currentActivity.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Price</p>
                <p className="text-sm text-gray-900">${currentActivity.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Discount Price</p>
                <p className="text-sm text-gray-900">
                  {currentActivity.price_discount > 0
                    ? `$${currentActivity.price_discount.toLocaleString()}`
                    : "No discount"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Rating</p>
                <p className="text-sm text-gray-900">
                  {currentActivity.rating} ({currentActivity.total_reviews} reviews)
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Category</p>
                <p className="text-sm text-gray-900">
                  {categories.find((cat) => cat.id === currentActivity.categoryId)?.name || "Unknown"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Location</p>
              <p className="text-sm text-gray-900">
                {currentActivity.city}, {currentActivity.province}
              </p>
              <p className="text-sm text-gray-500 mt-1">{currentActivity.address}</p>
            </div>

            {currentActivity.facilities && (
              <div>
                <p className="text-sm font-medium text-gray-700">Facilities</p>
                <div
                  className="text-sm text-gray-500"
                  dangerouslySetInnerHTML={{ __html: currentActivity.facilities }}
                />
              </div>
            )}

            {currentActivity.location_maps && (
              <div>
                <p className="text-sm font-medium text-gray-700">Map</p>
                <div
                  className="mt-2 rounded overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: currentActivity.location_maps }}
                />
              </div>
            )}

            <div className="pt-2">
              <p className="text-xs text-gray-500">ID: {currentActivity.id}</p>
              <p className="text-xs text-gray-500">Created: {new Date(currentActivity.createdAt).toLocaleString()}</p>
              <p className="text-xs text-gray-500">Updated: {new Date(currentActivity.updatedAt).toLocaleString()}</p>
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
        title={currentActivity ? "Edit Destination" : "Add New Destination"}
      >
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

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
              <label className="block text-sm font-medium text-gray-700">Images</label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#FF7757] file:text-white hover:file:bg-[#ff6242]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {currentActivity ? "Upload new images or keep existing ones" : "Select one or more images"}
                </p>
              </div>

              {/* Image previews */}
              {(imagePreview.length > 0 || (currentActivity?.imageUrls && currentActivity.imageUrls.length > 0)) && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(imagePreview.length > 0 ? imagePreview : currentActivity.imageUrls).map((url, index) => (
                    <div key={index} className="relative h-20 rounded overflow-hidden group">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs">Image {index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Discount Price</label>
                <input
                  type="number"
                  name="price_discount"
                  value={formData.price_discount}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Rating</label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Total Reviews</label>
                <input
                  type="number"
                  name="total_reviews"
                  value={formData.total_reviews}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Facilities</label>
              <textarea
                name="facilities"
                value={formData.facilities}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                placeholder="&lt;p&gt;Wheel chair&lt;/p&gt;"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Province</label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location Maps</label>
              <textarea
                name="location_maps"
                value={formData.location_maps}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF7757] focus:border-[#FF7757]"
                placeholder="&lt;iframe src='...' width='600' height='450' style='border:0;'&gt;&lt;/iframe&gt;"
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
              {submitting ? "Saving..." : currentActivity ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} title="Delete Destination">
        <div>
          <p className="mb-4">Are you sure you want to delete this destination?</p>
          <p className="font-medium mb-6">{currentActivity?.title}</p>

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
      <BottomNav/>
    </div>
  )
}

export default Destinations
