import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, X, RefreshCw, Check, ArrowRight } from 'lucide-react';
import { fetchServiceCategories, DistinctServiceCategory } from '../lib/api';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string | null, matchingSalonIds: number[]) => void;
  totalSalonsCount?: number;
  filteredSalonsCount?: number;
  className?: string;
  onExploreAll?: () => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  totalSalonsCount = 0,
  filteredSalonsCount,
  className = '',
  onExploreAll,
}) => {
  const [categories, setCategories] = useState<DistinctServiceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServiceCategories();
      setCategories(data);
    } catch (err: any) {
      console.warn('Failed to load service categories:', err);
      setError('Unable to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCategoryClick = (cat: DistinctServiceCategory) => {
    if (selectedCategory === cat.category_name) {
      // Toggle off -> reset to all
      onSelectCategory(null, []);
    } else {
      onSelectCategory(cat.category_name, cat.salon_ids);
    }
  };

  const handleReset = () => {
    onSelectCategory(null, []);
  };

  const activeCategoryObj = categories.find((c) => c.category_name === selectedCategory);

  return (
    <div
      className={`bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-pink-100 shadow-xs p-4 sm:p-5 transition-all ${className}`}
      id="service-category-filter"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
                Filter by Service Specialty
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-pink-700 border border-pink-200/70">
                <Sparkles className="w-2.5 h-2.5 text-pink-500" />
                Live Categories
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Tap a treatment style to filter studios offering that service
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCategory && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100 rounded-lg border border-pink-200 transition cursor-pointer"
              title="Reset category filter"
            >
              <X className="w-3 h-3" />
              <span>Reset filter</span>
            </button>
          )}

          {error && (
            <button
              type="button"
              onClick={loadCategories}
              className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-pink-600 transition"
              title="Retry fetching categories"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories chips container */}
      <div className="relative">
        {loading ? (
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar animate-pulse">
            <div className="h-9 w-28 rounded-xl bg-pink-100/60 shrink-0" />
            <div className="h-9 w-32 rounded-xl bg-pink-100/50 shrink-0" />
            <div className="h-9 w-24 rounded-xl bg-pink-100/40 shrink-0" />
            <div className="h-9 w-36 rounded-xl bg-pink-100/50 shrink-0" />
            <div className="h-9 w-28 rounded-xl bg-pink-100/40 shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
            {/* "All" button */}
            <button
              type="button"
              onClick={handleReset}
              className={`group px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xs font-bold scale-[1.02]'
                  : 'bg-pink-50/80 text-gray-700 hover:bg-pink-100/80 hover:text-pink-900 border border-pink-100 font-medium hover:border-pink-200'
              }`}
            >
              <span>✨</span>
              <span>All Specialties</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  selectedCategory === null
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-gray-500 group-hover:text-pink-700 shadow-2xs'
                }`}
              >
                {totalSalonsCount}
              </span>
            </button>

            {/* Distinct service category chips */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.category_name;
              return (
                <button
                  key={cat.category_name}
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  className={`group px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xs font-bold ring-2 ring-pink-300/60 scale-[1.02]'
                      : 'bg-pink-50/80 text-gray-700 hover:bg-pink-100/80 hover:text-pink-900 border border-pink-100 font-medium hover:border-pink-200'
                  }`}
                >
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span>{cat.category_name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-white text-gray-500 group-hover:text-pink-700 shadow-2xs'
                    }`}
                    title={`${cat.salon_ids.length} studios offer ${cat.category_name} (${cat.count} total services)`}
                  >
                    {cat.salon_ids.length > 0 ? `${cat.salon_ids.length} studios` : `${cat.count}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active filter summary pill */}
      {selectedCategory && (
        <div className="mt-3 pt-3 border-t border-pink-100/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Showing studios offering{' '}
              <strong className="text-pink-700 font-bold">
                {activeCategoryObj?.icon} {selectedCategory}
              </strong>
            </span>
            {filteredSalonsCount !== undefined && (
              <span className="text-gray-500">
                ({filteredSalonsCount} {filteredSalonsCount === 1 ? 'studio matches' : 'studios match'})
              </span>
            )}
          </div>

          {onExploreAll && (
            <button
              type="button"
              onClick={onExploreAll}
              className="text-pink-700 hover:text-pink-900 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Explore all studios on map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
