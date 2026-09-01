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
} from 'lucide-react';
import { Salon, BusinessCategory, User, Service, Technician } from '../types';
import { fetchServices, fetchTechnicians } from '../lib/api';

interface LandingPageProps {
  salons: Salon[];
  categories: BusinessCategory[];
  currentUser?: User | null;
  onExplore: () => void;
  onOpenLogin: () => void;
  onOpenRegisterSalon: () => void;
  onBookSalon: (salon: Salon) => void;
  onSelectSalon: (salon: Salon) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  salons,
  categories,
  currentUser,
  onExplore,
  onOpenLogin,
  onOpenRegisterSalon,
  onBookSalon,
  onSelectSalon,
}) => {
  const [featuredSalon, setFeaturedSalon] = React.useState<Salon | null>(null);
  const [featuredService, setFeaturedService] = React.useState<Service | null>(null);
  const [technicianCount, setTechnicianCount] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

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
                <div className="rounded-[1.4rem] bg-gradient-to-br from-rose-100 via-pink-50 to-purple-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black tracking-[0.18em] text-pink-800 uppercase">Today’s Beauty Match</span>
                    <Sparkles className="w-5 h-5 text-pink-700" />
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-400 flex items-center justify-center text-white shadow-md overflow-hidden">
                      {featuredSalon?.logo ? (
                        <img src={featuredSalon.logo} alt={featuredSalon.salon_name} className="w-full h-full object-cover" />
                      ) : (
                        <Scissors className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-pink-700 uppercase tracking-[0.13em]">Signature Studio</div>
                      <div className="text-lg font-serif font-black text-gray-900">{featuredSalon?.salon_name || 'Loading...'}</div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-2 text-[11px] font-black text-purple-800"><MapPin className="w-4 h-4" /> {featuredSalon?.city || 'Metro Manila'}</div>
                      <div className="mt-2 text-xs text-gray-500 truncate">{featuredSalon?.address?.split(',')[0] || 'Premium Location'}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-2 text-[11px] font-black text-purple-800"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {Number(featuredSalon?.avg_rating || 0).toFixed(1) || '4.9'}</div>
                      <div className="mt-2 text-xs text-gray-500">Verified Studio</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-pink-950 text-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-[0.12em]">Today’s Ritual</span>
                      <span className="text-[11px] font-bold bg-white/12 rounded-full px-2 py-1">12:30 PM</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-200" />
                      </span>
                      <div>
                        <div className="text-sm font-bold">{featuredService?.service_name || 'Premium Service'}</div>
                        <div className="text-[11px] text-pink-100">{featuredService?.category_name || 'Luxury Treatment'}</div>
                      </div>
                    </div>
                  </div>
                </div>
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
          { icon: <Sparkles className="w-5 h-5 text-pink-600" />, label: 'Beauty Experts', value: `${technicianCount}+` },
          { icon: <Store className="w-5 h-5 text-purple-700" />, label: 'Verified Stores', value: `${salons.length}` },
          { icon: <Calendar className="w-5 h-5 text-rose-600" />, label: 'Easy Booking', value: '24/7' },
          { icon: <Heart className="w-5 h-5 text-pink-500" />, label: 'Beauty Matches', value: '1:1' },
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
          {featureSalons.map((salon) => (
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
                  <span className="text-[11px] font-black text-gray-700">{salon.avg_rating || '4.9'}</span>
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
          ))}
        </div>
      </section>

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
