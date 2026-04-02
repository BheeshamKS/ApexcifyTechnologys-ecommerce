import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { productsApi, categoriesApi } from '../lib/api';
import ProductCard from '../components/ProductCard';

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.list({ is_featured: 'true', limit: 8 }),
      categoriesApi.list(),
    ])
      .then(([featuredRes, catsRes]) => {
        setFeatured(featuredRes.data || []);
        setCategories(catsRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  // If there's a search query, redirect to products page
  if (searchQuery) {
    return <SearchResults query={searchQuery} />;
  }

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Everything you need,<br className="hidden sm:block" /> one marketplace
          </h1>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            Shop from thousands of verified vendors. Fast shipping, easy returns, secure payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/products" className="btn-primary bg-white text-indigo-700 hover:bg-indigo-50 text-base px-6 py-3">
              Browse Products <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/auth/register?role=vendor" className="btn-secondary bg-transparent border-white text-white hover:bg-white/10 text-base px-6 py-3">
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Secure Payments', desc: 'Your data is always protected' },
            { icon: TrendingUp, title: 'Top Vendors', desc: 'Verified and rated sellers' },
            { icon: Sparkles, title: 'Quality Products', desc: 'Reviewed by real buyers' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              All products <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="card p-3 text-center hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-10 h-10 mx-auto mb-2 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 mx-auto mb-2 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 font-bold text-lg">
                    {cat.name[0]}
                  </div>
                )}
                <p className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{cat.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/products?sort=newest" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productsApi.list({ search: query, limit: 24 })
      .then((res) => setResults(res.data || []))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
      </h1>
      {results.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No products found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
