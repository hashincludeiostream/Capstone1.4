import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  Filter,
  Star,
  Phone,
  Clock,
  Compass,
  ExternalLink,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  X,
  Car,
  Building,
  LocateFixed,
} from 'lucide-react';
import { Salon } from '../../types';
import { calculateDistanceKm, getOpenStreetMapDirectionsUrl } from '../../utils/geoUtils';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
// @ts-ignore - CSS import for Leaflet
import 'leaflet/dist/leaflet.css';

// Extend react-leaflet types to include missing properties
declare module 'react-leaflet' {
  interface MarkerProps {
    icon?: any;
    draggable?: boolean;
  }
  interface TileLayerProps {
    attribution?: string;
  }
  interface MapContainerProps {
    center?: [number, number];
    zoom?: number;
  }
}

// Fix for default marker icons in Leaflet
const defaultIcon = L.icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

// Custom icon for selected salon
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${isSelected ? '#ec4899' : '#3b82f6'};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isSelected ? 'transform: scale(1.2);' : ''}
      ">
        <span style="color: white; font-size: 14px;">💅</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// User location icon
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      background-color: #10b981;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="color: white; font-size: 12px;">📍</span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Component to update map view when center changes
function MapViewUpdater({ center, zoom }: { center: { lat: number; lng: number }; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center, zoom, map]);
  return null;
}

interface StoreLocationsMapProps {
  salons: Salon[];
  selectedSalonId?: number | null;
  onSelectSalon?: (salon: Salon) => void;
  onBookSalon?: (salon: Salon) => void;
  onViewSalonDetails?: (salon: Salon) => void;
  className?: string;
}

export const StoreLocationsMap: React.FC<StoreLocationsMapProps> = ({
  salons,
  selectedSalonId,
  onSelectSalon,
  onBookSalon,
  onViewSalonDetails,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSalon, setActiveSalon] = useState<Salon | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const [zoomLevel, setZoomLevel] = useState(13);

  // Initialize active salon from prop or first salon
  useEffect(() => {
    if (selectedSalonId) {
      const found = salons.find((s) => s.id === selectedSalonId);
      if (found) setActiveSalon(found);
    } else if (!activeSalon && salons.length > 0) {
      setActiveSalon(salons[0]);
    }
  }, [selectedSalonId, salons]);

  // Unique cities list
  const cities = useMemo(() => {
    const set = new Set<string>();
    salons.forEach((s) => {
      if (s.city) set.add(s.city);
      else if (s.address) {
        if (s.address.includes('Taguig') || s.address.includes('BGC')) set.add('Taguig');
        else if (s.address.includes('Quezon City') || s.address.includes('QC')) set.add('Quezon City');
        else if (s.address.includes('Makati')) set.add('Makati');
        else if (s.address.includes('Mandaluyong')) set.add('Mandaluyong');
        else if (s.address.includes('Cebu')) set.add('Cebu City');
        else if (s.address.includes('Davao')) set.add('Davao City');
      }
    });
    return Array.from(set);
  }, [salons]);

  // Handle GPS location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError('Unable to retrieve your location. Showing standard Metro Manila salons.');
      },
      { timeout: 8000 }
    );
  };

  // Filter salons with computed distances
  const filteredSalons = useMemo(() => {
    return salons
      .filter((s) => {
        // Search query matching
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          !q ||
          s.salon_name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          (s.city && s.city.toLowerCase().includes(q)) ||
          (s.landmark && s.landmark.toLowerCase().includes(q));

        // City filter
        const matchesCity =
          selectedCity === 'all' ||
          s.city?.toLowerCase() === selectedCity.toLowerCase() ||
          s.address.toLowerCase().includes(selectedCity.toLowerCase());

        // Category filter
        const matchesCategory =
          selectedCategory === 'all' ||
          (s.category_name && s.category_name.toLowerCase().includes(selectedCategory.toLowerCase()));

        return matchesQuery && matchesCity && matchesCategory;
      })
      .map((s) => {
        const lat = s.latitude || 14.5505;
        const lng = s.longitude || 121.0509;
        let distance: number | undefined = undefined;
        if (userLocation) {
          distance = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
        }
        return { ...s, distance };
      })
      .sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      });
  }, [salons, searchQuery, selectedCity, selectedCategory, userLocation]);

  // Center coordinates on active salon or default to Metro Manila
  const currentCenter = useMemo(() => {
    if (activeSalon?.latitude && activeSalon?.longitude) {
      return { lat: activeSalon.latitude, lng: activeSalon.longitude };
    }
    return { lat: 14.5995, lng: 120.9842 }; // Metro Manila Center
  }, [activeSalon]);

  // Tile layer URL based on map style
  const tileLayerUrl = mapStyle === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className={`bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Top Header & Search Controls */}
      <div className="p-4 sm:p-5 border-b border-pink-100 bg-gradient-to-r from-pink-50/70 via-rose-50/40 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-pink-600 text-white shadow-xs">
                <MapPin className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900">
                  Salon Store Locator & Live Map
                </h2>
                <p className="text-xs text-gray-500">
                  Find nearest certified luxury nail studios, explore locations, and navigate directly.
                </p>
              </div>
            </div>
          </div>

          {/* Quick GPS Locator & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                userLocation
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-white border-pink-200 text-pink-700 hover:bg-pink-50 shadow-xs'
              }`}
              title="Locate salons near your current GPS position"
            >
              <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin text-pink-600' : ''}`} />
              <span>{isLocating ? 'Locating...' : userLocation ? 'GPS Located' : 'Salons Near Me'}</span>
            </button>

            {/* Map Theme Toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              <button
                onClick={() => setMapStyle('street')}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  mapStyle === 'street'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Street
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                  mapStyle === 'satellite'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by salon name, mall, street or landmark..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-pink-200/80 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-white border border-pink-200/80 text-xs text-gray-700 focus:outline-none focus:border-pink-500 shadow-xs cursor-pointer"
            >
              <option value="all">All Metro Cities ({salons.length})</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-white border border-pink-200/80 text-xs text-gray-700 focus:outline-none focus:border-pink-500 shadow-xs cursor-pointer"
            >
              <option value="all">All Nail Service Types</option>
              <option value="Nail Services">Nail Care & Gel Art</option>
              <option value="Nail Art">Nail Art</option>
              <option value="Manicure">Manicure</option>
              <option value="Pedicure">Pedicure</option>
              <option value="Nail Extensions">Nail Extensions</option>
              <option value="Gel Polish">Gel Polish</option>
              <option value="Nail Care">Nail Care</option>
              <option value="Nail Design">Nail Design</option>
            </select>
          </div>
        </div>

        {locationError && (
          <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">
            {locationError}
          </p>
        )}
      </div>

      {/* Main Map + Store Directory Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] relative">
        {/* LEFT COLUMN: Store Cards List (4 cols) */}
        <div className="lg:col-span-4 border-r border-pink-100 flex flex-col bg-gray-50/50 max-h-[620px] overflow-y-auto order-2 lg:order-1">
          <div className="p-3 bg-white border-b border-pink-100 flex items-center justify-between sticky top-0 z-10">
            <span className="text-xs font-bold text-gray-700">
              Showing {filteredSalons.length} {filteredSalons.length === 1 ? 'Location' : 'Locations'}
            </span>
            {userLocation && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Sorted by Proximity
              </span>
            )}
          </div>

          <div className="p-3 space-y-2.5 flex-1">
            {filteredSalons.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-600">No studios found</p>
                <p className="text-[11px] text-gray-400 mt-1">Try broadening your search or city filter</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('all');
                    setSelectedCategory('all');
                  }}
                  className="mt-3 px-3 py-1 text-xs text-pink-600 font-semibold border border-pink-200 rounded-lg hover:bg-pink-50"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredSalons.map((salon) => {
                const isSelected = activeSalon?.id === salon.id;
                return (
                  <div
                    key={salon.id}
                    onClick={() => {
                      setActiveSalon(salon);
                      if (onSelectSalon) onSelectSalon(salon);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-white border-pink-500 shadow-md ring-2 ring-pink-500/20'
                        : 'bg-white border-pink-100/80 hover:border-pink-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={salon.logo}
                        alt={salon.salon_name}
                        className="w-12 h-12 rounded-xl object-cover border border-pink-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {salon.salon_name}
                          </h4>
                          {salon.distance !== undefined && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                              {salon.distance} km away
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500">
                          <div className="flex items-center text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                            <span>{Number(salon.avg_rating || 0).toFixed(1)}</span>
                          </div>
                          <span>•</span>
                          <span className="truncate">{salon.category_name || 'Nail Studio'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-600 flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-pink-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{salon.address}</span>
                    </div>

                    {salon.landmark && (
                      <div className="text-[10px] text-purple-900 bg-purple-50/70 px-2 py-1 rounded-lg border border-purple-100 flex items-center gap-1">
                        <Building className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="truncate">Landmark: {salon.landmark}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-1">
                      <a
                        href={getOpenStreetMapDirectionsUrl(
                          salon.latitude || 14.5505,
                          salon.longitude || 121.0509,
                          salon.salon_name
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-pink-600" />
                        <span>Directions</span>
                      </a>

                      {onViewSalonDetails && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewSalonDetails(salon);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-[11px] font-semibold transition-colors"
                        >
                          Details
                        </button>
                      )}

                      {onBookSalon && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookSalon(salon);
                          }}
                          className="ml-auto px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-xs"
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Visual Map Stage (8 cols) */}
        <div className="lg:col-span-8 relative overflow-hidden bg-slate-900 flex flex-col order-1 lg:order-2 min-h-[420px] lg:min-h-[580px]">
          {/* Leaflet Map Component */}
          <MapContainer
            center={[currentCenter.lat, currentCenter.lng] as [number, number]}
            zoom={zoomLevel}
            style={{ width: '100%', height: '100%' }}
            className="z-0"
          >
            <TileLayer
              url={tileLayerUrl}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapViewUpdater center={currentCenter} zoom={zoomLevel} />

            {/* User location marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng] as [number, number]}
                icon={userLocationIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <strong>Your Location</strong>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Salon markers */}
            {filteredSalons.map((salon) => {
              const lat = salon.latitude || 14.5505;
              const lng = salon.longitude || 121.0509;
              const isSelected = activeSalon?.id === salon.id;

              return (
                <Marker
                  key={salon.id}
                  position={[lat, lng] as [number, number]}
                  icon={createCustomIcon(isSelected)}
                  eventHandlers={{
                    click: () => {
                      setActiveSalon(salon);
                      if (onSelectSalon) onSelectSalon(salon);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs min-w-[200px]">
                      <div className="font-bold text-gray-900 mb-1">{salon.salon_name}</div>
                      <div className="text-gray-600 mb-1">{salon.address}</div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{Number(salon.avg_rating || 0).toFixed(1)}</span>
                      </div>
                      <div className="mt-2 text-pink-600 font-semibold">{salon.category_name || 'Nail Studio'}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};