import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, DollarSign, ShoppingCart, TrendingUp,
  Plus, AlertTriangle, Clock,
} from 'lucide-react';
import { vendorsApi } from '../../lib/api';

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

const VENDOR_STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function VendorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorsApi.dashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-24 text-gray-400">Failed to load dashboard.</div>;

  const { stats, profile, recentOrders, topProducts } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-sm text-gray-500">{profile?.business_name}</p>
        </div>
        <Link to="/vendor/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Approval notice */}
      {profile && !profile.is_approved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Your vendor account is pending approval. You can list products, but they won&apos;t be visible until approved.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Total Products" value={stats.totalProducts} sub={`${stats.activeProducts} active`} color="indigo" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} color="green" />
        <StatCard icon={ShoppingCart} label="Recent Orders" value={stats.totalOrders} color="amber" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStockProducts} sub="≤5 items" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/vendor/orders" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.product_image && (
                    <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {item.orders?.profiles?.full_name} · Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">${item.total_price?.toFixed(2)}</p>
                    <span className={`badge text-xs ${VENDOR_STATUS_COLORS[item.vendor_status] || 'bg-gray-100 text-gray-600'}`}>
                      {item.vendor_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Top Products</h2>
            <Link to="/vendor/products" className="text-sm text-indigo-600 hover:underline">Manage</Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.product_id || i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                  {p.product_image && (
                    <img src={p.product_image} alt={p.product_name} className="w-8 h-8 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.product_name}</p>
                    <p className="text-xs text-gray-500">Sold: {p.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">${parseFloat(p.total_price || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
