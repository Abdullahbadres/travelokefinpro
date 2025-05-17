// "use client"

// import { useState, useEffect } from "react"
// import { Link, useLocation } from "react-router-dom"
// import { FaHome, FaUsers, FaTag, FaGlobe, FaFolder, FaImage, FaBars, FaTimes, FaExchangeAlt } from "react-icons/fa"

// const Sidebar = () => {
//   const [isOpen, setIsOpen] = useState(false)
//   const location = useLocation()

//   // Check screen size and set sidebar state accordingly
//   useEffect(() => {
//     const checkScreenSize = () => {
//       // Always start with minimized sidebar regardless of screen size
//       setIsOpen(false)
//     }

//     // Initial check
//     checkScreenSize()

//     // Add event listener for window resize
//     window.addEventListener("resize", checkScreenSize)

//     // Cleanup
//     return () => window.removeEventListener("resize", checkScreenSize)
//   }, [])

//   // Close sidebar when route changes on mobile
//   useEffect(() => {
//     if (window.innerWidth < 1024) {
//       setIsOpen(false)
//     }
//   }, [location])

//   const menuItems = [
//     { name: "Dashboard", path: "/admin", icon: FaHome },
//     { name: "Users", path: "/admin/users", icon: FaUsers },
//     { name: "Promos", path: "/admin/promos", icon: FaTag },
//     { name: "Destinations", path: "/admin/destinations", icon: FaGlobe },
//     { name: "Categories", path: "/admin/categories", icon: FaFolder },
//     { name: "Banners", path: "/admin/banners", icon: FaImage },
//     { name: "Transactions", path: "/admin/transactions", icon: FaExchangeAlt },
//   ]

//   const isActive = (path) => {
//     return location.pathname === path
//   }

//   return (
//     <>
//       {/* Mobile menu button - always visible */}
//       <div className="fixed top-20 left-4 z-30">
//         <button
//           onClick={() => setIsOpen(!isOpen)}
//           className="p-2 rounded-md bg-white shadow-md"
//           aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
//         >
//           {isOpen ? <FaTimes className="h-3 w-3 text-gray-700" /> : <FaBars className="h-3 w-3 text-gray-700" />}
//         </button>
//       </div>

//       {/* Overlay for mobile */}
//       {isOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsOpen(false)}></div>
//       )}

//       {/* Sidebar */}
//       <aside
//         className={`fixed top-0 left-0 h-full bg-[#172432] text-white z-20 transition-all duration-300 ease-in-out ${
//           isOpen ? "translate-x-0 w-64" : "w-16 translate-x-0"
//         }`}
//         style={{ paddingTop: "5rem" }}
//       >
//         <div className={`p-5 border-b border-gray-700 ${!isOpen ? "lg:p-3" : ""}`}>
//         <br />
//           {isOpen ? (
//             <h2 className="text-xl font-bold">Admin Dashboard</h2>
//           ) : (
//             <h2 className="hidden lg:block text-center text-xl font-bold">AD</h2>
//           )}
//         </div>

//         <nav className="mt-5">
//           <ul>
//             {menuItems.map((item) => (
//               <li key={item.name}>
//                 <Link
//                   to={item.path}
//                   className={`flex items-center px-5 py-3 transition-colors ${
//                     !isOpen ? "justify-center px-2" : ""
//                   } ${isActive(item.path) ? "bg-[#FF7757] text-white" : "text-gray-300 hover:bg-gray-700"}`}
//                   title={!isOpen ? item.name : ""}
//                 >
//                   <item.icon className={`h-5 w-5 ${isOpen ? "mr-3" : "mr-0"}`} />
//                   {isOpen && <span>{item.name}</span>}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </nav>

//         {/* Remove this desktop toggle button section */}
//       </aside>
//     </>
//   )
// }

// export default Sidebar

// gajadi, pake button navbar aja