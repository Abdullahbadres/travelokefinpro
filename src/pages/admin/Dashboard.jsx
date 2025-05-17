"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  UsersIcon, 
  TagIcon, 
  GlobeAltIcon, 
  FolderIcon, 
  PhotoIcon,
  CreditCardIcon, // Added for transactions
  ShoppingCartIcon // Alternative icon for transactions
} from "@heroicons/react/24/outline"
import { getAllUsers, getPromos, getActivities, getCategories, getBanners, getAllTransactions } from "../../api"
import BottomNav from "../../components/admin/BottomNav"

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    promos: 0,
    destinations: 0,
    categories: 0,
    banners: 0,
    transactions: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        const [usersRes, promosRes, activitiesRes, categoriesRes, bannersRes, transactionsRes] = await Promise.all([
          getAllUsers(),
          getPromos(),
          getActivities(),
          getCategories(),
          getBanners(),
          getAllTransactions(), // Using getAllTransactions instead of getTransactions
        ])

        setStats({
          users: usersRes.data.data.length,
          promos: promosRes.data.data.length,
          destinations: activitiesRes.data.data.length,
          categories: categoriesRes.data.data.length,
          banners: bannersRes.data.data.length,
          transactions: transactionsRes.data.data.length, // Properly setting transactions count
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Users",
      count: stats.users,
      icon: UsersIcon,
      color: "bg-blue-500",
      link: "/admin/users",
    },
    {
      title: "Promos",
      count: stats.promos,
      icon: TagIcon,
      color: "bg-green-500",
      link: "/admin/promos",
    },
    {
      title: "Destinations",
      count: stats.destinations,
      icon: GlobeAltIcon,
      color: "bg-purple-500",
      link: "/admin/destinations",
    },
    {
      title: "Categories",
      count: stats.categories,
      icon: FolderIcon,
      color: "bg-yellow-500",
      link: "/admin/categories",
    },
    {
      title: "Banners",
      count: stats.banners,
      icon: PhotoIcon,
      color: "bg-red-500",
      link: "/admin/banners",
    },
    {
      title: "Transactions",
      count: stats.transactions,
      icon: CreditCardIcon, // Using CreditCardIcon for transactions
      color: "bg-teal-500", // Different color for transactions
      link: "/admin/transactions",
    },
  ]

  return (
    // ADDED: Attractive gradient background
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-16">
      {/* MODIFIED: Added left padding to account for collapsed sidebar */}
      <div className="flex-1 lg:ml-16 p-8 transition-all duration-300">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => ( // Updated to 6 for the additional card
              <div key={index} className="bg-white rounded-lg shadow-md h-32 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow transform hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-center">
                  <div className={`${card.color} p-3 rounded-full`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-700">{card.title}</h2>
                    <p className="text-3xl font-bold text-gray-900">{card.count}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Admin Dashboard</h2>
          <p className="text-gray-600">
            This is your admin dashboard where you can manage all aspects of your travel website. Use the sidebar to
            navigate to different sections and manage users, promos, destinations, categories, banners, and transactions.
          </p>
        </div>
      </div>
      <br />
      <BottomNav />
    </div>
  )
}

export default Dashboard
