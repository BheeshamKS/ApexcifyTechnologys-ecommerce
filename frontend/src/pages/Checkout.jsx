import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Package, MapPin, CreditCard } from 'lucide-react';
import { ordersApi } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Shipping', icon: MapPin },
  { id: 2, label: 'Review', icon: Package },
  { id: 3, label: 'Payment', icon: CreditCard },
];

const TAX_RATE = 0.08;
const FREE_SHIPPING = 50;
const SHIPPING_COST = 5;

const INITIAL_ADDR = {
  full_name: '', email: '', phone: '',
  address_line1: '', address_line2: '',
  city: '', state: '', zip: '', country: 'US',
};

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({
    ...INITIAL_ADDR,
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [placing, setPlacing] = useState(false);

  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shipping;

  const updateAddr = (k, v) => setAddress((a) => ({ ...a, [k]: v }));

  const validateStep1 = () => {
    const req = ['full_name', 'email', 'address_line1', 'city', 'state', 'zip', 'country'];
    return req.every((k) => address[k]?.trim());
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const { data } = await ordersApi.create({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: address,
        payment_method: paymentMethod,
      });
      clearCart();
      navigate(`/account/orders/${data.id}`, { state: { newOrder: true } });
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Steps indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  step > s.id ? 'bg-green-500 text-white' :
                  step === s.id ? 'bg-indigo-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`hidden sm:block text-sm font-medium ${step === s.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" /> Shipping Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'full_name', label: 'Full Name', full: true },
                  { key: 'email', label: 'Email', type: 'email', full: true },
                  { key: 'phone', label: 'Phone (optional)' },
                  { key: 'address_line1', label: 'Address Line 1', full: true },
                  { key: 'address_line2', label: 'Address Line 2 (optional)', full: true },
                  { key: 'city', label: 'City' },
                  { key: 'state', label: 'State / Province' },
                  { key: 'zip', label: 'ZIP / Postal Code' },
                  { key: 'country', label: 'Country' },
                ].map(({ key, label, type = 'text', full }) => (
                  <div key={key} className={full ? 'sm:col-span-2' : ''}>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
                    <input
                      type={type}
                      value={address[key]}
                      onChange={(e) => updateAddr(key, e.target.value)}
                      className="input"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => validateStep1() ? setStep(2) : toast.error('Please fill all required fields')}
                className="btn-primary mt-6"
              >
                Continue to Review <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" /> Order Review
              </h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <p className="font-semibold text-gray-800 mb-2">Shipping to:</p>
                <p className="text-gray-600">{address.full_name}</p>
                <p className="text-gray-600">{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}</p>
                <p className="text-gray-600">{address.city}, {address.state} {address.zip}, {address.country}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary">
                  Continue to Payment <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-500" /> Payment Method
              </h2>
              <div className="space-y-3 mb-6">
                {[
                  { value: 'cash_on_delivery', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
                  { value: 'bank_transfer', label: 'Bank Transfer', desc: 'Transfer to our bank account' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
                <button onClick={placeOrder} disabled={placing} className="btn-primary">
                  {placing ? 'Placing order...' : `Place Order — $${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="card p-5 h-fit sticky top-20">
          <h2 className="font-bold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <hr className="border-gray-100 my-2" />
            <div className="flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
