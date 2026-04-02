import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const TAX_RATE = 0.08;
const FREE_SHIPPING = 50;
const SHIPPING_COST = 5;

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center flex-1">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products to get started.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) return navigate('/auth/login?next=/checkout');
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({items.length} item{items.length > 1 ? 's' : ''})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product_id} className="card p-4 flex gap-4">
              <Link to={`/products/${item.slug}`} className="shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {item.vendor_name && (
                      <p className="text-xs text-indigo-600 font-medium">{item.vendor_name}</p>
                    )}
                    <Link to={`/products/${item.slug}`} className="font-semibold text-gray-900 hover:text-indigo-600 line-clamp-2 text-sm">
                      {item.name}
                    </Link>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="px-2 py-1 text-gray-500 hover:bg-gray-50 rounded-l-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm font-semibold min-w-[2.5rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="px-2 py-1 text-gray-500 hover:bg-gray-50 rounded-r-lg disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-red-500 hover:underline">
            Clear cart
          </button>
        </div>

        {/* Order summary */}
        <div className="card p-6 h-fit sticky top-20">
          <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {subtotal < FREE_SHIPPING && (
              <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg p-2">
                Add ${(FREE_SHIPPING - subtotal).toFixed(2)} more for free shipping!
              </p>
            )}
            <hr className="border-gray-100" />
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={handleCheckout} className="btn-primary w-full mt-5">
            Checkout <ArrowRight className="w-4 h-4" />
          </button>
          <Link to="/products" className="btn-secondary w-full mt-2 text-sm">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
