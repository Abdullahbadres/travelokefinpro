"use client"

import { useState, useEffect } from "react"
import BottomNav from "../../components/admin/BottomNav"
import { getAllUsers, updateProfile } from "../../api"
import PlaceholderImage from "../../components/PlaceholderImage"
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline"
import toast from "react-hot-toast"

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingUserId, setEditingUserId] = useState(null)
  const [editingRole, setEditingRole] = useState("")
  const [updatingRole, setUpdatingRole] = useState(false)
  const itemsPerPage = 7

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await getAllUsers()
        setUsers(response.data.data)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast.error("Failed to fetch users")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Start editing a user's role
  const handleEditRole = (user) => {
    setEditingUserId(user.id)
    setEditingRole(user.role)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditingRole("")
  }

  // Save the updated role
  const handleSaveRole = async (user) => {
    if (editingRole === user.role) {
      // No change, just cancel editing
      handleCancelEdit()
      return
    }

    try {
      setUpdatingRole(true)
      // Prepare the data for the API call
      const userData = {
        id: user.id, // Add the user ID to ensure the correct user is updated
        role: editingRole,
      }

      // Call the API to update the user's role
      await updateProfile(userData)

      // Update the local state
      setUsers(users.map((u) => (u.id === user.id ? { ...u, role: editingRole } : u)))

      toast.success(`User ${user.name}'s role updated to ${editingRole}`)
      handleCancelEdit()
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role")
    } finally {
      setUpdatingRole(false)
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(users.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = users.slice(startIndex, endIndex)

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
      {/* MODIFIED: Added left padding to account for collapsed sidebar */}
      <div className="flex-1 lg:ml-16 xl:ml-64 p-8 transition-all duration-300">
        <h1 className="text-2xl font-bold mb-6">Users</h1>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md h-96 animate-pulse"></div>
        ) : (
          <>
            {/* ADDED: Responsive card view for mobile and tablet */}
            <div className="block lg:hidden">
              {currentUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                      {user.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl || "/placeholder.svg"}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none"
                            e.target.nextSibling.style.display = "flex"
                          }}
                        />
                      ) : null}
                      <PlaceholderImage
                        text={user.name?.charAt(0) || "?"}
                        className="w-full h-full"
                        style={{ display: user.profilePictureUrl ? "none" : "flex" }}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name || "N/A"}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Role: </span>
                      {editingUserId === user.id ? (
                        <div className="flex items-center mt-1">
                          <select
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF7757] focus:ring-[#FF7757] sm:text-sm mr-2"
                            disabled={updatingRole}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleSaveRole(user)}
                            disabled={updatingRole}
                            className="p-1 text-green-600 hover:text-green-800"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updatingRole}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role}
                          </span>
                          <button
                            onClick={() => handleEditRole(user)}
                            className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Phone: </span>
                      <span>{user.phoneNumber || "N/A"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table view for desktop */}
            <div className="hidden lg:block overflow-hidden bg-white shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Profile Picture
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Phone Number
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingUserId === user.id ? (
                          <div className="flex items-center">
                            <select
                              value={editingRole}
                              onChange={(e) => setEditingRole(e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF7757] focus:ring-[#FF7757] sm:text-sm mr-2"
                              disabled={updatingRole}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleSaveRole(user)}
                              disabled={updatingRole}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={updatingRole}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {user.role}
                            </span>
                            <button
                              onClick={() => handleEditRole(user)}
                              className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {user.profilePictureUrl ? (
                            <img
                              src={user.profilePictureUrl || "/placeholder.svg"}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none"
                                e.target.nextSibling.style.display = "flex"
                              }}
                            />
                          ) : null}
                          <PlaceholderImage
                            text={user.name?.charAt(0) || "?"}
                            className="w-full h-full"
                            style={{ display: user.profilePictureUrl ? "none" : "flex" }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phoneNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Updated pagination */}
            {renderPagination()}
          </>
        )}
      </div>
      <br />
      <br />
      <br />
      <BottomNav />
    </div>
  )
}

export default Users
