import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { productsApi, categoriesApi } from '../lib/api';
import ProductCard from '../components/ProductCard';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Reviewed' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 20, sort };
    if (search) params.search = search;
    if (category) params.category = category;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    productsApi.list(params)
      .then((res) => {
        setProducts(res.data || []);
        setPagination(res.pagination);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, minPrice, maxPrice, page]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const hasFilters = search || category || minPrice || maxPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className={`w-full md:w-60 shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="card p-4 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Filters</h2>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>

            {/* Category */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Category</p>
              <div className="space-y-1">
                <button
                  onClick={() => setParam('category', '')}
                  className={`block w-full text-left text-sm px-2 py-1 rounded ${!category ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setParam('category', c.id)}
                    className={`block w-full text-left text-sm px-2 py-1 rounded truncate ${category === c.id ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Price Range</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setParam('minPrice', e.target.value)}
                  className="input text-xs px-2 py-1"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setParam('maxPrice', e.target.value)}
                  className="input text-xs px-2 py-1"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden btn-secondary text-sm py-1.5 px-3"
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              {search && (
                <span className="text-sm text-gray-500">
                  Results for &ldquo;<strong>{search}</strong>&rdquo;
                </span>
              )}
              {pagination && (
                <span className="text-sm text-gray-400">({pagination.total} products)</span>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input w-auto text-sm py-1.5"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No products found.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setParam('page', p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${page === p ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
