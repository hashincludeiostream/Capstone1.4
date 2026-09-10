import React from 'react';
import { Search, Sparkles, MapPin, Calendar, Star, ShieldCheck, Heart } from 'lucide-react';
import { BusinessCategory } from '../types';

interface HeroSectionProps {
  categories: BusinessCategory[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenBooking: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenBooking,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-900 via-rose-900 to-purple-950 text-white shadow-xl mb-8">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-pink-200 text-xs font-semibold uppercase tracking-wider mb-5 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Curated Beauty & Nail Sanctuaries</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight mb-4">
          Discover, Inspire & Book <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200 bg-clip-text text-transparent italic font-serif">
            Extraordinary Nail Art
          </span>
        </h1>

        <p className="text-sm sm:text-base text-pink-100/80 max-w-2xl mx-auto mb-8 font-normal">
          Explore premier verified salons, Pinterest-trending nail aesthetics, Russian manicures, and seamless online scheduling.
        </p>

        {/* Search Bar Container */}
        <div className="bg-white p-2 rounded-2xl shadow-2xl max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-2 border border-pink-100">
          <div className="flex items-center gap-2.5 px-3 flex-1 w-full text-gray-800">
            <Search className="w-5 h-5 text-pink-500 shrink-0" />
            <input
              type="text"
              id="hero-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by salon name, nail art style, or location..."
              className="w-full bg-transparent border-none text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden py-2"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-xs text-gray-400 hover:text-gray-700 px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            id="hero-book-now-btn"
            onClick={onOpenBooking}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-pink-600/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Now</span>
          </button>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto mt-8 pt-6 border-t border-white/10 text-center">
          <div>
            <p className="text-xl sm:text-2xl font-bold font-serif text-pink-200">24/7</p>
            <p className="text-[11px] text-pink-100/70 font-medium">Direct Booking</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-serif text-pink-200">100%</p>
            <p className="text-[11px] text-pink-100/70 font-medium">Accredited</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-serif text-pink-200">Verified</p>
            <p className="text-[11px] text-pink-100/70 font-medium">Safety Standard</p>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="bg-black/30 backdrop-blur-md px-4 py-3 border-t border-white/10 overflow-x-auto">
        <div className="flex items-center justify-start sm:justify-center gap-2 min-w-max">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === null
                ? 'bg-white text-pink-900 shadow-md'
                : 'bg-white/10 text-pink-100 hover:bg-white/20'
            }`}
          >
            ✨ All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white/10 text-pink-100 hover:bg-white/20'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.category_name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
