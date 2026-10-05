import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { Star, ShieldAlert, CheckCircle, Package, ArrowLeft, ShoppingBag, ShoppingCart, AlertTriangle } from 'lucide-react';
import { QRTraceIcon } from '../components/FarmIcons';
import { formatPrice } from '../utils/currency';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(NotificationContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewTouched, setReviewTouched] = useState(false);

  // Fetch product data
  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`/api/products/${id}`);
      setProduct(data);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0].name);
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center animate-pulse">
        <div className="h-96 bg-white rounded-2xl border border-gray-100 max-w-4xl mx-auto"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6 bg-white border border-gray-100 rounded-2xl shadow-sm mt-8">
        <ShieldAlert className="w-12 h-12 text-[#A65D3D] mx-auto" />
        <h3 className="text-xl font-serif font-bold text-[#2F4B3C]">Product Not Found</h3>
        <p className="text-xs text-gray-500 font-sans leading-relaxed">The product you are looking for does not exist or has been removed from our harvests.</p>
        <Link to="/catalog" className="inline-block bg-[#2F4B3C] text-white text-xs uppercase tracking-wider font-semibold px-6 py-2.5 rounded">Back to Store</Link>
      </div>
    );
  }

  // Get pricing based on active variant selection
  let activePrice = product.basePrice;
  let activeStock = product.stock;
  let activeSku = product.sku;

  if (selectedVariant && product.variants && product.variants.length > 0) {
    const variant = product.variants.find(v => v.name === selectedVariant);
    if (variant) {
      activePrice = variant.price;
      activeStock = variant.stock;
      activeSku = variant.sku;
    }
  }

  const finalPrice = product.discount > 0 
    ? activePrice - (activePrice * (product.discount / 100)) 
    : activePrice;

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
    showToast(`Added ${quantity}x ${product.name} to cart!`, 'success');
  };

  const handleBuyNow = () => {
    addToCart(product, selectedVariant, quantity);
    navigate('/cart');
  };

  const handleCommentChange = (val) => {
    setComment(val);
    if (reviewTouched) {
      if (!val.trim()) setReviewError('Comment text is required');
      else if (val.length > 500) setReviewError('Comments cannot exceed 500 characters');
      else setReviewError('');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewTouched(true);
    
    if (!comment.trim()) {
      setReviewError('Comment text is required');
      return;
    }
    if (comment.length > 500) {
      setReviewError('Comments cannot exceed 500 characters');
      return;
    }

    setSubmittingReview(true);
    try {
      await axios.post(`/api/products/${id}/reviews`, { rating, comment });
      showToast('Review submitted successfully!', 'success');
      setComment('');
      setReviewError('');
      setReviewTouched(false);
      fetchProduct();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Helper context visuals based on category
  const getCategoryDetails = () => {
    if (product.category === 'Dry Fish') {
      return {
        originPhoto: "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=600&q=80",
        originLabel: "Coastal Drying Yard (Shoreline)",
        sourceLine: "Boat 'Ocean Breeze', Coastal Shore Yard #2",
        harvestDate: "Sun-cured 3 days ago",
        sourcingDesc: "Line-caught and sun-dried over 3 days at our coastal drying yard. Lightly salted, vacuum packed immediately to trap rich ocean aroma."
      };
    }
    if (product.category === 'Eggs') {
      return {
        originPhoto: "https://images.unsplash.com/photo-1548550022-cbf418b711d9?auto=format&fit=crop&w=600&q=80",
        originLabel: "Hen Pastures & Roaming Barns",
        sourceLine: "Agro Valley Pasture Barn C",
        harvestDate: "Laid this morning at dawn",
        sourcingDesc: "Collected daily from our free-range hen barns, graded by weight and hand-trayed. Yolks are deep golden yellow reflecting natural grain diets."
      };
    }
    // Chicken
    return {
      originPhoto: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=600&q=80",
      originLabel: "Grassland Pastures (Agro Valley)",
      sourceLine: "Agro Valley Farm Coop #4",
      harvestDate: "Harvested and prepared yesterday",
      sourcingDesc: "Corn-fed broiler chicken, pasture raised on grass pastures. Fully cleaned, dressed and packed under vacuum seals for cold chain freshness."
    };
  };

  const catDetails = getCategoryDetails();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 text-left font-sans bg-[#F6EFE3]">
      
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-gray-500 hover:text-[#2F4B3C] font-semibold cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      {/* Main product container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white rounded-xl p-6 sm:p-10 border border-gray-100 shadow-sm items-start">
        
        {/* Left: Dual Image Gallery (Product + Origin Photo) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-xl overflow-hidden pb-[80%] relative bg-texture-linen border border-gray-100 shadow-sm">
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          
          {/* Origin visual and Thumbnails */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#A65D3D] block">Origin Story Sourcing Visual</span>
            <div className="grid grid-cols-3 gap-4">
              {/* Product Thumbnail */}
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#2F4B3C] bg-gray-50">
                <img src={product.images[0]} alt="Thumbnail 1" className="w-full h-full object-cover" />
              </div>
              
              {/* Origin Area Thumbnail */}
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group cursor-default">
                <img src={catDetails.originPhoto} alt="Origin" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] text-white font-bold uppercase tracking-wider text-center px-1">{catDetails.originLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Premium Sourcing Purchasing details */}
        <div className="lg:col-span-6 space-y-8">
          
          {/* Product Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#2F4B3C]/5 text-[#2F4B3C] border border-[#2F4B3C]/10 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {product.category}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">SKU: {activeSku}</span>
            </div>
            
            <h1 className="text-3xl font-serif text-[#2F4B3C] font-semibold tracking-tight">{product.name}</h1>
            
            {/* Sourcing Origin Line */}
            <div className="flex items-start gap-2 bg-[#F6EFE3] border border-[#8A6A4B]/10 p-3 rounded-lg">
              <QRTraceIcon className="w-5 h-5 text-[#A65D3D] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-[#2F4B3C] block">Verified Source Origin</span>
                <span className="text-[#8A6A4B] block font-light mt-0.5">{catDetails.sourceLine}</span>
                <span className="text-[10px] text-[#A65D3D] font-medium block mt-0.5">{catDetails.harvestDate}</span>
              </div>
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-1.5 text-[#A65D3D] pt-1">
              <div className="flex">
                {[1,2,3,4,5].map(x => (
                  <Star key={x} className={`w-3.5 h-3.5 ${x <= Math.round(product.rating || 5) ? 'fill-current' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-800">{(product.rating || 5).toFixed(1)}</span>
              <span className="text-xs text-gray-400 font-light">({product.reviews?.length || 0} customer reviews)</span>
            </div>
          </div>

          {/* Sourcing-focused description */}
          <p className="text-xs text-gray-600 leading-relaxed font-light font-sans">
            {catDetails.sourcingDesc}
          </p>

          {/* Pricing & Stock card */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-[#F6EFE3] border border-[#8A6A4B]/10 rounded-lg">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#A65D3D] block">Price</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-bold text-[#2F4B3C]">{formatPrice(finalPrice)}</span>
                {product.discount > 0 && (
                  <span className="text-xs text-gray-400 line-through">{formatPrice(activePrice)}</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#A65D3D] block">Harvest Stock</span>
              <div className="mt-1">
                {activeStock === 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 font-bold uppercase tracking-wider">Out of Stock</span>
                ) : activeStock < 10 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-bold uppercase tracking-wider">Low Stock ({activeStock} left)</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-800 font-bold uppercase tracking-wider">Available ({activeStock})</span>
                )}
              </div>
            </div>
          </div>

          {/* Variant selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block">Package Options / Quantity Weight</label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded py-3 px-4 text-xs font-semibold cursor-pointer uppercase tracking-wider"
              >
                {product.variants.map((v, i) => (
                  <option key={i} value={v.name}>{v.name} — {formatPrice(v.price)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Purchasing actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
            
            {/* Quantity selector */}
            <div className="flex items-center border border-gray-200 rounded w-full sm:w-32 h-12 justify-between px-3 shrink-0">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-gray-400 hover:text-[#2F4B3C] font-bold text-sm px-2 cursor-pointer"
              >
                -
              </button>
              <span className="font-bold text-xs">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(activeStock || 99, quantity + 1))}
                className="text-gray-400 hover:text-[#2F4B3C] font-bold text-sm px-2 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Cart buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={handleAddToCart}
                disabled={activeStock === 0}
                className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white rounded font-bold h-12 flex items-center justify-center gap-1.5 uppercase tracking-widest text-[10px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={activeStock === 0}
                className="bg-[#A65D3D] hover:bg-[#A65D3D]/90 text-white rounded font-bold h-12 flex items-center justify-center gap-1.5 uppercase tracking-widest text-[10px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" /> Buy Now
              </button>
            </div>

          </div>

          {/* Specifications list */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="border-t border-gray-100 pt-6 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Package className="w-4 h-4 text-[#2F4B3C]" /> Traceability Specs
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs font-light">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex border-b border-gray-50 pb-2">
                    <span className="font-bold text-gray-500 w-28 uppercase shrink-0 text-[10px] tracking-wider">{key}:</span>
                    <span className="text-gray-800">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Review details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-[#8A6A4B]/10 pt-12 items-start">
        
        {/* Write a review */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-serif text-[#2F4B3C] font-semibold">Post a Review</h3>
          
          {user ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 block uppercase tracking-wider">Rating Score</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? 'fill-current text-[#A65D3D]' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-700 block uppercase tracking-wider">Comments</label>
                <textarea
                  rows="4"
                  placeholder="Share details about the freshness, size, packing, or delivery speed..."
                  value={comment}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  onBlur={() => handleCommentChange(comment)}
                  className={`w-full border outline-none rounded p-3 text-xs leading-relaxed input-field ${
                    !reviewTouched ? 'border-gray-200 focus:border-[#2F4B3C]' : reviewError ? 'input-invalid' : 'input-valid'
                  }`}
                />
                {reviewTouched && reviewError && (
                  <span className="text-red-500 font-bold text-[9px] tracking-wide flex items-center gap-1 mt-0.5 animate-pulse">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {reviewError}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingReview || (reviewTouched && reviewError !== '')}
                className="w-full bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-3 rounded text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                {submittingReview ? 'Posting...' : 'Post Customer Review'}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-200">
              <p className="text-xs text-gray-500 mb-3 font-light font-sans">Please sign in to submit a rating review.</p>
              <Link to="/profile" className="inline-block bg-[#A65D3D] text-white text-[10px] font-bold px-4 py-2 rounded uppercase tracking-wider">
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Reviews Feed */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-serif text-[#2F4B3C] font-semibold">
            Customer Feedbacks ({product.reviews?.length || 0})
          </h3>

          {(!product.reviews || product.reviews.length === 0) ? (
            <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200">
              <span className="text-2xl block mb-2">🌾</span>
              <p className="text-xs text-gray-500 font-light font-sans">No reviews posted yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((rev, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-xs text-gray-950">{rev.userName}</h4>
                      <span className="text-[9px] text-gray-400 font-light">{new Date(rev.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    {/* Stars */}
                    <div className="flex text-[#A65D3D]">
                      {[1,2,3,4,5].map(x => (
                        <Star key={x} className={`w-3 h-3 ${x <= rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-light leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ProductDetails;
