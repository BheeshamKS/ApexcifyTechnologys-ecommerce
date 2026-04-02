import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, ShoppingCart, ChevronLeft, Package, Store,
  ThumbsUp, Shield, Truck,
} from 'lucide-react';
import { productsApi, reviewsApi } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function Stars({ rating, size = 'sm', interactive = false, onRate }) {
  const sz = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          onClick={() => interactive && onRate?.(s)}
          className={`${sz} transition-colors ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} ${interactive ? 'cursor-pointer hover:text-amber-400 hover:fill-amber-400' : ''}`}
        />
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState(null);

  useEffect(() => {
    productsApi.get(slug)
      .then(({ data }) => {
        setProduct(data);
        setReviews(data.recent_reviews || []);
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadMoreReviews = (page) => {
    reviewsApi.list({ product_id: product.id, page, limit: 5 })
      .then((res) => {
        setReviews(res.data || []);
        setReviewPagination(res.pagination);
        setReviewPage(page);
      });
  };

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addItem(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in to review');
    setSubmitting(true);
    try {
      const { data } = await reviewsApi.create({ product_id: product.id, ...reviewForm });
      setReviews((prev) => [data, ...prev]);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return <div className="text-center py-24 text-gray-400">Product not found.</div>;

  const images = product.images?.length ? product.images : [null];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <Link to="/products" className="hover:text-indigo-600">Products</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
            {images[activeImg] ? (
              <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package className="w-20 h-20" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${activeImg === i ? 'border-indigo-500' : 'border-gray-200'}`}
                >
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.vendor_profiles?.business_name && (
            <Link
              to={`/vendor/${product.vendor_id}`}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:underline mb-2"
            >
              <Store className="w-4 h-4" />
              {product.vendor_profiles.business_name}
            </Link>
          )}

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <Stars rating={product.avg_rating} size="sm" />
            <span className="text-sm text-gray-500">
              {product.avg_rating.toFixed(1)} ({product.review_count} reviews)
            </span>
            {product.categories?.name && (
              <Link
                to={`/products?category=${product.category_id}`}
                className="badge bg-indigo-50 text-indigo-700 text-xs"
              >
                {product.categories.name}
              </Link>
            )}
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
            {product.compare_price && (
              <>
                <span className="text-xl text-gray-400 line-through">${product.compare_price.toFixed(2)}</span>
                <span className="badge bg-red-100 text-red-700">
                  Save {Math.round((1 - product.price / product.compare_price) * 100)}%
                </span>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Stock */}
          <div className="mb-5">
            {product.stock > 0 ? (
              <span className="text-sm text-green-600 font-medium">
                ✓ In stock ({product.stock} available)
              </span>
            ) : (
              <span className="text-sm text-red-600 font-medium">✗ Out of stock</span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-l-lg"
                >
                  −
                </button>
                <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-r-lg"
                >
                  +
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex-1">
                <ShoppingCart className="w-5 h-5" /> Add to cart
              </button>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 mt-4">
            {[
              { icon: Shield, text: 'Secure checkout' },
              { icon: Truck, text: 'Free shipping over $50' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
                <Icon className="w-4 h-4 text-indigo-500" />
                {text}
              </div>
            ))}
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag) => (
                <span key={tag} className="badge bg-gray-100 text-gray-600">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews section */}
      <div className="mt-16">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating summary */}
          <div className="card p-6">
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-gray-900">{product.avg_rating.toFixed(1)}</p>
              <Stars rating={product.avg_rating} size="lg" />
              <p className="text-sm text-gray-500 mt-1">{product.review_count} reviews</p>
            </div>
          </div>

          {/* Write review */}
          {user?.role === 'customer' && (
            <div className="card p-6 lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Write a Review</h3>
              <form onSubmit={submitReview} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Rating</label>
                  <Stars
                    rating={reviewForm.rating}
                    size="lg"
                    interactive
                    onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))}
                  />
                </div>
                <input
                  placeholder="Review title (optional)"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                  className="input"
                />
                <textarea
                  placeholder="Share your experience..."
                  rows={3}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  className="input resize-none"
                />
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Review list */}
        <div className="mt-8 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
                      {r.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.profiles?.full_name || 'Anonymous'}</p>
                      <Stars rating={r.rating} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {r.is_verified_purchase && (
                      <span className="badge bg-green-50 text-green-700">Verified</span>
                    )}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                {r.title && <p className="font-semibold text-gray-900 mt-3">{r.title}</p>}
                {r.comment && <p className="text-gray-600 text-sm mt-1">{r.comment}</p>}
                <button
                  onClick={() => reviewsApi.markHelpful(r.id)}
                  className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600"
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({r.helpful_count})
                </button>
              </div>
            ))
          )}

          {!reviewPagination && product.review_count > 5 && (
            <button
              onClick={() => loadMoreReviews(1)}
              className="btn-secondary w-full mt-4"
            >
              Load all reviews
            </button>
          )}
          {reviewPagination && reviewPagination.totalPages > reviewPage && (
            <button
              onClick={() => loadMoreReviews(reviewPage + 1)}
              className="btn-secondary w-full"
            >
              Load more reviews
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
