import React, { useState } from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Star,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ShieldCheck,
  Package,
  Clock,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { Product } from '../../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onDirectCheckout: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onDirectCheckout,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = !isOutOfStock && product.stock_quantity <= (product.low_stock_threshold || 5);
  const maxAvailable = Math.max(1, product.stock_quantity);

  const handleIncrement = () => {
    if (quantity < product.stock_quantity) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2000);
  };

  const handleReserveNow = () => {
    if (isOutOfStock) return;
    onDirectCheckout(product, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 my-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Product Image & Badges */}
          <div className="relative bg-stone-100 flex items-center justify-center min-h-[300px] md:min-h-[420px]">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80'}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="px-3 py-1 rounded-full bg-stone-900/90 text-white text-xs font-semibold backdrop-blur-xs">
                {product.category}
              </span>
              {isOutOfStock ? (
                <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Only {product.stock_quantity} left
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider">
                  In Stock ({product.stock_quantity})
                </span>
              )}
            </div>

            {product.sku && (
              <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-md bg-white/90 text-stone-600 font-mono text-[10px] backdrop-blur-xs">
                SKU: {product.sku}
              </div>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div className="p-6 md:p-7 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              {/* Salon Provider Info */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{product.salon_name || 'Verified Salon'}</span>
                </div>
                {product.salon_city && (
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <MapPin className="w-3 h-3" />
                    <span>Available at {product.salon_city} Studio</span>
                  </div>
                )}
              </div>

              {/* Product Title */}
              <h2 className="text-xl font-bold text-stone-900 font-serif leading-snug">
                {product.name}
              </h2>

              {/* Volume & Ratings */}
              <div className="flex items-center gap-3 text-xs text-stone-600">
                {product.volume_or_size && (
                  <div className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-medium">{product.volume_or_size}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{product.rating || '4.9'} ({product.review_count || 24} reviews)</span>
                </div>
              </div>

              {/* Price */}
              <div className="pt-2">
                <span className="text-xs text-stone-400 block font-sans">Physical Store Settlement Price</span>
                <div className="text-2xl font-black text-stone-900">
                  ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-stone-600 leading-relaxed max-h-32 overflow-y-auto pr-1">
                {product.description || 'Authentic salon-grade formulation recommended by certified nail artists.'}
              </div>

              {/* In-Store Settlement Clarity Notice */}
              <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-100 flex items-start gap-2.5 text-xs text-stone-700">
                <ShieldCheck className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900 block">No Online Payment Required</span>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Your reservation guarantees item availability. Inspect the product and pay directly in cash or card when collecting at the salon front desk.
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              {!isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">Quantity:</span>
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                    <button
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-1 text-xs font-bold text-stone-900 min-w-[2.5rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      disabled={quantity >= product.stock_quantity}
                      className="p-2 hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>

                {!isOutOfStock && (
                  <button
                    onClick={handleReserveNow}
                    className="flex-1 py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer text-center"
                  >
                    Reserve for Pickup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
