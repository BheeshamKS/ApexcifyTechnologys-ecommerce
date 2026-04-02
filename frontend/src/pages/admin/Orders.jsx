import { useEffect, useState } from 'react';
import { adminApi, ordersApi } from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  refunded:   'bg-gray-100 text-gray-600',
};

const ALL_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const load = (p = 1, s = statusFilter) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (s) params.status = s;
    adminApi.orders(params)
      .then((res) => {
        setOrders(res.data || []);
        setPagination(res.pagination);
        setPage(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const updateStatus = async (orderId, status) => {
    try {
      await ordersApi.updateStatus(orderId, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Orders</h1>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); load(1, e.target.value); }}
            className="input w-auto"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <>
                    <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{o.profiles?.full_name || '—'}</p>
                        <p className="text-xs text-gray-500">{o.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{o.order_items?.length || 0}</td>
                      <td className="px-4 py-3 font-semibold">${o.total_amount?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className={`badge border-0 cursor-pointer ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-indigo-600 text-xs font-medium">
                        {expandedId === o.id ? 'Hide' : 'Details'}
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr key={`${o.id}-detail`}>
                        <td colSpan={7} className="px-4 pb-4 bg-gray-50">
                          <div className="space-y-2 mt-2">
                            {o.order_items?.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                                <div className="flex-1 text-sm text-gray-800">{item.product_name}</div>
                                <div className="text-xs text-gray-500">
                                  {item.vendor_profiles?.business_name || 'Unknown vendor'}
                                </div>
                                <div className="text-xs text-gray-500">×{item.quantity}</div>
                                <div className="text-sm font-semibold">${item.total_price?.toFixed(2)}</div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => load(p)}
                className={`w-8 h-8 rounded text-sm font-medium ${page === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
