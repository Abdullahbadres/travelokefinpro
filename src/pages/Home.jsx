"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"
import Banner from "../components/Banner"
import PopularDestination from "../components/PopularDestination"
import ActivityCard from "../components/ActivityCard"
import PromoCard from "../components/PromoCard"
import { getPromos, getActivities, getCategories } from "../api"
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowRightIcon,
  StarIcon,
  HeartIcon,
  GlobeAltIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline"
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid"

// Blog post data
const blogPosts = [
  {
    id: 1,
    title: "10 Essential Tips for Budget Travel in Southeast Asia",
    excerpt:
      "Discover how to explore Southeast Asia on a budget with these essential tips for accommodation, food, and transportation.",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    date: "June 15, 2023",
    author: "Sarah Johnson",
    authorImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    readTime: "8 min read",
    category: "Budget Travel",
  },
  {
    id: 2,
    title: "The Ultimate Guide to Hiking in the Swiss Alps",
    excerpt:
      "Everything you need to know about planning a hiking trip in the Swiss Alps, from trail selection to equipment.",
    image:
      "https://images.unsplash.com/photo-1531210483974-4f8c1f33fd35?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    date: "July 22, 2023",
    author: "Michael Chen",
    authorImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    readTime: "12 min read",
    category: "Adventure",
  },
  {
    id: 3,
    title: "5 Hidden Beaches in Bali You Need to Visit",
    excerpt:
      "Escape the crowds and discover these secluded beaches in Bali that offer pristine sands and crystal-clear waters.",
    image:
      "https://images.unsplash.com/photo-1502208327471-d5dde4d78995?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    date: "August 5, 2023",
    author: "Emma Rodriguez",
    authorImage:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    readTime: "6 min read",
    category: "Beaches",
  },
  {
    id: 4,
    title: "A Food Lover's Journey Through Italy",
    excerpt:
      "Follow this culinary adventure through Italy's regions, exploring traditional dishes and local ingredients.",
    image:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    date: "September 12, 2023",
    author: "David Kim",
    authorImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    readTime: "10 min read",
    category: "Food & Culture",
  },
  {
    id: 5,
    title: "How to Pack for a Year-Long Trip Around the World",
    excerpt: "Essential packing tips and strategies for long-term travelers embarking on a global adventure.",
    image:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    date: "October 3, 2023",
    author: "Jessica Taylor",
    authorImage:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    readTime: "9 min read",
    category: "Travel Tips",
  },
  {
    id: 6,
    title: "The Best Time to Visit Japan's Cherry Blossoms",
    excerpt:
      "Plan your trip to Japan with this guide to cherry blossom season, including the best viewing spots and festivals.",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    date: "November 18, 2023",
    author: "Thomas Wilson",
    authorImage:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    readTime: "7 min read",
    category: "Seasonal Travel",
  },
]

// Destination categories
const destinationCategories = [
  {
    id: 1,
    name: "Beaches",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    count: 45,
    icon: "🏖️",
  },
  {
    id: 2,
    name: "Mountains",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    count: 32,
    icon: "🏔️",
  },
  {
    id: 3,
    name: "Cities",
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    count: 28,
    icon: "🏙️",
  },
  {
    id: 4,
    name: "Historical",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAFK-xuYnW3GQjGKd_Ikr4iNyzUU9yCYJCyQ&s",
    count: 19,
    icon: "🏛️",
  },
  {
    id: 5,
    name: "Islands",
    image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    count: 23,
    icon: "🏝️",
  },
  {
    id: 6,
    name: "Adventure",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    count: 36,
    icon: "🧗",
  },
]

// Traveler experiences
const travelerExperiences = [
  {
    id: 1,
    name: "Emily Johnson",
    location: "Bali, Indonesia",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 5,
    comment:
      "My trip to Bali was absolutely magical! The beaches were pristine, the local culture was fascinating, and the food was incredible. I can't wait to go back!",
    date: "2 weeks ago",
    tripType: "Beach Vacation",
  },
  {
    id: 2,
    name: "James Wilson",
    location: "Kyoto, Japan",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.5,
    comment:
      "Exploring the temples and gardens of Kyoto was a life-changing experience. The attention to detail in Japanese culture is truly remarkable.",
    date: "1 month ago",
    tripType: "Cultural Tour",
  },
  {
    id: 3,
    name: "Sophia Martinez",
    location: "Santorini, Greece",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 5,
    comment:
      "The white buildings against the blue sea in Santorini created the most breathtaking views I've ever seen. Every sunset was like a painting!",
    date: "3 weeks ago",
    tripType: "Island Getaway",
  },
  {
    id: 4,
    name: "David Chen",
    location: "Machu Picchu, Peru",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    rating: 4.8,
    comment:
      "Hiking to Machu Picchu was challenging but absolutely worth it. Standing among those ancient ruins with the mountains all around was unforgettable.",
    date: "2 months ago",
    tripType: "Adventure Trek",
  },
]

// Custom arrow components for sliders
const NextArrow = (props) => {
  const { className, style, onClick } = props
  return (
    <div
      className={`${className} z-10 bg-white rounded-full shadow-lg p-2 flex items-center justify-center absolute right-4 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 transition-all duration-300 hover:scale-110`}
      style={{ ...style, display: "block", width: "40px", height: "40px" }}
      onClick={onClick}
    >
      <ChevronRightIcon className="h-6 w-6 text-[#FF7757]" />
    </div>
  )
}

const PrevArrow = (props) => {
  const { className, style, onClick } = props
  return (
    <div
      className={`${className} z-10 bg-white rounded-full shadow-lg p-2 flex items-center justify-center absolute left-4 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 transition-all duration-300 hover:scale-110`}
      style={{ ...style, display: "block", width: "40px", height: "40px" }}
      onClick={onClick}
    >
      <ChevronLeftIcon className="h-6 w-6 text-[#FF7757]" />
    </div>
  )
}

const Home = () => {
  const navigate = useNavigate()
  const [promos, setPromos] = useState([])
  const [activities, setActivities] = useState([])
  const [filteredActivities, setFilteredActivities] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")
  const [provinces, setProvinces] = useState([])
  const [activeTab, setActiveTab] = useState("popular")
  const [favorites, setFavorites] = useState([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const activitiesSectionRef = useRef(null)
  const promosSectionRef = useRef(null)
  const categoriesSectionRef = useRef(null)
  const blogSectionRef = useRef(null)
  const experiencesSectionRef = useRef(null)

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch promos
        const promosResponse = await getPromos()
        setPromos(promosResponse.data.data)

        // Fetch activities
        const activitiesResponse = await getActivities()
        const activitiesData = activitiesResponse.data.data
        setActivities(activitiesData)
        setFilteredActivities(activitiesData)

        // Extract unique provinces
        const uniqueProvinces = [...new Set(activitiesData.map((activity) => activity.province))]
        setProvinces(uniqueProvinces)

        // Fetch categories
        const categoriesResponse = await getCategories()
        setCategories(categoriesResponse.data.data)

        // Initialize favorites from localStorage
        const savedFavorites = localStorage.getItem("favoriteActivities")
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Filter activities based on search term, selected province, and active tab
    let filtered = activities.filter((activity) => {
      const matchesSearch =
        activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.province?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesProvince = selectedProvince ? activity.province === selectedProvince : true

      return matchesSearch && matchesProvince
    })

    // Apply additional filtering based on active tab
    if (activeTab === "trending") {
      // Simulate trending by sorting by price (just an example)
      filtered = [...filtered].sort((a, b) => b.price - a.price)
    } else if (activeTab === "new") {
      // Simulate new by using the most recent IDs (just an example)
      filtered = [...filtered].sort((a, b) => b.id - a.id)
    } else if (activeTab === "favorites") {
      filtered = filtered.filter((activity) => favorites.includes(activity.id))
    }

    setFilteredActivities(filtered)
  }, [searchTerm, selectedProvince, activities, activeTab, favorites])

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem("favoriteActivities", JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = (activityId) => {
    setFavorites((prev) => {
      if (prev.includes(activityId)) {
        return prev.filter((id) => id !== activityId)
      } else {
        return [...prev, activityId]
      }
    })
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: "smooth" })
  }

  // Settings for blog slider
  const blogSliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: windowWidth < 640 ? 1 : windowWidth < 1024 ? 2 : 3,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  }

  // Settings for destination categories slider
  const categorySliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: windowWidth < 640 ? 1 : windowWidth < 768 ? 2 : windowWidth < 1024 ? 3 : 4,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  }

  // Settings for traveler experiences slider
  const experienceSliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToScroll: 1,
    slidesToShow: windowWidth < 768 ? 1 : 2,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    autoplaySpeed: 6000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  }

  return (
    <div className="pt-16 overflow-x-hidden">
      {" "}
      {/* Add padding-top to account for fixed navbar */}
      {/* Quick Navigation */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="bg-[#FF7757] text-white p-3 rounded-full shadow-lg hover:bg-[#ff6242] transition-all duration-300 hover:scale-110"
            aria-label="Scroll to top"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>
      {/* Banner Section with Parallax Effect */}
      <div className="relative overflow-hidden">
        <Banner />

        {/* Quick Navigation Dots */}
        <div className="hidden lg:flex fixed left-6 top-1/2 transform -translate-y-1/2 flex-col gap-4 z-40">
          <button
            onClick={() => scrollToTop()}
            className="w-3 h-3 rounded-full bg-white border border-[#FF7757] hover:bg-[#FF7757] transition-all duration-300"
            aria-label="Scroll to top"
          ></button>
          <button
            onClick={() => scrollToSection(categoriesSectionRef)}
            className="w-3 h-3 rounded-full bg-white border border-[#FF7757] hover:bg-[#FF7757] transition-all duration-300"
            aria-label="Scroll to categories"
          ></button>
          <button
            onClick={() => scrollToSection(promosSectionRef)}
            className="w-3 h-3 rounded-full bg-white border border-[#FF7757] hover:bg-[#FF7757] transition-all duration-300"
            aria-label="Scroll to promos"
          ></button>
          <button
            onClick={() => scrollToSection(activitiesSectionRef)}
            className="w-3 h-3 rounded-full bg-white border border-[#FF7757] hover:bg-[#FF7757] transition-all duration-300"
            aria-label="Scroll to activities"
          ></button>
          <button
            onClick={() => scrollToSection(blogSectionRef)}
            className="w-3 h-3 rounded-full bg-white border border-[#FF7757] hover:bg-[#FF7757] transition-all duration-300"
            aria-label="Scroll to blog"
          ></button>
          <button
            onClick={() => scrollToSection(experiencesSectionRef)}
            className="w-3 h-3 rounded-full bg-white border border-[#FF7757] hover:bg-[#FF7757] transition-all duration-300"
            aria-label="Scroll to experiences"
          ></button>
        </div>
      </div>
      {/* Destination Categories Section with 3D Hover Effect */}
      <section ref={categoriesSectionRef} className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="max-w-2xl">
              <div className="inline-block px-3 py-1 bg-orange-100 text-[#FF7757] rounded-full text-sm font-medium mb-3">
                Explore Categories
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#ff7757] mb-2">Destination Categories</h2>
              <p className="text-gray-600 max-w-2xl">
                Explore destinations by category and find your perfect travel experience.
              </p>
            </div>
            <Link
              to="/category"
              className="mt-4 md:mt-0 group flex items-center text-[#FF7757] font-medium hover:text-[#ff6242] transition-colors"
            >
              View All Categories
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="category-slider px-4">
            <Slider {...categorySliderSettings}>
              {destinationCategories.map((category) => (
                <div key={category.id} className="px-2">
                  <div className="relative rounded-xl overflow-hidden h-72 group perspective">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg transform -translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      <span role="img" aria-label={category.name}>
                        {category.icon}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                      <div className="flex items-center mb-3">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <p className="text-sm">{category.count} Destinations</p>
                      </div>
                      <Link
                        to={`/category/${category.id}`}
                        className="inline-flex items-center px-4 py-2 bg-[#FF7757] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 hover:bg-[#ff6242]"
                      >
                        Explore <ArrowRightIcon className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>
      {/* Popular Destinations Section */}
      <PopularDestination />
      {/* Promos Section with Animated Cards */}
      <section ref={promosSectionRef} className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="max-w-2xl">
              <div className="inline-block px-3 py-1 bg-orange-100 text-[#FF7757] rounded-full text-sm font-medium mb-3">
                Limited Time Offers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#FF7757] mb-2">Special Promos</h2>
              <p className="text-gray-600 max-w-2xl">
                Discover our special promos and get the best deals for your next adventure.
              </p>
            </div>
            <Link
              to="/promos"
              className="mt-4 md:mt-0 group flex items-center text-[#FF7757] font-medium hover:text-[#ff6242] transition-colors"
            >
              View All Promos
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promos.slice(0, 6).map((promo, index) => (
                <div
                  key={promo.id}
                  className="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <PromoCard promo={promo} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* Activities Section with Tabs and Improved Search */}
      <section ref={activitiesSectionRef} className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="max-w-2xl ml-auto text-right">
              <div className="inline-block px-3 py-1 bg-orange-100 text-[#FF7757] rounded-full text-sm font-medium mb-3">
                Explore Activities
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#FF7757] mb-2">Popular Activities</h2>
              <p className="text-gray-600 max-w-2xl ml-auto">
                Explore the most popular activities from around the world.
              </p>
            </div>
            <Link
              to="/destination"
              className="mt-4 md:mt-0 group flex items-center text-[#FF7757] font-medium hover:text-[#ff6242] transition-colors"
            >
              View All Activities
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Activity Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("popular")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === "popular" ? "bg-[#FF7757] text-white" : "text-gray-600 hover:text-[#FF7757]"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setActiveTab("trending")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === "trending" ? "bg-[#FF7757] text-white" : "text-gray-600 hover:text-[#FF7757]"
                }`}
              >
                Trending
              </button>
              <button
                onClick={() => setActiveTab("new")}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                  activeTab === "new" ? "bg-[#FF7757] text-white" : "text-gray-600 hover:text-[#FF7757]"
                }`}
              >
                New Arrivals
              </button>

            </div>
          </div>

          {/* Enhanced Search and Filter */}
          <div className="mb-8">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search activities, destinations, or experiences..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className={`w-full pl-10 pr-4 py-3 border ${
                      isSearchFocused ? "border-[#FF7757]" : "border-gray-300"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7757] transition-all`}
                  />
                </div>

                <div className="w-full md:w-64 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7757] appearance-none bg-white"
                  >
                    <option value="">All Provinces</option>
                    {provinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activities Grid with Animation */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <>
              {filteredActivities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredActivities.slice(0, 8).map((activity, index) => (
                    <div
                      key={activity.id}
                      className="transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                    >
                      <div className="relative group">
                        <ActivityCard activity={activity} onLoginRedirect={() => navigate("/login")} />
                        {/* <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(activity.id)
                          }}
                          className="absolute top-3 right-3 z-10 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors"
                          aria-label={favorites.includes(activity.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          {favorites.includes(activity.id) ? (
                            <HeartIconSolid className="h-5 w-5 text-red-500" />
                          ) : (
                            <HeartIcon className="h-5 w-5 text-gray-600" />
                          )}
                        </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
                    <svg className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg mb-2">No activities found matching your criteria.</p>
                  <p className="text-gray-500">Try adjusting your search or filters.</p>
                </div>
              )}
            </>
          )}

          <div className="text-center mt-10">
            <Link
              to="/destination"
              className="inline-flex items-center px-6 py-3 bg-[#FF7757] text-white rounded-lg hover:bg-[#ff6242] transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-transform"
            >
              View All Activities
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
      {/* Travel Tips & Articles Section with Enhanced Cards */}
      <section ref={blogSectionRef} className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="max-w-2xl">
              <div className="inline-block px-3 py-1 bg-orange-100 text-[#FF7757] rounded-full text-sm font-medium mb-3">
                Travel Inspiration
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#FF7757] mb-2">Travel Tips & Articles</h2>
              <p className="text-gray-600 max-w-2xl">
                Discover travel tips, inspiration, and guides to help you plan your next adventure.
              </p>
            </div>
            <Link
              to="/blog"
              className="mt-4 md:mt-0 group flex items-center text-[#FF7757] font-medium hover:text-[#ff6242] transition-colors"
            >
              View All Articles
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="blog-slider px-4">
            <Slider {...blogSliderSettings}>
              {blogPosts.map((post) => (
                <div key={post.id} className="px-3 py-2">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl h-full">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                      />
                      <div className="absolute top-3 left-3 bg-[#FF7757]/90 text-white text-xs font-medium px-2 py-1 rounded">
                        {post.category}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <img
                            src={post.authorImage || "/placeholder.svg"}
                            alt={post.author}
                            className="w-8 h-8 rounded-full mr-2 object-cover border-2 border-white shadow-sm"
                          />
                          <div>
                            <p className="text-sm font-medium">{post.author}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {post.date}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-[#FF7757] transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{post.readTime}</span>
                        <Link
                          to={`/blog/${post.id}`}
                          className="text-[#FF7757] font-medium text-sm hover:underline flex items-center"
                        >
                          Read More
                          <ArrowRightIcon className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>
      {/* Traveler's Experience Section with Enhanced Testimonials */}
      <section ref={experiencesSectionRef} className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="max-w-2xl ml-auto text-right">
              <div className="inline-block px-3 py-1 bg-orange-100 text-[#FF7757] rounded-full text-sm font-medium mb-3">
                Real Stories
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#FF7757] mb-2">Traveler's Experiences</h2>
              <p className="text-gray-600 max-w-2xl ml-auto">
                Read about the amazing experiences of travelers from around the world.
              </p>
            </div>
            <Link
              to="/testimonials"
              className="mt-4 md:mt-0 group flex items-center text-[#FF7757] font-medium hover:text-[#ff6242] transition-colors"
            >
              View All Stories
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="experience-slider px-4">
            <Slider {...experienceSliderSettings}>
              {travelerExperiences.map((experience) => (
                <div key={experience.id} className="px-3 py-2">
                  <div className="bg-white rounded-xl shadow-md p-6 h-full transition-all duration-300 hover:shadow-xl">
                    <div className="flex items-center mb-4">
                      <img
                        src={experience.image || "/placeholder.svg"}
                        alt={experience.name}
                        className="w-14 h-14 rounded-full mr-4 object-cover border-2 border-[#FF7757]"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{experience.name}</h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-1 text-[#FF7757]" />
                          {experience.location}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(experience.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-700">{experience.rating}</span>
                      </div>
                      <span className="text-xs text-gray-500">{experience.date}</span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-4 italic text-gray-700 relative">
                      <svg
                        className="absolute top-0 left-0 transform -translate-x-2 -translate-y-2 h-8 w-8 text-gray-200"
                        fill="currentColor"
                        viewBox="0 0 32 32"
                      >
                        <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                      </svg>
                      <p className="relative z-10">{experience.comment}</p>
                    </div>

                    <div className="flex items-center text-xs text-gray-600">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      <span>Trip Type: {experience.tripType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>
      {/* Newsletter Section - New Addition */}
      <section className="py-16 bg-[#172432] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <GlobeAltIcon className="h-12 w-12 mx-auto mb-4 text-[#FF7757]" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Travel Inspiration & Special Offers</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join our newsletter and be the first to know about new destinations, exclusive promotions, and travel
              tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none text-gray-900"
                required
              />
              <button
                type="submit"
                className="bg-[#FF7757] text-white px-6 py-3 rounded-lg hover:bg-[#ff6242] transition-colors font-medium"
              >
                Subscribe
              </button>
            </form>
            <p className="text-gray-400 text-sm mt-4">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-[#172432] text-white pt-16 pb-8 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold text-[#FF7757] mb-6">Traveloke</h3>
              <img
                src="https://i.ibb.co.com/ZpJKSvDB/traveloke-removebg-preview.png"
                alt="Traveloke Logo"
                className="w-25 h-20 mr-4"
              />
              <p className="text-gray-300 mb-6">Book your trip in minutes, get full control for much longer.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-white hover:text-[#FF7757] transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-[#FF7757] transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-[#FF7757] transition-colors">
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
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    Gift Cards
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    Legal Notice
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                    <ArrowRightIcon className="h-3 w-3 mr-2 text-[#FF7757]" />
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
                <button
                  type="submit"
                  className="bg-[#FF7757] text-white px-4 py-2 rounded-r-md hover:bg-[#ff6242] transition-colors"
                >
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
      {/* Add CSS for animations */}
      <style jsx="true">{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .perspective {
          perspective: 1000px;
        }
      `}</style>
    </div>
  )
}

export default Home
