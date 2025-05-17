"use client"

import { useState, useEffect } from "react"
import { getCategories, getActivitiesByCategory } from "../api"
import ActivityCard from "../components/ActivityCard"
import toast from "react-hot-toast"

const Category = () => {
  const [categories, setCategories] = useState([])
  const [activities, setActivities] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [activitiesPerPage, setActivitiesPerPage] = useState(8)
  const [allActivities, setAllActivities] = useState([])
  const [totalActivities, setTotalActivities] = useState(0)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const response = await getCategories()
        setCategories(response.data.data)

        // Select the first category by default if available
        if (response.data.data.length > 0) {
          setSelectedCategory(response.data.data[0])
          fetchActivitiesByCategory(response.data.data[0].id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast.error("Failed to fetch categories")
        setLoading(false)
      }
    }

    fetchCategories()

    // Adjust activities per page based on screen size
    const handleResize = () => {
      const width = window.innerWidth
      if (width >= 1600) {
        // Desktop
        setActivitiesPerPage(12)
      } else if (width >= 1280) {
        // Laptop
        setActivitiesPerPage(9)
      } else if (width >= 768) {
        // Tablet
        setActivitiesPerPage(6)
      } else {
        // Mobile
        setActivitiesPerPage(4)
      }
    }

    // Set initial value
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const fetchActivitiesByCategory = async (categoryId) => {
    try {
      setLoading(true)
      const response = await getActivitiesByCategory(categoryId)
      setActivities(response.data.data)
    } catch (error) {
      console.error("Error fetching activities:", error)
      toast.error("Failed to fetch activities")
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
    fetchActivitiesByCategory(category.id)
  }

  const fetchAllActivities = async () => {
    try {
      setLoading(true)
      // Fetch activities from all categories
      const allActivitiesPromises = categories.map((category) =>
        getActivitiesByCategory(category.id)
          .then((response) => response.data.data)
          .catch((error) => {
            console.error(`Error fetching activities for category ${category.id}:`, error)
            return []
          }),
      )

      const results = await Promise.all(allActivitiesPromises)
      const combinedActivities = results.flat()

      // Remove duplicates based on activity id
      const uniqueActivities = Array.from(new Map(combinedActivities.map((item) => [item.id, item])).values())

      setAllActivities(uniqueActivities)
      setTotalActivities(uniqueActivities.length)

      // Set current page activities
      const indexOfLastActivity = currentPage * activitiesPerPage
      const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage
      setActivities(uniqueActivities.slice(indexOfFirstActivity, indexOfLastActivity))
    } catch (error) {
      console.error("Error fetching all activities:", error)
      toast.error("Failed to fetch activities")
    } finally {
      setLoading(false)
    }
  }

  const handleAllCategoriesClick = () => {
    setSelectedCategory({ id: "all", name: "All Categories" })
    fetchAllActivities()
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)

    if (selectedCategory?.id === "all") {
      const indexOfLastActivity = pageNumber * activitiesPerPage
      const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage
      setActivities(allActivities.slice(indexOfFirstActivity, indexOfLastActivity))
    }

    // Scroll to top of activities section
    const activitiesSection = document.getElementById("activities-section")
    if (activitiesSection) {
      activitiesSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Calculate pagination numbers
  const totalPages =
    selectedCategory?.id === "all"
      ? Math.ceil(totalActivities / activitiesPerPage)
      : Math.ceil(activities.length / activitiesPerPage)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        endPage = 3
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("...")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Update current page activities when page size changes
  useEffect(() => {
    if (selectedCategory?.id === "all" && allActivities.length > 0) {
      const indexOfLastActivity = currentPage * activitiesPerPage
      const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage
      setActivities(allActivities.slice(indexOfFirstActivity, indexOfLastActivity))
      setTotalActivities(allActivities.length)
    }
  }, [activitiesPerPage, selectedCategory, allActivities, currentPage])

  return (
    // ADDED: Attractive gradient background
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Categories</h1>

        {/* Categories List */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex flex-wrap gap-4 min-w-max pb-2">
            <button
              onClick={handleAllCategoriesClick}
              className={`flex items-center px-4 py-2 rounded-full border transition-colors ${
                selectedCategory?.id === "all"
                  ? "bg-[#FF7757] text-white border-[#FF7757]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#FF7757]"
              }`}
            >
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                All
              </span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`flex items-center px-4 py-2 rounded-full border transition-colors ${
                  selectedCategory?.id === category.id
                    ? "bg-[#FF7757] text-white border-[#FF7757]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#FF7757]"
                }`}
              >
                {category.imageUrl && (
                  <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                    <img
                      src={category.imageUrl || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none"
                      }}
                    />
                  </div>
                )}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activities Grid */}
        <div id="activities-section">
          {selectedCategory && <h2 className="text-xl font-semibold mb-4">Activities in {selectedCategory.name}</h2>}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(activitiesPerPage)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 flex-wrap">
                  <nav className="flex items-center space-x-1 sm:space-x-2">
                    {/* Previous button */}
                    <button
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md ${
                        currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers().map((pageNumber, index) => (
                      <button
                        key={index}
                        onClick={() => typeof pageNumber === "number" && handlePageChange(pageNumber)}
                        disabled={pageNumber === "..."}
                        className={`hidden sm:block px-3 py-2 rounded-md ${
                          pageNumber === currentPage
                            ? "bg-[#FF7757] text-white"
                            : pageNumber === "..."
                              ? "text-gray-700 cursor-default"
                              : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    {/* Mobile pagination indicator */}
                    <span className="sm:hidden text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>

                    {/* Next button */}
                    <button
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
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
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">No activities found in this category.</p>
            </div>
          )}
        </div>
      </div>
      <footer className="bg-[#172432] text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-[#FF7757] mb-6">Traveloke</h3>
              <img src="https://i.ibb.co.com/ZpJKSvDB/traveloke-removebg-preview.png" alt="Traveloke Logo" className="w-25 h-20 mr-4" />
              <p className="text-gray-300 mb-6">Book your trip in minutes, get full control for much longer.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-white hover:text-[#FF7757]">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-[#FF7757]">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-[#FF7757]">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Gift Cards
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Legal Notice
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Sitemap
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Stay Connected</h4>
              <p className="text-gray-300 mb-4">Subscribe to our newsletter to get travel tips and special offers!</p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 w-full rounded-l-md focus:outline-none text-gray-900"
                />
                <button type="submit" className="bg-[#FF7757] text-white px-4 py-2 rounded-r-md hover:bg-[#ff6242]">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <p className="text-center text-gray-400 text-sm">
              © {new Date().getFullYear()} Traveloke. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Category
