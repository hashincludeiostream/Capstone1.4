import React from 'react';
import { Heart } from 'lucide-react';
import { Salon } from '../types';
import { SalonCard } from './SalonCard';

interface FavoritesViewProps {
  salons: Salon[];
  favoriteSalonIds: number[];
  onSelectSalon: (salon: Salon) => void;
  onBookSalon: (salon: Salon) => void;
  onToggleFavorite: (salonId: number) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  salons,
  favoriteSalonIds,
  onSelectSalon,
  onBookSalon,
  onToggleFavorite,
}) => {
  const favoriteSalons = favoriteSalonIds
    .map((salonId) => salons.find((salon) => salon.id === salonId))
    .filter((salon): salon is Salon => Boolean(salon));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">Favorite Salons</h1>
          <p className="text-sm text-gray-500">Your saved salons in one place.</p>
        </div>
      </div>

      {favoriteSalons.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-pink-100 shadow-xs">
          <Heart className="w-10 h-10 text-pink-300 mx-auto mb-3" />
          <h2 className="text-lg font-serif font-bold text-gray-900">No favorite salons yet</h2>
          <p className="text-sm text-gray-500 mt-1">Tap the heart on a salon card to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {favoriteSalons.map((salon) => (
            <SalonCard
              key={salon.id}
              salon={salon}
              onSelect={onSelectSalon}
              onBook={onBookSalon}
              isFavorite
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};