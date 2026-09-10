import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Tag,
  Star,
  Eye,
  Plus,
  ArrowUpDown,
  Building2,
  Store,
  Info,
} from 'lucide-react';
import { Product, Salon } from '../../types';

interface ProductCatalogProps {
  products: Product[];
  salons: Salon[];
  loading?: boolean;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenCart: () => void;
  cartItemCount: number;
}

const CATEGORIES = [
  'All',
  'Cuticle & Nail Care',
  'Nail Polish & Lacquer',
  'Gel & Acrylic Kits',
  'Nail Art & Glitters',
  'Tools & Accessories',
  'Lotions & Scrubs',
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  salons,
  loading = false,
  onSelectProduct,
  onAddToCart,
  onOpenCart,
  cartItemCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSalonId, setSelectedSalonId] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'stock'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedAnimationId, setAddedAnimationId] = useState<number | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Active check
        if (product.is_active === false) return false;

        // Category check
        if (selectedCategory !== 'All' && product.category !== selectedCategory) {
          return false;
        }

        // Salon check
        if (selectedSalonId !== 'all' && product.salon_id !== selectedSalonId) {
          return false;
        }

        // In-stock check
        if (inStockOnly && product.stock_quantity <= 0) {
          return false;
        }

        // Search check
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name?.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          const matchCat = product.category?.toLowerCase().includes(q);
          const matchSalon = product.salon_name?.toLowerCase().includes(q);
          const matchSku = product.sku?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat && !matchSalon && !matchSku) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'stock') return b.stock_quantity - a.stock_quantity;
        return 0; // featured default
      });
  }, [products, selectedCategory, selectedSalonId, inStockOnly, searchQuery, sortBy]);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock_quantity <= 0) return;
    onAddToCart(product, 1);
    setAddedAnimationId(product.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header & In-Store Notice Banner */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-pink-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-pink-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-semibold tracking-wide uppercase mb-3 border border-pink-500/30">
            <Store className="w-3.5 h-3.5" />
            <span>Beauty & Nail Care Retail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Salon Professional Products & Care Kits
          </h1>
          <p className="text-sm text-stone-300 mt-2 leading-relaxed">
            Reserve certified salon-grade polishes, organic cuticle oils, and nail care tools online. Inspect and settle your order safely at the physical salon reception upon pickup.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-stone-300">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Online Transactions</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5 text-pink-400" />
              <span>Direct In-Studio Pickup</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Authentic Salon Brands</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter & Quick Cart Row */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, cuticle oils, gel kits, or SKU..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-colors bg-stone-50/50"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Salon Branch Filter */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200 text-xs">
              <Building2 className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={selectedSalonId}
                onChange={(e) => setSelectedSalonId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent border-none font-medium text-stone-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Salons & Branches</option>
                {salons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.salon_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none font-medium text-stone-700 focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="stock">Highest Stock</option>
              </select>
            </div>

            {/* Open Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer ml-auto sm:ml-0 shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-pink-700 text-[11px] font-bold flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Bar & In-Stock Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer select-none self-end sm:self-auto shrink-0">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-stone-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
            />
            <span>In-stock only</span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-500">Loading catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No products found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting another category, or clearing filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedSalonId('all');
              setInStockOnly(false);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock_quantity <= 0;
            const isLowStock = !isOutOfStock && product.stock_quantity <= (product.low_stock_threshold || 5);
            const isJustAdded = addedAnimationId === product.id;

            return (
              <div
                key={product.id}
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

                  {/* Rating & In-Store Price */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-stone-400 block font-sans">Counter Price</span>
                      <div className="text-base font-bold text-stone-900">
                        ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-700 bg-stone-50 px-2 py-1 rounded-lg">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{product.rating || '4.9'}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => handleQuickAdd(product, e)}
                      disabled={isOutOfStock}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isOutOfStock
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-pink-600 hover:bg-pink-700 text-white shadow-2xs active:scale-98'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isOutOfStock ? 'Sold Out' : 'Quick Add'}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(product);
                      }}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
