import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { NotificationContext } from '../context/NotificationContext';
import { ShoppingBag, Star } from 'lucide-react';
import { TwineTagHeader, ChalkboardBadge, StampedSeal } from './RusticComponents';
import { formatPrice } from '../utils/currency';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { showToast } = useContext(NotificationContext);

  const discountPercent = product.discount || 0;
  const originalPrice = product.basePrice;
  const finalPrice = discountPercent > 0
    ? originalPrice - (originalPrice * (discountPercent / 100))
    : originalPrice;

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 10;

  const getSourcingTag = () => {
    if (product.category === 'Dry Fish') return product.specifications?.Origin || 'Coastal Harvest';
    if (product.category === 'Eggs') return 'Laid this morning';
    return product.specifications?.Freshness || 'Pasture-raised';
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    const variantName = product.variants && product.variants.length > 0 ? product.variants[0].name : '';
    addToCart(product, variantName, 1);
    showToast(`Added ${product.name} to cart!`, 'success');
  };

  // Category badge tint
  const getCategoryTint = () => {
    if (product.category === 'Dry Fish') return { bg: 'bg-[#3E6B6B]/10', text: 'text-[#3E6B6B]' };
    if (product.category === 'Eggs') return { bg: 'bg-[#C99A3A]/10', text: 'text-[#C99A3A]' };
    return { bg: 'bg-[#2F4B3C]/10', text: 'text-[#2F4B3C]' };
  };
  const tint = getCategoryTint();

  return (
    <div className="group flex flex-col h-full font-sans" style={{ perspective: '600px' }}>
      {/* Twine hole & loop */}
      <TwineTagHeader />

      {/* Main kraft-paper tag card */}
      <div
        className="relative flex flex-col grow transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #F2E8D5 0%, #EAD9BE 100%)',
          border: '1px solid #C5AD8C',
          borderRadius: '0 0 0.75rem 0.75rem',
          boxShadow: '0 4px 14px rgba(92,70,48,0.12), inset 0 0 0 3px rgba(255,255,255,0.4)',
        }}
      >
        {/* Stitched inner border visual (CSS outline trick) */}
        <div
          className="absolute inset-2 rounded pointer-events-none"
          style={{ border: '1px dashed #C5AD8C', borderRadius: '0.5rem' }}
          aria-hidden="true"
        />

        {/* Stamped seal / badge (top corner) */}
        {discountPercent > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <StampedSeal label={`${discountPercent}% OFF`} size={54} color="#B5484D" />
          </div>
        )}
        {!isOutOfStock && !discountPercent && (
          <div className="absolute top-3 right-3 z-10">
            <StampedSeal label="Farm Fresh" size={54} color="#2F4B3C" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-3 right-3 z-10">
            <StampedSeal label="Sold Out" size={54} color="#B5484D" />
          </div>
        )}

        {/* Product Image */}
        <Link to={`/products/${product._id}`} className="relative block overflow-hidden mx-4 mt-4 rounded-md" style={{ paddingBottom: '65%', background: '#D9C4A3' }}>
          <img
            src={product.images[0]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Sourcing origin tag */}
          <span className={`absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md uppercase tracking-wider ${tint.bg} ${tint.text}`}>
            {getSourcingTag()}
          </span>
        </Link>

        {/* Product Info */}
        <div className="px-4 pb-4 pt-3 flex flex-col grow justify-between space-y-3 relative z-10">
          <div className="space-y-1">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex text-[#A65D3D]">
                {[1, 2, 3, 4, 5].map((x) => (
                  <Star
                    key={x}
                    className={`w-2.5 h-2.5 ${x <= Math.round(product.rating || 5) ? 'fill-current' : 'text-[#C5AD8C]'}`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[#8A6A4B] font-medium">
                ({product.reviews?.length || 0})
              </span>
            </div>

            {/* Product Name — handwritten accent */}
            <Link to={`/products/${product._id}`} className="block">
              <h3 className="font-handwritten font-bold text-[#2B2B2B] group-hover:text-[#5C4630] transition-colors text-lg leading-tight line-clamp-2">
                {product.name}
              </h3>
            </Link>

            {/* Description */}
            <p className="text-[11px] text-[#8A6A4B] line-clamp-2 leading-relaxed font-light">
              {product.description}
            </p>
          </div>

          {/* Price & Cart row */}
          <div className="space-y-2.5 pt-2 border-t border-[#C5AD8C]/60">
            <div className="flex items-center justify-between">
              {/* Chalkboard price badge */}
              <div className="flex items-center gap-2">
                <ChalkboardBadge price={formatPrice(finalPrice)} />
                {discountPercent > 0 && (
                  <span className="text-[10px] text-[#8A6A4B] line-through font-sans">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>

              {/* Low stock indicator */}
              {isLowStock && !isOutOfStock && (
                <span className="text-[9px] font-bold text-[#B5484D] font-handwritten">
                  Only {product.stock} left!
                </span>
              )}
            </div>

            {/* Add to cart button — rustic barnwood style */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded font-handwritten font-bold text-sm tracking-wide transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-[#C5AD8C]/40 text-[#8A6A4B] border border-[#C5AD8C] cursor-not-allowed'
                  : 'bg-[#5C4630] hover:bg-[#3A2B1D] text-[#F2E8D5] border border-[#3A2B1D] shadow-sm hover:shadow-md active:scale-[0.98]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
