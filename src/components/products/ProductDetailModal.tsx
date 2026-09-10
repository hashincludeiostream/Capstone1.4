import React, { useState, useEffect } from 'react';
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
  Lock,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { Product, User } from '../../types';

interface ProductDetailModalProps {
  product: Product | null;
  currentUser?: User | null;
  onRequireLogin?: () => void;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onDirectCheckout: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currentUser,
  onRequireLogin,
  onClose,
  onAddToCart,
  onDirectCheckout,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const isCustomer = currentUser?.user_type === 'customer';
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
    if (!isCustomer) {
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    onAddToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2000);
  };

  const handleReserveNow = () => {
    if (isOutOfStock) return;
    if (!isCustomer) {
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    onDirectCheckout(product, quantity);
  };

  // Keyboard Escape key handler to ensure modal can always be closed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scrolling while product detail modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex min-h-full items-start sm:items-center justify-center p-3 sm:p-4 text-center sm:py-8 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      {/* Invisible backdrop click area */}
      <div className="fixed inset-0 -z-10 cursor-pointer" onClick={onClose} aria-hidden="true" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 my-auto relative text-left"
      >
        {/* Prominent High-Contrast Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details (Escape)"
          title="Close (Esc)"
          className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-white text-stone-700 hover:text-stone-950 border border-stone-200/90 flex items-center justify-center shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
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
              <h2 id="product-modal-title" className="text-xl font-bold text-stone-900 font-serif leading-snug">
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

              {/* Price & Available Stock Card */}
              <div className="pt-2 space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <span className="text-xs text-stone-400 block font-sans">Physical Store Settlement Price</span>
                    <div className="text-2xl font-black text-stone-900">
                      ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                      Salon Inventory
                    </span>
                    <span className={`text-sm font-black inline-flex items-center gap-1 ${
                      isOutOfStock
                        ? 'text-red-600'
                        : isLowStock
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}>
                      {isOutOfStock ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>0 units</span>
                        </>
                      ) : isLowStock ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{product.stock_quantity} left</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{product.stock_quantity} available</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Available Stock Box */}
                <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${
                  isOutOfStock
                    ? 'bg-red-50/60 border-red-200 text-red-900'
                    : isLowStock
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 shrink-0" />
                      <span className="font-bold">
                        {isOutOfStock
                          ? 'Sold Out at this Location'
                          : isLowStock
                          ? `Low Stock: Only ${product.stock_quantity} unit${product.stock_quantity !== 1 ? 's' : ''} remaining!`
                          : `Available Stock: ${product.stock_quantity} unit${product.stock_quantity !== 1 ? 's' : ''} in store`}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold opacity-80">
                      {isOutOfStock ? '0 in stock' : `${product.stock_quantity} in salon stock`}
                    </span>
                  </div>

                  {/* Visual Inventory Bar */}
                  <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOutOfStock
                          ? 'bg-red-500 w-0'
                          : isLowStock
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{
                        width: isOutOfStock
                          ? '0%'
                          : `${Math.min(100, Math.max(12, (product.stock_quantity / Math.max(15, (product.low_stock_threshold || 5) * 3)) * 100))}%`,
                      }}
                    />
                  </div>
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700">Quantity to Reserve:</span>
                    <span className="text-[11px] text-stone-500 font-medium">
                      (Max {product.stock_quantity} available)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
                      <button
                        onClick={handleDecrement}
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                        title="Decrease quantity"
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
                        title={quantity >= product.stock_quantity ? `Reached all ${product.stock_quantity} units available` : 'Increase quantity'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {quantity >= product.stock_quantity && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>All {product.stock_quantity} available units selected</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-3.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  title="Close product details"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Back</span>
                  <span className="sm:hidden">Close</span>
                </button>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : !isCustomer
                      ? 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200'
                      : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : !isCustomer ? (
                    <>
                      <Lock className="w-4 h-4 text-pink-600" />
                      <span>Sign In to Add</span>
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
                    className="flex-1 py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    {!isCustomer && <Lock className="w-3.5 h-3.5" />}
                    <span>{isCustomer ? 'Reserve for Pickup' : 'Sign In to Reserve'}</span>
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
