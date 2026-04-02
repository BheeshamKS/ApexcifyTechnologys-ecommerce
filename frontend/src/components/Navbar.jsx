import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Search, Menu, X, User, LogOut,
  LayoutDashboard, ShoppingCart, Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardLink =
    user?.role === 'admin' ? '/admin' :
    user?.role === 'vendor' ? '/vendor' : '/account/orders';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 shrink-0">
            <ShoppingBag className="w-6 h-6" />
            <span className="hidden sm:inline">ShopHub</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input pl-9 pr-4"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth / User */}
            {user ? (
              <div className="relative group hidden md:block">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="max-w-24 truncate">{user.full_name || user.email}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-52 card py-1 hidden group-hover:block shadow-lg">
                  <Link
                    to={dashboardLink}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    to="/account/orders"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/auth/login" className="btn-secondary text-sm py-1.5 px-3">Sign in</Link>
                <Link to="/auth/register" className="btn-primary text-sm py-1.5 px-3">Register</Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="input"
              />
              <button type="submit" className="btn-primary px-3">
                <Search className="w-4 h-4" />
              </button>
            </form>
            {user ? (
              <>
                <Link to={dashboardLink} className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>Dashboard</Link>
                <Link to="/account/orders" className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setOpen(false)}>My Orders</Link>
                <button onClick={handleLogout} className="block w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Sign out</button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/auth/login" className="btn-secondary flex-1 text-sm" onClick={() => setOpen(false)}>Sign in</Link>
                <Link to="/auth/register" className="btn-primary flex-1 text-sm" onClick={() => setOpen(false)}>Register</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
