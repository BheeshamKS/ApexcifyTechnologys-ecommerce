import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'vendor' ? 'vendor' : 'customer';

  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    role: initialRole, business_name: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const payload = { full_name: form.full_name, email: form.email, password: form.password, role: form.role };
      if (form.role === 'vendor') payload.business_name = form.business_name;
      await register(payload);
      const dest = form.role === 'vendor' ? '/vendor' : '/';
      navigate(dest, { replace: true });
      toast.success('Account created! Welcome to ShopHub.');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-2xl mb-2">
            <ShoppingBag className="w-7 h-7" /> ShopHub
          </div>
          <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-indigo-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              {['customer', 'vendor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('role', r)}
                  className={`py-2 text-sm font-semibold rounded-md capitalize transition-colors ${form.role === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {r === 'vendor' ? 'Sell on ShopHub' : 'Shop as Customer'}
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
              <input
                required
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                className="input"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="input"
                placeholder="Min. 8 characters"
              />
            </div>

            {form.role === 'vendor' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Business Name</label>
                <input
                  required
                  value={form.business_name}
                  onChange={(e) => set('business_name', e.target.value)}
                  className="input"
                  placeholder="Your Store Name"
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
