"use client"

import { useState, useEffect } from "react"
import { getActivities } from "../api"
import ActivityCard from "../components/ActivityCard"
import toast from "react-hot-toast"

const Destination = () => {
  const [activities, setActivities] = useState([])
  const [filteredActivities, setFilteredActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [provinces, setProvinces] = useState([])
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [maxPrice, setMaxPrice] = useState(10000)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const response = await getActivities()
        const activitiesData = response.data.data
        setActivities(activitiesData)
        setFilteredActivities(activitiesData)

        // Extract unique provinces
        const uniqueProvinces = [...new Set(activitiesData.map((activity) => activity.province))]
        setProvinces(uniqueProvinces)

        // Find max price for range slider
        const highestPrice = Math.max(...activitiesData.map((activity) => activity.price), 1000)
        setMaxPrice(highestPrice)
        setPriceRange([0, highestPrice])
      } catch (error) {
        console.error("Error fetching activities:", error)
        toast.error("Failed to fetch destinations")
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  useEffect(() => {
    // Filter activities based on search term, selected province, and price range
    const filtered = activities.filter((activity) => {
      const matchesSearch =
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.province.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesProvince = selectedProvince ? activity.province === selectedProvince : true

      const matchesPrice = activity.price >= priceRange[0] && activity.price <= priceRange[1]

      return matchesSearch && matchesProvince && matchesPrice
    })

    setFilteredActivities(filtered)
  }, [searchTerm, selectedProvince, priceRange, activities])

  const handlePriceChange = (e) => {
    const value = Number.parseInt(e.target.value)
    const index = e.target.name === "min" ? 0 : 1
    const newRange = [...priceRange]
    newRange[index] = value
    setPriceRange(newRange)
  }

  const handleReset = () => {
    setSearchTerm("")
    setSelectedProvince("")
    setPriceRange([0, maxPrice])
  }

  return (
    // ADDED: Attractive gradient background
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-green-50 via-teal-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Destinations</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7757]"
              >
                <option value="">All Provinces</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  name="min"
                  value={priceRange[0]}
                  onChange={handlePriceChange}
                  min={0}
                  max={priceRange[1]}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                />
                <span>to</span>
                <input
                  type="number"
                  name="max"
                  value={priceRange[1]}
                  onChange={handlePriceChange}
                  min={priceRange[0]}
                  max={maxPrice}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={handleReset} className="px-4 py-2 text-[#FF7757] hover:text-[#ff6242]">
              Reset Filters
            </button>
          </div>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
            ))}
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No destinations found matching your criteria.</p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2 bg-[#FF7757] text-white rounded-md hover:bg-[#ff6242]"
            >
              Reset Filters
            </button>
          </div>
        )}
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

export default Destination
