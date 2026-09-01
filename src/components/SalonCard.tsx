import React from 'react';
import { Star, MapPin, Phone, Calendar, ArrowRight, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { Salon } from '../types';

interface SalonCardProps {
  salon: Salon;
  onSelect: (salon: Salon) => void;
  onBook: (salon: Salon) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (salonId: number) => void;
}

export const SalonCard: React.FC<SalonCardProps> = ({
  salon,
  onSelect,
  onBook,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Cover / Image Header */}
      <div className="relative h-48 overflow-hidden bg-pink-50">
        <img
          src={salon.banner || salon.logo}
          alt={salon.salon_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Favorite Pin Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(salon.id);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-rose-600 transition-colors shadow-sm cursor-pointer"
            title="Save to favorites"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}

        {/* Category & Verified Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-pink-800 shadow-xs">
            {salon.category_name || 'Nail Studio'}
          </span>
          {salon.featured && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
        </div>

        {/* Salon Logo Overlay */}
        <div className="absolute -bottom-4 left-4 w-12 h-12 rounded-xl bg-white p-0.5 shadow-md border border-pink-100 overflow-hidden">
          <img
            src={salon.logo}
            alt="logo"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        {/* Rating Floating Tag */}
        <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-semibold">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{Number(salon.avg_rating || 0).toFixed(1)}</span>
          <span className="text-white/60 text-[10px]">({salon.review_count})</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 pt-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3
              onClick={() => onSelect(salon)}
              className="text-lg font-serif font-bold text-gray-900 group-hover:text-pink-700 transition-colors cursor-pointer line-clamp-1"
            >
              {salon.salon_name}
            </h3>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {salon.description}
          </p>

          <div className="space-y-1.5 text-xs text-gray-600 mb-4">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{salon.address}</span>
            </div>
            {salon.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span>{salon.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-pink-50 flex items-center gap-2">
          <button
            onClick={() => onSelect(salon)}
            className="flex-1 py-2 px-3 rounded-xl border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-semibold transition-colors text-center cursor-pointer"
          >
            View Details
          </button>
          <button
            onClick={() => onBook(salon)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-semibold transition-all shadow-sm shadow-pink-500/20 text-center flex items-center justify-center gap-1 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
