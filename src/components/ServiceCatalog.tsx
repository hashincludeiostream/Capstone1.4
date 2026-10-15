import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Clock, Calendar, Check, Filter } from 'lucide-react';
import { Service, Salon } from '../types';
import { fetchServices } from '../lib/api';

interface ServiceCatalogProps {
  salons: Salon[];
  onBookService: (service: Service) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ salons, onBookService }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchServices();
      setServices(data);
      setLoading(false);
    }
    load();
  }, []);

  const categories = ['All', ...Array.from(new Set(services.map((service) => service.category).filter(Boolean))).sort()];

  const filtered = services.filter((s) => {
    const matchCat = categoryFilter === 'All' || (s.category || '').toLowerCase().includes(categoryFilter.toLowerCase());
    const matchSearch =
      !searchQuery ||
      s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-900 via-rose-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-pink-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Treatment & Beauty Menu
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold">
            Curated Nail Care & Beauty Catalog
          </h2>
          <p className="text-sm text-pink-100/80 mt-1 font-normal">
            From precision Russian manicures to avant-garde 3D Japanese gel art — browse treatments and reserve appointments for direct in-salon service & in-store settlement.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'bg-pink-50 text-gray-700 hover:bg-pink-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-pink-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search treatments..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-pink-50/40 border border-pink-200 text-xs focus:outline-pink-500"
          />
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading beauty services...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          No services match your current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8">
          {filtered.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-3xl border border-pink-100 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
            >
              <div className="relative h-44 bg-pink-50 overflow-hidden">
                {service.image_url ? (
                  <img
                    src={service.image_url || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80'}
                    alt={service.service_name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-pink-400" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-pink-800 shadow-xs">
                    {service.category}
                  </span>
                  {service.difficulty_level && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                      {service.difficulty_level}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 bg-pink-950/85 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold shadow-md flex items-center gap-1.5 border border-white/20">
                  <span className="text-pink-200">₱{Number(service.price || 0).toLocaleString()}</span>
                  <span className="text-[10px] text-pink-100/80 font-normal">· Pay In-Store</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-serif font-bold text-gray-900 group-hover:text-pink-700 transition-colors line-clamp-1">
                    {service.service_name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-pink-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-pink-500" />
                      <span>{service.duration || 45} mins</span>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="font-bold text-pink-700 text-sm">₱{Number(service.price || 0).toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => onBookService(service)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Service</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
