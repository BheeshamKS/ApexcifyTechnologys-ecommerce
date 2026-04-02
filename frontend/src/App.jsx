import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { OrderList, OrderDetail } from './pages/account/Orders';
import VendorDashboard from './pages/vendor/Dashboard';
import { VendorProductList, VendorProductForm } from './pages/vendor/Products';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ShopHub · Multi-Vendor eCommerce Platform
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-right" toastOptions={{ className: 'text-sm' }} />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/products" element={<Layout><Products /></Layout>} />
            <Route path="/products/:slug" element={<Layout><ProductDetail /></Layout>} />
            <Route path="/cart" element={<Layout><Cart /></Layout>} />

            {/* Auth */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />

            {/* Customer */}
            <Route path="/checkout" element={
              <ProtectedRoute roles={['customer', 'admin']}>
                <Layout><Checkout /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/account/orders" element={
              <ProtectedRoute>
                <Layout><OrderList /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/account/orders/:id" element={
              <ProtectedRoute>
                <Layout><OrderDetail /></Layout>
              </ProtectedRoute>
            } />

            {/* Vendor */}
            <Route path="/vendor" element={
              <ProtectedRoute roles={['vendor']}>
                <Layout><VendorDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/vendor/products" element={
              <ProtectedRoute roles={['vendor']}>
                <Layout><VendorProductList /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/vendor/products/new" element={
              <ProtectedRoute roles={['vendor']}>
                <Layout><VendorProductForm /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/vendor/products/:id/edit" element={
              <ProtectedRoute roles={['vendor']}>
                <Layout><VendorProductForm /></Layout>
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}>
                <Layout><AdminUsers /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <ProtectedRoute roles={['admin']}>
                <Layout><AdminOrders /></Layout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
