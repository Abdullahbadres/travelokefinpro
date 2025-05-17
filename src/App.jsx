import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import { WishlistProvider } from "./contexts/WishlistContext"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Category from "./pages/Category"
import Destination from "./pages/Destination"
import PromoDetail from "./pages/PromoDetail"
import ActivityDetail from "./pages/ActivityDetail"
import Cart from "./pages/Cart"
import TransactionHistory from "./pages/TransactionHistory"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminUsers from "./pages/admin/Users"
import AdminPromos from "./pages/admin/Promos"
import AdminDestinations from "./pages/admin/Destinations"
import AdminCategories from "./pages/admin/Categories"
import AdminBanners from "./pages/admin/Banners"
import AdminTransactions from "./pages/admin/Transactions"
import ProtectedRoute from "./components/ProtectedRoute"
import AdminRoute from "./components/AdminRoute"
import AdminLayout from "./components/admin/AdminLayout"
import NotFound from "./pages/NotFound"
import Promos from "./pages/Promos"
import Wishlist from "./pages/Wishlist"

function App() {
  return (
    <Router>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Toaster position="top-center" />
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/category" element={<Category />} />
              <Route path="/destination" element={<Destination />} />
              <Route path="/promo/:id" element={<PromoDetail />} />
              <Route path="/activity/:id" element={<ActivityDetail />} />
              <Route path="/promos" element={<Promos />} />

              {/* Protected routes for logged-in users */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/transactions"
                element={
                  <ProtectedRoute>
                    <TransactionHistory />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/promos"
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <AdminPromos />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/destinations"
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <AdminDestinations />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <AdminCategories />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/banners"
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <AdminBanners />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/transactions"
                element={
                  <AdminRoute>
                    <AdminLayout>
                      <AdminTransactions />
                    </AdminLayout>
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
