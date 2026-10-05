import React from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { BusinessCategory } from '../types';

interface HeroSectionProps {
  categories: BusinessCategory[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenBooking: () => void;
  className?: string;
  hideCategories?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onOpenBooking,
  className = '',
  hideCategories = false,
}) => {
  return (
    <div className={`bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-pink-100/90 shadow-xs p-3.5 sm:p-4 mb-4 transition-all ${className}`}>
      {/* Search Bar & Book Now Action */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex items-center gap-2.5 px-3.5 py-1.5 flex-1 w-full bg-pink-50/50 hover:bg-pink-50/80 focus-within:bg-white rounded-xl sm:rounded-2xl border border-pink-200/80 focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-200/60 transition-all text-gray-800">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 shrink-0" />
          <input
            type="text"
            id="hero-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search salons, nail art, or location..."
            className="w-full bg-transparent border-none text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-hidden py-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-xs text-gray-400 hover:text-gray-700 bg-gray-200/60 hover:bg-gray-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              title="Clear search"
            >
              <X className="w-3 h-3" />
              <span className="hidden xs:inline">Clear</span>
            </button>
          )}
        </div>

        <button
          id="hero-book-now-btn"
          type="button"
          onClick={onOpenBooking}
          className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 active:scale-[0.99] text-white text-sm font-semibold px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all shadow-sm shadow-pink-600/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer min-h-[42px]"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Now</span>
        </button>
      </div>

      {/* Category Filters Bar (Optional) */}
      {!hideCategories && (
        <div className="mt-3 pt-3 border-t border-pink-100/70">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedCategory === null
                  ? 'bg-pink-600 text-white shadow-xs font-bold'
                  : 'bg-pink-50/80 text-gray-700 hover:bg-pink-100/70 hover:text-pink-900 border border-pink-100/80 font-medium'
              }`}
            >
              <span>✨ All Categories</span>
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-pink-600 text-white shadow-xs font-bold'
                      : 'bg-pink-50/80 text-gray-700 hover:bg-pink-100/70 hover:text-pink-900 border border-pink-100/80 font-medium'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.category_name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
