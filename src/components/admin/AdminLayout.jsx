"use client"
import BottomNav from "./BottomNav"

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-16 pb-16">
      <div className="p-4 md:p-8">{children}</div>
      <BottomNav />
    </div>
  )
}

export default AdminLayout
