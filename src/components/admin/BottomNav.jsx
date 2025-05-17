"use client"

import { useLocation } from "react-router-dom"
import { Link } from "react-router-dom"
import { FaHome, FaUsers, FaTag, FaGlobe, FaFolder, FaImage, FaExchangeAlt } from "react-icons/fa"

const BottomNav = () => {
  const location = useLocation()

  // All menu items in a single array
  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: FaHome },
    { name: "Users", path: "/admin/users", icon: FaUsers },
    { name: "Promos", path: "/admin/promos", icon: FaTag },
    { name: "Destinations", path: "/admin/destinations", icon: FaGlobe },
    { name: "Categories", path: "/admin/categories", icon: FaFolder },
    { name: "Banners", path: "/admin/banners", icon: FaImage },
    { name: "Transactions", path: "/admin/transactions", icon: FaExchangeAlt },
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#172432] text-white z-40 shadow-lg">
        <div className="max-w-screen-xl mx-auto">
          <ul className="flex justify-between items-center">
            {menuItems.map((item) => (
              <li key={item.name} className="flex-1">
                <Link
                  to={item.path}
                  className={`w-full flex flex-col items-center justify-center py-2 px-1 transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-[#FF7757] bg-[#172432]/80"
                      : "text-gray-300 hover:text-white hover:bg-[#172432]/50"
                  }`}
                  title={item.name}
                >
                  <item.icon className={`h-5 w-5 ${isActive(item.path) ? "animate-pulse" : ""}`} />
                  <span className="text-[10px] truncate hidden sm:block mt-1">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>


      <div className="h-20 md:h-24"></div>
    </>
  )
}

export default BottomNav
