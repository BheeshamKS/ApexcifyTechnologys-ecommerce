import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Store, Package, ShoppingCart, DollarSign,
  CheckCircle2, Clock, ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
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
    </div>
  );
}

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const approveVendor = async (vendorId, approve) => {
    try {
      await adminApi.approveVendor(vendorId, approve);
      setData((d) => ({
        ...d,
        pendingVendorApprovals: d.pendingVendorApprovals.filter((v) => v.id !== vendorId),
      }));
      toast.success(approve ? 'Vendor approved' : 'Vendor rejected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-24 text-gray-400">Failed to load dashboard.</div>;

  const { stats, recentOrders, pendingVendorApprovals } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="indigo" />
        <StatCard icon={Store} label="Vendors" value={stats.totalVendors} color="purple" />
        <StatCard icon={Package} label="Products" value={stats.totalProducts} color="blue" />
        <StatCard icon={ShoppingCart} label="Orders" value={stats.totalOrders} color="amber" />
        <StatCard icon={DollarSign} label="Revenue (30d)" value={`$${stats.revenueThisMonth?.toFixed(2)}`} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5 font-mono text-xs text-gray-500">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-2.5 text-gray-900">{o.profiles?.full_name || o.profiles?.email || '—'}</td>
                      <td className="py-2.5 font-semibold">${o.total_amount?.toFixed(2)}</td>
                      <td className="py-2.5">
                        <span className={`badge ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending vendor approvals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Pending Vendors</h2>
            <span className="badge bg-amber-100 text-amber-700">{pendingVendorApprovals.length}</span>
          </div>
          {pendingVendorApprovals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p className="text-sm">All vendors approved</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVendorApprovals.map((v) => (
                <div key={v.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-4 h-4 text-indigo-500" />
                    <p className="font-medium text-sm text-gray-900">{v.business_name}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {v.profiles?.full_name} · {v.profiles?.email}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveVendor(v.id, true)}
                      className="btn-primary text-xs px-2 py-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => approveVendor(v.id, false)}
                      className="btn-danger text-xs px-2 py-1"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {[
          { to: '/admin/users', icon: Users, label: 'Manage Users' },
          { to: '/admin/vendors', icon: Store, label: 'Manage Vendors' },
          { to: '/admin/products', icon: Package, label: 'Manage Products' },
          { to: '/admin/orders', icon: ShoppingCart, label: 'Manage Orders' },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="card p-4 flex items-center gap-3 hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Icon className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  );
}
