import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { productsApi, categoriesApi } from '../../lib/api';
import toast from 'react-hot-toast';

export function VendorProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = (s = '') => {
    setLoading(true);
    const params = { limit: 50 };
    if (s) params.search = s;
    productsApi.mine(params)
      .then((res) => setProducts(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (product) => {
    try {
      await productsApi.update(product.id, { is_active: !product.is_active });
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p)
      );
      toast.success(product.is_active ? 'Product hidden' : 'Product published');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Remove "${product.name}"?`)) return;
    try {
      await productsApi.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Product removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
        <Link to="/vendor/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); load(e.target.value); }}
            className="input max-w-sm"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sku || p.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.categories?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${p.price?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${p.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/vendor/products/${p.id}/edit`} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => toggleActive(p)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50" title={p.is_active ? 'Hide' : 'Publish'}>
                          {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(p)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const BLANK = {
  name: '', slug: '', description: '', price: '',
  compare_price: '', stock: '', sku: '',
  category_id: '', images: [''], tags: '',
  is_active: true, is_featured: false,
};

export function VendorProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(BLANK);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data || []));
    if (isEdit) {
      // Load product by id — find via vendor mine list
      productsApi.mine({ limit: 100 }).then((res) => {
        const p = (res.data || []).find((x) => x.id === id);
        if (p) {
          setForm({
            name: p.name || '',
            slug: p.slug || '',
            description: p.description || '',
            price: p.price?.toString() || '',
            compare_price: p.compare_price?.toString() || '',
            stock: p.stock?.toString() || '',
            sku: p.sku || '',
            category_id: p.category_id || '',
            images: p.images?.length ? p.images : [''],
            tags: (p.tags || []).join(', '),
            is_active: p.is_active,
            is_featured: p.is_featured,
          });
        }
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const autoSlug = (name) => {
    const s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    set('slug', s);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      stock: parseInt(form.stock),
      sku: form.sku || null,
      category_id: form.category_id || null,
      images: form.images.filter(Boolean),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_active: form.is_active,
    };
    try {
      if (isEdit) {
        await productsApi.update(id, payload);
        toast.success('Product updated');
      } else {
        await productsApi.create(payload);
        toast.success('Product created');
      }
      navigate('/vendor/products');
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/vendor/products" className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Info</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => { set('name', e.target.value); if (!isEdit) autoSlug(e.target.value); }}
              className="input"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Slug *</label>
            <input
              required
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              className="input font-mono text-sm"
              placeholder="product-url-slug"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              className="input"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Pricing & Inventory</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Price *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Compare at Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.compare_price}
                onChange={(e) => set('compare_price', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Stock *</label>
              <input
                type="number"
                required
                min="0"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Images</h2>
          {form.images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  const imgs = [...form.images];
                  imgs[i] = e.target.value;
                  set('images', imgs);
                }}
                placeholder="https://..."
                className="input"
              />
              {i === form.images.length - 1 && (
                <button
                  type="button"
                  onClick={() => set('images', [...form.images, ''])}
                  className="btn-secondary shrink-0 text-sm px-3"
                >
                  +
                </button>
              )}
            </div>
          ))}
          <p className="text-xs text-gray-500">Enter image URLs (hosted externally)</p>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Tags & Visibility</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="electronics, gadget, portable"
              className="input"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Active (visible to customers)</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/vendor/products" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
