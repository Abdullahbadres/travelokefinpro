"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useCart } from "../contexts/CartContext"
import { useWishlist } from "../contexts/WishlistContext"
import { Bars3Icon, XMarkIcon, ShoppingCartIcon, HeartIcon } from "@heroicons/react/24/outline"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { user, logout, getUserInitials, isAdmin } = useAuth()
  const { getCartCount } = useCart()
  const { wishlist } = useWishlist()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setIsProfileOpen(false)
  }, [location])

  // Track scroll position to add shadow to navbar when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest(".profile-dropdown")) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isProfileOpen])

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x)

    if (pathnames.length === 0) {
      return [{ name: "Home", path: "/" }]
    }

    const breadcrumbs = [{ name: "Home", path: "/" }]

    let path = ""
    pathnames.forEach((name, index) => {
      path = `${path}/${name}`
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
      breadcrumbs.push({ name: formattedName, path })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  // Check if current page is admin page
  const isAdminPage = location.pathname.startsWith("/admin")

  // Check if user is admin
  const userIsAdmin = user && isAdmin && isAdmin()

  // Determine which transactions page to show based on user role
  const getTransactionsLink = () => {
    if (userIsAdmin) {
      return "/admin/transactions"
    } else {
      return "/user/transactions"
    }
  }

  return (
    <>
      <nav
        className={`bg-white fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "shadow-md py-2" : "py-3"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="https://i.ibb.co.com/ZpJKSvDB/traveloke-removebg-preview.png"
                alt="Traveloke Logo"
                className="h-9 sm:h-10 mr-2"
              />
              <span className="text-xl sm:text-2xl font-bold text-[#FF7757]">Traveloke</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {userIsAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                      location.pathname === "/admin" ? "text-[#FF7757]" : ""
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/category"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                      location.pathname === "/category" ? "text-[#FF7757]" : ""
                    }`}
                  >
                    Category
                  </Link>
                  <Link
                    to="/destination"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                      location.pathname === "/destination" ? "text-[#FF7757]" : ""
                    }`}
                  >
                    Destination
                  </Link>
                  <Link
                    to="/admin/transactions"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                      location.pathname === "/admin/transactions" ? "text-[#FF7757]" : ""
                    }`}
                  >
                    Transactions
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                      location.pathname === "/" ? "text-[#FF7757]" : ""
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/category"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                      location.pathname === "/category" ? "text-[#FF7757]" : ""
                    }`}
                  >
                    Category
                  </Link>
                  <Link
                    to="/destination"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                      location.pathname === "/destination" ? "text-[#FF7757]" : ""
                    }`}
                  >
                    Destination
                  </Link>
                  <Link
                    to="/promos"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                      location.pathname === "/promos" ? "text-[#FF7757]" : ""
                    }`}
                  >
                    Promos
                  </Link>
                  {user && (
                    <Link
                      to={getTransactionsLink()}
                      className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 font-medium ${
                        location.pathname === getTransactionsLink() ? "text-[#FF7757]" : ""
                      }`}
                    >
                      Transactions
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {user && !userIsAdmin && (
                <>
                  <Link to="/wishlist" className="relative group">
                    <HeartIcon className="h-6 w-6 text-gray-700 group-hover:text-[#FF7757] transition-colors duration-200" />
                    {wishlist.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#FF7757] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                  <Link to="/cart" className="relative group">
                    <ShoppingCartIcon className="h-6 w-6 text-gray-700 group-hover:text-[#FF7757] transition-colors duration-200" />
                    {getCartCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#FF7757] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                        {getCartCount()}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {user ? (
                <>
                  {/* User Profile */}
                  <div className="relative profile-dropdown">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="h-8 w-8 rounded-full bg-[#FF7757] text-white flex items-center justify-center font-medium hover:bg-[#ff6242] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7757]"
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                    >
                      {getUserInitials()}
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100 animate-fadeIn">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <p className="text-xs text-gray-500 capitalize">Role: {user.role}</p>
                        </div>

                        {userIsAdmin && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF7757] transition-colors duration-150"
                          >
                            Admin Dashboard
                          </Link>
                        )}

                        {!userIsAdmin && (
                          <Link
                            to="/wishlist"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF7757] transition-colors duration-150"
                          >
                            My Favorites
                          </Link>
                        )}

                        <Link
                          to={getTransactionsLink()}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF7757] transition-colors duration-150"
                        >
                          My Transactions
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF7757] transition-colors duration-150"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden md:flex space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md text-gray-700 hover:text-[#FF7757] border border-gray-300 hover:border-[#FF7757] transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-md bg-[#FF7757] text-white hover:bg-[#ff6242] transition-colors duration-200"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-1 rounded-md hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                aria-expanded={isOpen}
                aria-label="Toggle menu"
              >
                {isOpen ? (
                  <XMarkIcon className="h-6 w-6 text-gray-700" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu - with animation */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isOpen ? "max-h-96 opacity-100 mt-4 pb-4" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex flex-col space-y-3 pt-2">
              {userIsAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                      location.pathname === "/admin" ? "text-[#FF7757] font-medium" : ""
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/category"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                      location.pathname === "/category" ? "text-[#FF7757] font-medium" : ""
                    }`}
                  >
                    Category
                  </Link>
                  <Link
                    to="/destination"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                      location.pathname === "/destination" ? "text-[#FF7757] font-medium" : ""
                    }`}
                  >
                    Destination
                  </Link>
                  <Link
                    to="/admin/transactions"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                      location.pathname === "/admin/transactions" ? "text-[#FF7757] font-medium" : ""
                    }`}
                  >
                    Transactions
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                      location.pathname === "/" ? "text-[#FF7757] font-medium" : ""
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/category"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                      location.pathname === "/category" ? "text-[#FF7757] font-medium" : ""
                    }`}
                  >
                    Category
                  </Link>
                  <Link
                    to="/destination"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                      location.pathname === "/destination" ? "text-[#FF7757] font-medium" : ""
                    }`}
                  >
                    Destination
                  </Link>
                  <Link
                    to="/promos"
                    className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                      location.pathname === "/promos" ? "text-[#FF7757] font-medium" : ""
                    }`}
                  >
                    Promos
                  </Link>
                  {user && (
                    <>
                      <Link
                        to="/wishlist"
                        className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                          location.pathname === "/wishlist" ? "text-[#FF7757] font-medium" : ""
                        }`}
                      >
                        My Favorites
                      </Link>
                      <Link
                        to={getTransactionsLink()}
                        className={`text-gray-700 hover:text-[#FF7757] transition-colors duration-200 py-2 px-1 ${
                          location.pathname === getTransactionsLink() ? "text-[#FF7757] font-medium" : ""
                        }`}
                      >
                        Transactions
                      </Link>
                    </>
                  )}
                </>
              )}

              {!user && (
                <div className="flex flex-col space-y-2 pt-3 border-t mt-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md text-center text-gray-700 border border-gray-300 hover:text-[#FF7757] hover:border-[#FF7757] transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-md text-center bg-[#FF7757] text-white hover:bg-[#ff6242] transition-colors duration-200"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumbs - Improved for all screen sizes */}
      <div className="container mx-auto px-4 pt-20 pb-2 md:pt-24">
        <div className="text-xs sm:text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-1 flex items-center">
          {breadcrumbs.map((breadcrumb, index) => (
            <span key={index} className="flex-shrink-0 flex items-center">
              {index > 0 && <span className="mx-1 text-gray-400"> / </span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-[#FF7757] font-medium">{breadcrumb.name}</span>
              ) : (
                <Link to={breadcrumb.path} className="hover:text-[#FF7757] transition-colors duration-200">
                  {breadcrumb.name}
                </Link>
              )}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

export default Navbar

