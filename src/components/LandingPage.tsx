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
} from 'lucide-react';
import { Salon, BusinessCategory, User, Service, Technician, Product } from '../types';
import { fetchServices, fetchTechnicians } from '../lib/api';

interface LandingPageProps {
  salons: Salon[];
  categories: BusinessCategory[];
  currentUser?: User | null;
  products?: Product[];
  onExplore: () => void;
  onOpenLogin: () => void;
  onOpenRegisterSalon: () => void;
  onBookSalon: (salon: Salon) => void;
  onSelectSalon: (salon: Salon) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onOpenProducts?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  salons,
  categories,
  currentUser,
  products = [],
  onExplore,
  onOpenLogin,
  onOpenRegisterSalon,
  onBookSalon,
  onSelectSalon,
  onAddToCart,
  onSelectProduct,
  onOpenProducts,
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

  const featureSalons = salons ? salons.slice(0, 3) : [];
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
      {/* Hero landing screen */}
      <section className="relative overflow-hidden rounded-[2rem] border border-pink-100 bg-gradient-to-br from-pink-950 via-rose-700 to-purple-950 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(251,191,36,0.25),transparent_12%),radial-gradient(circle_at_30%_70%,rgba(244,114,182,0.45),transparent_16%)]" />
        <div className="relative grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-8 sm:p-12 lg:p-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] backdrop-blur">
              <Sparkles className="w-4 h-4 text-amber-200" />
              Nail Glam Studio
            </div>

            <div className="mt-8">
              <h1 className="max-w-2xl font-serif text-5xl sm:text-6xl font-black leading-none tracking-tight">
                Your glow-up starts here.
              </h1>
              <p className="mt-5 max-w-xl text-sm sm:text-base leading-7 text-pink-50">
                Book beauty treatments, discover verified nail studios, and find the perfect salon for your next self-care ritual.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-pink-800 transition hover:bg-pink-50 shadow-lg cursor-pointer"
              >
                Explore Salons <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 cursor-pointer"
              >
                Customer Sign In
              </button>

              <button
                type="button"
                onClick={onOpenRegisterSalon}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-300 px-6 py-3 text-sm font-black text-rose-950 transition hover:bg-amber-200 cursor-pointer"
              >
                Register Your Studio
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5 text-[11px] font-bold text-pink-50">
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-300" /> Verified salons</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-300" /> Instant booking</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-300" /> Safe & curated</span>
            </div>
          </div>

          <div className="relative min-h-[420px] flex items-center justify-center p-8">
            <div className="absolute left-8 top-8 h-60 w-60 rounded-full bg-amber-300/40 blur-3xl" />
            <div className="relative w-full max-w-md rounded-[2rem] border border-white/50 bg-white/12 p-3 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.8rem] bg-white/90 p-4">
                {featuredSalon ? (
                  <div className="rounded-[1.4rem] bg-gradient-to-br from-rose-100 via-pink-50 to-purple-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black tracking-[0.18em] text-pink-800 uppercase">Today’s Beauty Match</span>
                      <Sparkles className="w-5 h-5 text-pink-700" />
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-400 flex items-center justify-center text-white shadow-md overflow-hidden">
                        {featuredSalon.logo ? (
                          <img src={featuredSalon.logo} alt={featuredSalon.salon_name} className="w-full h-full object-cover" />
                        ) : (
                          <Scissors className="w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-pink-700 uppercase tracking-[0.13em]">Signature Studio</div>
                        <div className="text-lg font-serif font-black text-gray-900">{featuredSalon.salon_name}</div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-[11px] font-black text-purple-800"><MapPin className="w-4 h-4" /> {featuredSalon.city || 'Metro Studio'}</div>
                        <div className="mt-2 text-xs text-gray-500 truncate">{featuredSalon.address?.split(',')[0] || 'Studio Address'}</div>
                      </div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-[11px] font-black text-purple-800"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {featuredSalon.review_count ? Number(featuredSalon.avg_rating).toFixed(1) : 'Not rated yet'}</div>
                        <div className="mt-2 text-xs text-gray-500">{featuredSalon.review_count ? `${featuredSalon.review_count} reviews` : 'No reviews yet'}</div>
                      </div>
                    </div>

                    {featuredService && (
                      <div className="mt-4 rounded-2xl bg-pink-950 text-white p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-[0.12em]">Today’s Ritual</span>
                          {featuredService.duration ? (
                            <span className="text-[11px] font-bold bg-white/12 rounded-full px-2 py-1">
                              {featuredService.duration} min
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-pink-200" />
                          </span>
                          <div>
                            <div className="text-sm font-bold">{featuredService.service_name}</div>
                            <div className="text-[11px] text-pink-100">{featuredService.category || featuredService.category_name || 'Signature Ritual'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] bg-gradient-to-br from-rose-100/70 via-pink-50 to-purple-50 p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-pink-200 flex items-center justify-center mx-auto text-pink-600 mb-3">
                      <Store className="w-7 h-7" />
                    </div>
                    <div className="text-[11px] font-black text-pink-700 uppercase tracking-[0.16em]">Studio Spotlight</div>
                    <h3 className="mt-2 font-serif text-lg font-black text-gray-900">No Studios Registered Yet</h3>
                    <p className="mt-2 text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                      Be the first verified nail salon or beauty studio to showcase your branches, treatments, and artists on Nail Glam Hub.
                    </p>
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={onOpenRegisterSalon}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-pink-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-pink-800 transition shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Register Your Studio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { icon: <Sparkles className="w-5 h-5 text-pink-600" />, label: 'Beauty Experts', value: technicianCount > 0 ? `${technicianCount}+` : '0' },
          { icon: <Store className="w-5 h-5 text-purple-700" />, label: 'Verified Stores', value: `${salons.length}` },
          { icon: <Calendar className="w-5 h-5 text-rose-600" />, label: 'Easy Booking', value: '24/7' },
          { icon: <Heart className="w-5 h-5 text-pink-500" />, label: 'Beauty Matches', value: salons.length > 0 ? '1:1' : 'Ready' },
        ].map((item, idx) => (
          <div key={idx} className="rounded-3xl border border-pink-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-2xl bg-pink-50 p-2">{item.icon}</span>
              <span className="text-2xl font-serif font-black text-gray-900">{item.value}</span>
            </div>
            <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">{item.label}</div>
          </div>
        ))}
      </section>

      {/* Feature categories */}
      <section className="rounded-[2rem] border border-pink-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-pink-700">Nail Service Types</span>
            <h2 className="mt-2 font-serif text-2xl font-black text-gray-900">Explore by Nail Studio Style</h2>
          </div>
          <button
            type="button"
            onClick={onExplore}
            className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-2 text-[11px] font-black text-pink-700 hover:bg-pink-100 transition cursor-pointer"
          >
            Browse all salons
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {topCategories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-pink-100 bg-gradient-to-br from-white to-pink-50 p-4">
              <Sparkles className="w-5 h-5 text-pink-600" />
              <div className="mt-4 text-sm font-black text-gray-900">{category.category_name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured salons */}
      <section className="rounded-[2rem] border border-pink-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-pink-700">Featured Studios</span>
            <h2 className="mt-2 font-serif text-2xl font-black text-gray-900">Today’s Top Salons</h2>
          </div>
          <button
            type="button"
            onClick={onExplore}
            className="rounded-2xl bg-pink-700 px-4 py-2 text-[11px] font-black text-white hover:bg-pink-800 transition cursor-pointer"
          >
            See the map
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
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
              <h3 className="text-base font-bold text-gray-800">No studios listed yet</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No salons are currently listed. Register your studio to get accredited and listed on Nail Glam Hub.
              </p>
              <button
                type="button"
                onClick={onOpenRegisterSalon}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-700 px-4 py-2 text-xs font-bold text-white hover:bg-pink-800 transition shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Register Your Studio
              </button>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
            {products.slice(0, 4).map((product) => {
              const salon = salons.find((s) => s.id === product.salon_id);
              const isOutOfStock = product.stock_quantity <= 0;
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
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                          Sold Out
                        </span>
                      ) : (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          In Stock
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
                      title={!isCustomer ? 'Customer sign in required' : isOutOfStock ? 'Sold Out' : 'Quick Add to reservation bag'}
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
