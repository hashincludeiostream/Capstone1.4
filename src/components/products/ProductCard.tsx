import React from 'react';
import {
  Building2,
  Package,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  Check,
  Lock,
} from 'lucide-react';
import { Product } from '../../types';

export interface ProductCardProps {
  product?: Product | null;
  loading?: boolean;
  onSelectProduct?: (product: Product) => void;
  onQuickAdd?: (product: Product, e: React.MouseEvent) => void;
  isJustAdded?: boolean;
  isCustomer?: boolean;
}

export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`bg-white rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col overflow-hidden animate-pulse ${className}`}
    >
      {/* Thumbnail Aspect Square Skeleton */}
      <div className="relative aspect-square w-full bg-gradient-to-br from-stone-100 via-stone-200/70 to-stone-100 overflow-hidden">
        {/* Stock Badge Placeholder */}
        <div className="absolute top-2.5 left-2.5">
          <div className="h-5 w-20 rounded-md bg-stone-300/80 backdrop-blur-xs" />
        </div>
        {/* Category Chip Placeholder */}
        <div className="absolute bottom-2.5 left-2.5">
          <div className="h-5 w-24 rounded-md bg-white/80 backdrop-blur-xs" />
        </div>
      </div>

      {/* Body Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Salon Name Placeholder */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-pink-200/70 shrink-0" />
            <div className="h-3 w-1/3 rounded bg-pink-100/80" />
          </div>

          {/* Product Name Placeholder (2 lines) */}
          <div className="space-y-1 pt-0.5">
            <div className="h-4 w-5/6 rounded bg-stone-200/90" />
            <div className="h-4 w-2/3 rounded bg-stone-200/80" />
          </div>

          {/* Volume / Size & SKU Placeholder */}
          <div className="h-3 w-1/2 rounded bg-stone-100 pt-0.5" />
        </div>

        {/* Stock Indicator Skeleton */}
        <div className="pt-2 border-t border-stone-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-stone-100" />
            <div className="h-4 w-20 rounded-md bg-stone-200/60" />
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-stone-200 w-1/2 rounded-full" />
          </div>
        </div>

        {/* Price & Action Skeleton */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="h-2.5 w-16 rounded bg-stone-100" />
            <div className="h-5 w-20 rounded bg-stone-200/90" />
          </div>
          <div className="h-9 w-24 rounded-xl bg-stone-200/80 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  loading = false,
  onSelectProduct = () => {},
  onQuickAdd = () => {},
  isJustAdded = false,
  isCustomer = true,
}) => {
  if (loading || !product) {
    return <ProductCardSkeleton />;
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = !isOutOfStock && product.stock_quantity <= (product.low_stock_threshold || 5);

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-stone-200 hover:border-pink-300 hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Thumbnail Image with Badges */}
      <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80'}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Stock Status Pill */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-md bg-stone-900/90 text-stone-200 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/95 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs backdrop-blur-xs flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              Only {product.stock_quantity} left
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
              In Stock ({product.stock_quantity})
            </span>
          )}
        </div>

        {/* Category Chip */}
        <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/90 text-stone-700 text-[10px] font-semibold backdrop-blur-xs shadow-2xs">
          {product.category}
        </span>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {/* Salon Name */}
          <div className="flex items-center gap-1 text-[11px] text-pink-700 font-semibold truncate">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{product.salon_name || 'Verified Salon'}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug group-hover:text-pink-600 transition-colors">
            {product.name}
          </h3>

          {/* Volume / Size & SKU */}
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            {product.volume_or_size && <span>{product.volume_or_size}</span>}
            {product.sku && (
              <>
                <span>•</span>
                <span className="font-mono text-[10px]">{product.sku}</span>
              </>
            )}
          </div>
        </div>

        {/* Available Stock Indicator */}
        <div className="pt-2 border-t border-stone-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Package className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="text-stone-500 font-medium truncate">Available Stock:</span>
            </div>
            {isOutOfStock ? (
              <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                0 units (Sold Out)
              </span>
            ) : isLowStock ? (
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 shrink-0">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                Only {product.stock_quantity} left
              </span>
            ) : (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                {product.stock_quantity} in stock
              </span>
            )}
          </div>

          {/* Stock Availability Level Bar */}
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOutOfStock
                  ? 'bg-stone-300 w-0'
                  : isLowStock
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: isOutOfStock
                  ? '0%'
                  : `${Math.min(100, Math.max(15, (product.stock_quantity / Math.max(15, (product.low_stock_threshold || 5) * 3)) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Rating & In-Store Price & Action */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-stone-400 block font-sans">Counter Price</span>
            <div className="text-base font-bold text-stone-900 tabular-nums">
              ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Quick Reserve Button */}
          {isOutOfStock ? (
            <button
              disabled
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-2 rounded-xl bg-stone-100 text-stone-400 text-xs font-semibold cursor-not-allowed shrink-0"
            >
              Sold Out
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => onQuickAdd(product, e)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                isJustAdded
                  ? 'bg-emerald-600 text-white'
                  : !isCustomer
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-stone-900 hover:bg-pink-600 active:scale-95 text-white'
              }`}
              title={
                !isCustomer
                  ? 'Sign in as a Client to reserve products for in-store pickup'
                  : 'Reserve item for in-store collection'
              }
            >
              {isJustAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added!</span>
                </>
              ) : !isCustomer ? (
                <>
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>Client Login</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Reserve</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
