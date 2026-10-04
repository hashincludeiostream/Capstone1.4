import React from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Heart,
  MapPin,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  ShoppingBag,
  Plus,
  Lock,
  Eye,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Salon, BusinessCategory, User, Service, Technician, Product } from '../types';
import { fetchServices, fetchTechnicians } from '../lib/api';
import { HeroSection } from './HeroSection';
import { CategoryFilter } from './CategoryFilter';

interface LandingPageProps {
  salons: Salon[];
  categories: BusinessCategory[];
  currentUser?: User | null;
  products?: Product[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: number | null;
  onSelectCategory?: (id: number | null) => void;
  onExplore: () => void;
  onOpenLogin: () => void;
  onOpenRegisterSalon: () => void;
  onBookSalon: (salon: Salon) => void;
  onSelectSalon: (salon: Salon) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onOpenProducts?: () => void;
  onOpenBooking?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  salons,
  categories,
  currentUser,
  products = [],
  searchQuery = '',
  onSearchChange = () => {},
  selectedCategory = null,
  onSelectCategory = () => {},
  onExplore,
  onOpenLogin,
  onOpenRegisterSalon,
  onBookSalon,
  onSelectSalon,
  onAddToCart,
  onSelectProduct,
  onOpenProducts,
  onOpenBooking = () => {},
}) => {
  const [featuredSalon, setFeaturedSalon] = React.useState<Salon | null>(null);
  const [featuredService, setFeaturedService] = React.useState<Service | null>(null);
  const [technicianCount, setTechnicianCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [addedProductId, setAddedProductId] = React.useState<number | null>(null);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // Intercept if customer login is not established
    if (!currentUser || currentUser.user_type !== 'customer') {
      onOpenLogin();
      return;
    }

    if (product.stock_quantity <= 0) return;

    if (onAddToCart) {
      onAddToCart(product, 1);
      setAddedProductId(product.id);
      setTimeout(() => {
        setAddedProductId(null);
      }, 1200);
    }
  };

  React.useEffect(() => {
    // Load featured content from database
    const loadFeaturedContent = async () => {
      setIsLoading(true);
      try {
        if (salons && salons.length > 0) {
          // Get highest rated salon as featured
          const topRated = salons.reduce((best, current) => 
            (current.avg_rating || 0) > (best.avg_rating || 0) ? current : best
          , salons[0]);
          setFeaturedSalon(topRated);

          // Get first service from featured salon
          try {
            const services = await fetchServices(topRated.id);
            if (services && services.length > 0) {
              setFeaturedService(services[0]);
            }
          } catch (err) {
            console.error('Error fetching services:', err);
          }

          // Get total technician count
          try {
            const technicians = await fetchTechnicians();
            if (technicians) {
              setTechnicianCount(technicians.length);
            }
          } catch (err) {
            console.error('Error fetching technicians:', err);
          }
        }
      } catch (err) {
        console.error('Error in loadFeaturedContent:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedContent();
  }, [salons]);

  const [selectedServiceCategory, setSelectedServiceCategory] = React.useState<string | null>(null);
  const [serviceCategorySalonIds, setServiceCategorySalonIds] = React.useState<number[]>([]);

  // Filter salons if search query, service category, or business category is applied
  const filteredSalons = React.useMemo(() => {
    if (!salons) return [];
    return salons.filter((s) => {
      // 1. Search Query filter (name, city, province, address)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.salon_name?.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.province && s.province.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q));

      // 2. Service Category filter
      let matchesCategory = true;
      if (selectedServiceCategory) {
        if (serviceCategorySalonIds.length > 0) {
          matchesCategory = serviceCategorySalonIds.includes(Number(s.id));
        } else {
          matchesCategory =
            Boolean(s.category_name?.toLowerCase() === selectedServiceCategory.toLowerCase()) ||
            Boolean(s.description?.toLowerCase().includes(selectedServiceCategory.toLowerCase()));
        }
      } else if (selectedCategory !== null && selectedCategory !== undefined) {
        matchesCategory = s.category_id === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [salons, searchQuery, selectedServiceCategory, serviceCategorySalonIds, selectedCategory]);

  const isFiltering = searchQuery.trim().length > 0 || selectedServiceCategory !== null || selectedCategory !== null;
  const featureSalons = isFiltering ? filteredSalons : (salons ? salons.slice(0, 8) : []);
  const topCategories = categories ? categories.slice(0, 4) : [];

  // Show loading state only during initial data fetch
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading featured content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Streamlined Discovery Header with Search & Filter Bar (Hero Removed) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Discover & Book Verified Nail Salons
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Curated beauty sanctuaries, Russian manicures, gel arts & seamless online scheduling.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExplore}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200/80 px-3.5 py-2 text-xs font-bold text-pink-700 transition cursor-pointer"
            >
              <span>Explore All Studios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {!currentUser && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 px-3.5 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer"
              >
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar Container */}
        <HeroSection
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenBooking={onOpenBooking}
          hideCategories={true}
        />

        {/* Dynamic Service Category Filter Component */}
        <CategoryFilter
          selectedCategory={selectedServiceCategory}
          onSelectCategory={(catName, matchingIds) => {
            setSelectedServiceCategory(catName);
            setServiceCategorySalonIds(matchingIds);
            if (catName === null) {
              onSelectCategory(null);
            }
          }}
          totalSalonsCount={salons.length}
          filteredSalonsCount={filteredSalons.length}
          onExploreAll={onExplore}
        />
      </div>

      {!currentUser && (
        <section className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-900 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              To continue, please login to your customer account.
            </span>
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-2xl bg-amber-700 px-4 py-2 text-[11px] font-black text-white hover:bg-amber-800 transition cursor-pointer"
            >
              Login
            </button>
          </div>
        </section>
      )}

      {/* Trust cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6">
        {[
          { icon: <Sparkles className="w-5 h-5 text-pink-600" />, label: 'Beauty Experts', value: technicianCount > 0 ? `${technicianCount}+` : '0' },
          { icon: <Store className="w-5 h-5 text-purple-700" />, label: 'Verified Stores', value: `${salons.length}` },
          { icon: <Calendar className="w-5 h-5 text-rose-600" />, label: 'Easy Booking', value: '24/7' },
          { icon: <Heart className="w-5 h-5 text-pink-500" />, label: 'Beauty Matches', value: salons.length > 0 ? '1:1' : 'Ready' },
        ].map((item, idx) => (
          <div key={idx} className="rounded-3xl border border-pink-100 bg-white p-5 xl:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="rounded-2xl bg-pink-50 p-2.5">{item.icon}</span>
              <span className="text-2xl xl:text-3xl font-serif font-black text-gray-900">{item.value}</span>
            </div>
            <div className="mt-3 text-[11px] xl:text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{item.label}</div>
          </div>
        ))}
      </section>

      {/* Feature categories */}
      <section className="rounded-[2rem] border border-pink-100 bg-white p-6 xl:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] xl:text-xs font-black uppercase tracking-[0.16em] text-pink-700">Nail Service Types</span>
            <h2 className="mt-2 font-serif text-2xl xl:text-3xl font-black text-gray-900">Explore by Nail Studio Style</h2>
          </div>
          <button
            type="button"
            onClick={onExplore}
            className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-2 text-[11px] xl:text-xs font-black text-pink-700 hover:bg-pink-100 transition cursor-pointer"
          >
            Browse all salons
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-4 gap-3 xl:gap-5">
          {topCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSelectedServiceCategory(category.category_name);
                const el = document.getElementById('service-category-filter');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-left rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-4 xl:p-5 hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{category.icon || '💅'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-pink-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-4 text-sm xl:text-base font-black text-gray-900 group-hover:text-pink-700 transition-colors">
                {category.category_name}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Filter studios</div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured salons */}
      <section className="rounded-[2rem] border border-pink-100 bg-white p-6 xl:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] xl:text-xs font-black uppercase tracking-[0.16em] text-pink-700">
                Featured Studios
              </span>
              {selectedServiceCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-800 border border-pink-200">
                  <Sparkles className="w-3 h-3 text-pink-600" />
                  {selectedServiceCategory}
                </span>
              )}
            </div>
            <h2 className="mt-1.5 font-serif text-2xl xl:text-3xl font-black text-gray-900">
              {selectedServiceCategory ? `Studios Offering ${selectedServiceCategory}` : 'Today’s Top Salons'}
            </h2>
            {isFiltering && (
              <p className="text-xs text-gray-500 mt-1">
                Showing {featureSalons.length} {featureSalons.length === 1 ? 'studio' : 'studios'} matching your filter criteria
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSelectedServiceCategory(null);
                  setServiceCategorySalonIds([]);
                  onSearchChange('');
                  onSelectCategory(null);
                }}
                className="rounded-2xl border border-pink-200 bg-pink-50 px-3.5 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 transition cursor-pointer"
              >
                Clear all filters
              </button>
            )}
            <button
              type="button"
              onClick={onExplore}
              className="rounded-2xl bg-pink-700 px-4 py-2 text-[11px] xl:text-xs font-black text-white hover:bg-pink-800 transition cursor-pointer"
            >
              See the map
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4 xl:gap-6 mt-5">
          {featureSalons.length > 0 ? (
            featureSalons.map((salon) => (
              <article key={salon.id} className="rounded-[1.5rem] border border-pink-100 bg-white p-4 shadow-sm hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center">
                      <Store className="w-5 h-5 text-pink-700" />
                    </span>
                    <div>
                      <div className="text-sm font-black text-gray-900">{salon.salon_name}</div>
                      <div className="text-[11px] text-gray-500">{salon.city || salon.province || 'Metro Studio'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="text-[11px] font-black text-gray-700">{salon.review_count ? Number(salon.avg_rating).toFixed(1) : 'Not rated'}</span>
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-gray-500 line-clamp-2">{salon.address}</div>

                {selectedServiceCategory && (
                  <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Offers {selectedServiceCategory}</span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onSelectSalon(salon)}
                    className="text-[11px] font-black text-pink-700 hover:underline cursor-pointer"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onBookSalon(salon)}
                    className="rounded-2xl bg-pink-700 px-4 py-2 text-[11px] font-black text-white hover:bg-pink-800 transition cursor-pointer"
                  >
                    Book now
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full py-12 px-6 text-center rounded-2xl border border-dashed border-pink-200 bg-pink-50/40">
              <Store className="w-10 h-10 text-pink-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">
                {isFiltering ? 'No studios match this filter' : 'No studios listed yet'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {isFiltering
                  ? `No salons currently match "${selectedServiceCategory || searchQuery}". Try clearing your filters or exploring another category.`
                  : 'No salons are currently listed. Register your studio to get accredited and listed on Nail Glam Hub.'}
              </p>
              {isFiltering ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceCategory(null);
                    setServiceCategorySalonIds([]);
                    onSearchChange('');
                    onSelectCategory(null);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-700 px-4 py-2 text-xs font-bold text-white hover:bg-pink-800 transition shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Reset All Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenRegisterSalon}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-700 px-4 py-2 text-xs font-bold text-white hover:bg-pink-800 transition shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Register Your Studio
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured Boutique Care & Products */}
      {products && products.length > 0 && (
        <section className="rounded-[2rem] border border-pink-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-pink-700">Studio Boutique & Retail</span>
              <h2 className="mt-1 font-serif text-2xl font-black text-gray-900">Featured Nail Care & Essentials</h2>
              <p className="text-xs text-gray-500 mt-1">Reserve genuine studio polishes and care products for in-store pickup</p>
            </div>
            {onOpenProducts && (
              <button
                type="button"
                onClick={onOpenProducts}
                className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-2 text-[11px] font-black text-pink-700 hover:bg-pink-100 transition cursor-pointer self-start sm:self-auto"
              >
                Browse all products
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 mt-5">
            {products.slice(0, 4).map((product) => {
              const salon = salons.find((s) => s.id === product.salon_id);
              const isOutOfStock = product.stock_quantity <= 0;
              const isLowStock = !isOutOfStock && product.stock_quantity <= (product.low_stock_threshold || 5);
              const isJustAdded = addedProductId === product.id;
              const isCustomer = currentUser?.user_type === 'customer';

              return (
                <article
                  key={product.id}
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                  className="rounded-[1.5rem] border border-pink-100 bg-white p-3.5 shadow-sm hover:shadow-lg transition flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-100 mb-3">
                      <img
                        src={product.image_url || 'https://images.unsplash.com/photo-1608248597359-0a62377c08fe?w=600&auto=format&fit=crop&q=80'}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-[10px] font-semibold text-white">
                        {product.category}
                      </span>
                      {isOutOfStock ? (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-stone-900/90 text-stone-200 text-[10px] font-bold">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Only {product.stock_quantity} left
                        </span>
                      ) : (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          In Stock ({product.stock_quantity})
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-wider text-pink-700 truncate">
                      {salon?.salon_name || 'Verified Studio'}
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1 mt-0.5">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-black text-gray-900">
                        ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{product.rating || '4.9'}</span>
                      </div>
                    </div>

                    {/* Available Stock Indicator */}
                    <div className="mt-2.5 pt-2 border-t border-stone-100 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500 font-medium">Available Stock:</span>
                        {isOutOfStock ? (
                          <span className="font-bold text-red-600">0 units</span>
                        ) : isLowStock ? (
                          <span className="font-bold text-amber-700">Only {product.stock_quantity} left!</span>
                        ) : (
                          <span className="font-bold text-emerald-700">{product.stock_quantity} units</span>
                        )}
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
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
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(product, e)}
                      disabled={isOutOfStock}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isOutOfStock
                          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                          : isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : !isCustomer
                          ? 'bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200'
                          : 'bg-pink-600 hover:bg-pink-700 text-white shadow-2xs active:scale-98'
                      }`}
                      title={!isCustomer ? 'Customer sign in required' : isOutOfStock ? 'Sold Out' : `Quick Add 1 of ${product.stock_quantity} available units`}
                    >
                      {isJustAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : !isCustomer ? (
                        <>
                          <Lock className="w-3 h-3 text-pink-600" />
                          <span>Sign in to Add</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isOutOfStock ? 'Sold Out' : 'Quick Add'}</span>
                        </>
                      )}
                    </button>
                    {onSelectProduct && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct(product);
                        }}
                        className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="rounded-[2rem] border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-8 text-center">
        <Sparkles className="w-8 h-8 mx-auto mb-4 text-pink-700" />
        <div className="font-serif text-3xl font-black text-gray-900">Ready for your next appointment?</div>
        <div className="mt-2 text-sm text-gray-600">Find your salon, book your service, and let your beauty routine feel effortless.</div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onExplore}
            className="rounded-2xl bg-pink-700 px-6 py-3 text-[11px] font-black text-white hover:bg-pink-800 transition cursor-pointer"
          >
            Discover salons
          </button>
          <button
            type="button"
            onClick={onOpenLogin}
            className="rounded-2xl border border-pink-200 bg-white px-6 py-3 text-[11px] font-black text-pink-800 hover:bg-pink-50 transition cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </section>
    </div>
  );
};
