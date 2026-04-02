import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      {count !== undefined && (
        <span className="text-xs text-gray-500 ml-1">({count})</span>
      )}
    </div>
  );
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product.stock === 0) return;
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="card group flex flex-col hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 badge bg-red-500 text-white">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="badge bg-gray-700 text-white text-sm">Out of stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.vendor_profiles?.business_name && (
          <p className="text-xs text-indigo-600 font-medium truncate">
            {product.vendor_profiles.business_name}
          </p>
        )}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <StarRating rating={product.avg_rating} count={product.review_count} />
        <div className="flex items-center gap-2 mt-auto pt-2">
          <span className="text-base font-bold text-gray-900">${product.price.toFixed(2)}</span>
          {product.compare_price && (
            <span className="text-sm text-gray-400 line-through">${product.compare_price.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="btn-primary w-full text-sm mt-1"
        >
          <ShoppingCart className="w-4 h-4" /> Add to cart
        </button>
      </div>
    </Link>
  );
}
