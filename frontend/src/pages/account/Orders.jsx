import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Package, ChevronRight, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';
import { ordersApi } from '../../lib/api';

const STATUS_CONFIG = {
  pending:    { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
  confirmed:  { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, label: 'Confirmed' },
  processing: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Processing' },
  shipped:    { color: 'bg-indigo-100 text-indigo-700', icon: Truck, label: 'Shipped' },
  delivered:  { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Delivered' },
  cancelled:  { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelled' },
  refunded:   { color: 'bg-gray-100 text-gray-600', icon: XCircle, label: 'Refunded' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: 'bg-gray-100 text-gray-600', label: status };
  return <span className={`badge ${cfg.color}`}>{cfg.label}</span>;
}

export function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list({ limit: 20 })
      .then((res) => setOrders(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">You haven&apos;t placed any orders yet.</p>
          <Link to="/products" className="btn-primary mt-4">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/account/orders/${order.id}`}
              className="card p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString()} · {order.order_items?.length || 0} item(s)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <p className="font-bold text-gray-900 text-sm">${order.total_amount?.toFixed(2)}</p>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const isNew = location.state?.newOrder;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.get(id)
      .then(({ data }) => setOrder(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return <div className="text-center py-24 text-gray-400">Order not found.</div>;

  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStep = steps.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
      {isNew && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Order placed successfully!</p>
            <p className="text-sm text-green-600">You&apos;ll receive a confirmation email shortly.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress tracker */}
      {!['cancelled', 'refunded'].includes(order.status) && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStep ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-xs mt-1 text-gray-500 capitalize hidden sm:block">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.product_image && (
                    <img src={item.product_image} alt={item.product_name} className="w-14 h-14 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.unit_price?.toFixed(2)}</p>
                    <StatusBadge status={item.vendor_status} />
                  </div>
                  <p className="font-semibold text-sm text-gray-900">${item.total_price?.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          {order.shipping_address && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-2">Shipping Address</h2>
              <p className="text-sm text-gray-600">{order.shipping_address.full_name}</p>
              <p className="text-sm text-gray-600">{order.shipping_address.address_line1}</p>
              <p className="text-sm text-gray-600">
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}, {order.shipping_address.country}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card p-5 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>${order.shipping_amount?.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${order.tax_amount?.toFixed(2)}</span></div>
            <hr className="border-gray-100" />
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span><span>${order.total_amount?.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
            <p className="text-gray-500">Payment: <span className="text-gray-900 font-medium capitalize">{order.payment_method?.replace(/_/g, ' ')}</span></p>
            <p className="text-gray-500 mt-1">Status: <span className="text-gray-900 font-medium capitalize">{order.payment_status}</span></p>
            {order.tracking_number && (
              <p className="text-gray-500 mt-1">Tracking: <span className="text-gray-900 font-mono">{order.tracking_number}</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
