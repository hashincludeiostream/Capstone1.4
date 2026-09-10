import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Search,
  Star,
  Building,
  LocateFixed,
  Route,
  X,
  Navigation,
  List,
  Map as MapIcon,
  ArrowUpRight,
  SlidersHorizontal,
  Compass,
  Maximize2,
} from 'lucide-react';
import { Salon } from '../../types';
import { calculateDistanceKm } from '../../utils/geoUtils';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
// CSS import for Leaflet
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

// Custom icon for selected salon with rating badge and glowing effect
const createCustomIcon = (isSelected: boolean, rating?: number) => {
  const ratingText = rating && Number(rating) > 0 ? Number(rating).toFixed(1) : '';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      ">
        <div style="
          background: ${isSelected ? 'linear-gradient(135deg, #ec4899, #be185d)' : '#ffffff'};
          color: ${isSelected ? '#ffffff' : '#db2777'};
          width: ${isSelected ? '38px' : '32px'};
          height: ${isSelected ? '38px' : '32px'};
          border-radius: 50%;
          border: 3px solid ${isSelected ? '#fbcfe8' : '#f43f5e'};
          box-shadow: 0 4px 14px rgba(0,0,0,0.3)${isSelected ? ', 0 0 0 5px rgba(236,72,153,0.35)' : ''};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <span style="font-size: ${isSelected ? '16px' : '13px'}; line-height: 1;">💅</span>
        </div>
        ${ratingText ? `
          <div style="
            position: absolute;
            bottom: -9px;
            background: #0f172a;
            color: #fbbf24;
            font-size: 10px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 9999px;
            white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            gap: 2px;
          ">
            ★ ${ratingText}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [38, 48],
    iconAnchor: [19, 24],
    popupAnchor: [0, -26],
  });
};

// User location icon with prominent 'You are here' badge and animated pulse ring
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    ">
      <!-- Visible badge above marker -->
      <div style="
        position: absolute;
        bottom: 30px;
        background: #065f46;
        color: #ecfdf5;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        padding: 3px 8px;
        border-radius: 9999px;
        white-space: nowrap;
        box-shadow: 0 3px 10px rgba(0,0,0,0.35);
        border: 1.5px solid #6ee7b7;
        display: flex;
        align-items: center;
        gap: 4px;
        pointer-events: none;
      ">
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #34d399;"></span>
        You are here
      </div>
      <!-- Animated pulse ring -->
      <div style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: rgba(16, 185, 129, 0.4);
        animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <!-- Center pin icon -->
      <div style="
        background: linear-gradient(135deg, #10b981, #047857);
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 2;
      ">
        <span style="color: white; font-size: 13px; line-height: 1;">📍</span>
      </div>
    </div>
  `,
  iconSize: [40, 52],
  iconAnchor: [20, 26],
  popupAnchor: [0, -28],
});

const DAVAO_CENTER = { lat: 7.0731, lng: 125.6128 };
const isDavaoSalon = (salon: Salon) => {
  const latitude = Number(salon.latitude);
  const longitude = Number(salon.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return latitude >= 6.7 && latitude <= 7.7 && longitude >= 125.2 && longitude <= 126.2;
  }

  const locationText = `${salon.city || ''} ${salon.address || ''} ${salon.province || ''}`.toLowerCase();
  return locationText.includes('davao');
};

const getValidCoordinates = (salon: Salon): [number, number] | null => {
  if (!salon) return null;
  if (salon.latitude === undefined || salon.latitude === null || (salon.latitude as any) === '') return null;
  if (salon.longitude === undefined || salon.longitude === null || (salon.longitude as any) === '') return null;

  const latitude = typeof salon.latitude === 'number' ? salon.latitude : parseFloat(String(salon.latitude).trim());
  const longitude = typeof salon.longitude === 'number' ? salon.longitude : parseFloat(String(salon.longitude).trim());

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || isNaN(latitude) || isNaN(longitude)) return null;
  // Ignore (0, 0) Null Island coordinates
  if (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return [latitude, longitude];
};

// Component to smoothly fly/pan map camera or fit all pins into view
function MapViewUpdater({
  center,
  zoom,
  activeCoordinates,
  fitBoundsTarget,
}: {
  center?: { lat?: number | null; lng?: number | null } | null;
  zoom?: number;
  activeCoordinates?: [number, number] | null;
  fitBoundsTarget?: { bounds: [number, number][]; timestamp: number } | null;
}) {
  const map = useMap();
  const lastFitBoundsTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!map) return;

    // 1. If fitBoundsTarget is triggered, zoom out and frame all specified coordinates (e.g. user pin + all salons)
    if (
      fitBoundsTarget &&
      fitBoundsTarget.timestamp !== lastFitBoundsTimestampRef.current &&
      Array.isArray(fitBoundsTarget.bounds) &&
      fitBoundsTarget.bounds.length > 0
    ) {
      lastFitBoundsTimestampRef.current = fitBoundsTarget.timestamp;
      try {
        const validCoords = fitBoundsTarget.bounds.filter(
          (pt) =>
            Array.isArray(pt) &&
            pt.length >= 2 &&
            typeof pt[0] === 'number' &&
            typeof pt[1] === 'number' &&
            Number.isFinite(pt[0]) &&
            Number.isFinite(pt[1]) &&
            !isNaN(pt[0]) &&
            !isNaN(pt[1]) &&
            pt[0] >= -90 &&
            pt[0] <= 90 &&
            pt[1] >= -180 &&
            pt[1] <= 180
        );

        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords as [number, number][]);
          map.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 14,
            animate: true,
            duration: 0.9,
          });
          return;
        }
      } catch (err) {
        console.warn('Map fitBounds failed:', err);
      }
    }

    // 2. If activeCoordinates are valid finite numbers, smoothly fly to them
    if (
      Array.isArray(activeCoordinates) &&
      activeCoordinates.length >= 2 &&
      typeof activeCoordinates[0] === 'number' &&
      typeof activeCoordinates[1] === 'number' &&
      Number.isFinite(activeCoordinates[0]) &&
      Number.isFinite(activeCoordinates[1]) &&
      !isNaN(activeCoordinates[0]) &&
      !isNaN(activeCoordinates[1]) &&
      activeCoordinates[0] >= -90 &&
      activeCoordinates[0] <= 90 &&
      activeCoordinates[1] >= -180 &&
      activeCoordinates[1] <= 180
    ) {
      try {
        map.flyTo([activeCoordinates[0], activeCoordinates[1]], 15, {
          animate: true,
          duration: 0.8,
        });
        return;
      } catch (err) {
        console.warn('Map flyTo failed:', err);
      }
    }

    // 3. Fall back to center coordinates with strict finite number validation
    const lat = Number(center?.lat);
    const lng = Number(center?.lng);
    const safeZoom = typeof zoom === 'number' && Number.isFinite(zoom) && zoom > 0 ? zoom : 13;

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      try {
        map.setView([lat, lng], safeZoom);
      } catch (err) {
        console.warn('Map setView failed:', err);
      }
    } else {
      // Safe ultimate fallback: Davao City Center
      try {
        map.setView([DAVAO_CENTER.lat, DAVAO_CENTER.lng], 13);
      } catch (err) {
        console.warn('Default map setView failed:', err);
      }
    }
  }, [center?.lat, center?.lng, zoom, activeCoordinates, fitBoundsTarget, map]);

  return null;
}

// Component to handle routing directions with real road geometry & fallback
function RouteLine({
  userLocation,
  salonLocation,
  onRouteCalculated,
}: {
  userLocation: { lat: number; lng: number } | null;
  salonLocation: { lat: number; lng: number } | null;
  onRouteCalculated?: (distance: number, duration: number) => void;
}) {
  const map = useMap();
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (
      !userLocation ||
      !salonLocation ||
      !Number.isFinite(userLocation.lat) ||
      !Number.isFinite(userLocation.lng) ||
      !Number.isFinite(salonLocation.lat) ||
      !Number.isFinite(salonLocation.lng) ||
      isNaN(userLocation.lat) ||
      isNaN(userLocation.lng) ||
      isNaN(salonLocation.lat) ||
      isNaN(salonLocation.lng)
    ) {
      setRoutePoints([]);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchRoute = async () => {
      const fallbackPoints: [number, number][] = [
        [userLocation.lat, userLocation.lng],
        [salonLocation.lat, salonLocation.lng],
      ];

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${salonLocation.lng},${salonLocation.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('OSRM routing request returned non-200');
        const data = await res.json();

        if (isMounted && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates
            .filter((pt: any) => Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1]))
            .map((pt: [number, number]) => [pt[1], pt[0]] as [number, number]);

          if (coords.length > 0) {
            setRoutePoints(coords);
            if (onRouteCalculated) {
              onRouteCalculated(route.distance, route.duration);
            }
            if (map) {
              try {
                const bounds = L.latLngBounds(coords);
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
              } catch (e) {
                console.warn('fitBounds error:', e);
              }
            }
            return;
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        // Fallback to straight line if OSRM is blocked, offline, or rate limited
      }

      if (isMounted) {
        setRoutePoints(fallbackPoints);
        const distKm = calculateDistanceKm(
          userLocation.lat,
          userLocation.lng,
          salonLocation.lat,
          salonLocation.lng
        );
        const distMeters = distKm * 1000;
        const estDurationSeconds = Math.round((distKm / 28) * 3600); // ~28 km/h city average
        if (onRouteCalculated) {
          onRouteCalculated(distMeters, estDurationSeconds);
        }
        if (map) {
          try {
            const bounds = L.latLngBounds(fallbackPoints);
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
          } catch (e) {
            console.warn('fitBounds error:', e);
          }
        }
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userLocation?.lat, userLocation?.lng, salonLocation?.lat, salonLocation?.lng, map, onRouteCalculated]);

  if (routePoints.length === 0) return null;

  return (
    <Polyline
      positions={routePoints}
      pathOptions={{
        color: '#ec4899',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  );
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
  const [showDirections, setShowDirections] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [distanceFilter, setDistanceFilter] = useState<'all' | '5' | '10'>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<number | null>(null);
  const [activeCoordinates, setActiveCoordinates] = useState<[number, number] | null>(null);
  const [fitBoundsTarget, setFitBoundsTarget] = useState<{ bounds: [number, number][]; timestamp: number } | null>(null);
  const availableSalons = useMemo(() => salons, [salons]);

  // Compute active salon distance from user if GPS is available
  const activeDistance = useMemo(() => {
    if (!userLocation || !activeCoordinates) return undefined;
    return calculateDistanceKm(userLocation.lat, userLocation.lng, activeCoordinates[0], activeCoordinates[1]);
  }, [userLocation, activeCoordinates]);

  // Sync active salon ONLY when selectedSalonId prop is provided or changes
  useEffect(() => {
    if (selectedSalonId !== undefined && selectedSalonId !== null) {
      const selectedSalon = salons.find((salon) => String(salon.id) === String(selectedSalonId));
      if (selectedSalon) {
        setActiveSalon(selectedSalon);
        const coords = getValidCoordinates(selectedSalon);
        setActiveCoordinates(coords);
      }
    }
  }, [selectedSalonId, salons]);

  // Unique cities list
  const cities = useMemo(() => {
    const set = new Set<string>();
    availableSalons.forEach((s) => {
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
  }, [availableSalons]);

  // Handle directions toggle for a specific salon (from card or floating preview)
  const triggerDirectionsForSalon = (targetSalon: Salon) => {
    const coords = getValidCoordinates(targetSalon);
    if (!coords) {
      setLocationError('This salon has no valid map coordinates.');
      return;
    }

    // If directions are already active for THIS salon, toggle off
    if (showDirections && activeSalon && String(activeSalon.id) === String(targetSalon.id)) {
      setShowDirections(false);
      setRouteInfo(null);
      return;
    }

    // Set this salon as active
    setActiveSalon(targetSalon);
    setActiveCoordinates(coords);

    // Switch to map view on mobile so user sees the route immediately
    setMobileView('map');

    // If userLocation is already available, turn on directions
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      setShowDirections(true);
      return;
    }

    // If user location not set yet, obtain GPS or fallback
    setIsLocating(true);
    setLocationError(null);

    const applyFallbackAndShowRoute = (msg?: string) => {
      const fallbackLoc = { lat: 7.0720, lng: 125.6090 };
      setUserLocation(fallbackLoc);
      setIsLocating(false);
      if (msg) setLocationError(msg);
      setShowDirections(true);
    };

    if (!navigator.geolocation) {
      applyFallbackAndShowRoute('Using Davao City center (geolocation not supported).');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
        setShowDirections(true);
      },
      () => {
        applyFallbackAndShowRoute('GPS not available. Directions routed from central Davao City.');
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  };

  // Handle directions toggle from header
  const handleToggleDirections = () => {
    if (!activeSalon) {
      setLocationError('Please select a salon first to view directions.');
      return;
    }
    triggerDirectionsForSalon(activeSalon);
  };

  // Handle route calculated callback
  const handleRouteCalculated = (distance: number, duration: number) => {
    setRouteInfo({
      distance: Math.round(distance / 1000 * 10) / 10, // Convert to km, round to 1 decimal
      duration: Math.round(duration / 60), // Convert to minutes
    });
  };

  // Filter salons with computed distances and quick-filters
  const filteredSalons = useMemo(() => {
    return availableSalons
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
        const coordinates = getValidCoordinates(s);
        const lat = coordinates?.[0];
        const lng = coordinates?.[1];
        let distance: number | undefined = undefined;
        if (userLocation && coordinates && lat !== undefined && lng !== undefined) {
          distance = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
        }
        return { ...s, distance, coordinates };
      })
      .filter((s) => {
        // Distance quick-filter
        if (distanceFilter !== 'all') {
          const maxDist = Number(distanceFilter);
          if (s.distance === undefined || s.distance > maxDist) return false;
        }

        // Min rating filter
        if (minRatingFilter !== null) {
          if (Number(s.avg_rating || 0) < minRatingFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      });
  }, [availableSalons, searchQuery, selectedCity, selectedCategory, userLocation, distanceFilter, minRatingFilter]);

  // Zoom out and adjust map camera so both user location pin and all salon pins are visible
  const fitUserAndSalonsView = (customUserLoc?: { lat: number; lng: number } | null) => {
    const loc = customUserLoc !== undefined ? customUserLoc : userLocation;
    const points: [number, number][] = [];

    // Include user pin if valid
    if (
      loc &&
      Number.isFinite(loc.lat) &&
      Number.isFinite(loc.lng) &&
      !isNaN(loc.lat) &&
      !isNaN(loc.lng)
    ) {
      points.push([loc.lat, loc.lng]);
    }

    // Include all visible salon pins
    const targetSalons = filteredSalons.length > 0 ? filteredSalons : availableSalons;
    targetSalons.forEach((s) => {
      const coords = getValidCoordinates(s);
      if (
        coords &&
        Number.isFinite(coords[0]) &&
        Number.isFinite(coords[1]) &&
        !isNaN(coords[0]) &&
        !isNaN(coords[1])
      ) {
        points.push([coords[0], coords[1]]);
      }
    });

    if (points.length > 0) {
      // Clear active single salon so the camera doesn't immediately snap back to a single card
      setActiveSalon(null);
      setActiveCoordinates(null);
      setFitBoundsTarget({
        bounds: points,
        timestamp: Date.now(),
      });
    }
  };

  // Handle "Salons Near Me" button click
  const handleLocateMe = () => {
    // Switch to map view on mobile so user sees the camera zoom out immediately
    setMobileView('map');

    // If user position is already established, zoom out & frame all pins right away
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      if (distanceFilter !== 'all') {
        setDistanceFilter('all');
      }
      fitUserAndSalonsView(userLocation);
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    const applyFallbackLocation = (reasonMsg: string) => {
      // Graceful fallback to central Davao City near downtown salons
      const fallbackLoc = { lat: 7.0720, lng: 125.6090 };
      setUserLocation(fallbackLoc);
      setIsLocating(false);
      setLocationError(reasonMsg);
      fitUserAndSalonsView(fallbackLoc);
    };

    if (!navigator.geolocation) {
      applyFallbackLocation('Browser geolocation not supported. Placed your pin in central Davao City.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(detectedLoc);
        setIsLocating(false);
        setLocationError(null);
        fitUserAndSalonsView(detectedLoc);
      },
      (error) => {
        let msg = 'Using central Davao City (GPS permission was not granted).';
        if (error.code === 1) {
          msg = 'GPS permission denied. Placed user pin in central Davao City.';
        } else if (error.code === 2) {
          msg = 'GPS signal unavailable. Placed user pin in central Davao City.';
        } else if (error.code === 3) {
          msg = 'GPS request timed out. Placed user pin in central Davao City.';
        }
        applyFallbackLocation(msg);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
    );
  };

  const currentCenter = useMemo(() => {
    if (
      activeCoordinates &&
      Number.isFinite(activeCoordinates[0]) &&
      Number.isFinite(activeCoordinates[1]) &&
      !isNaN(activeCoordinates[0]) &&
      !isNaN(activeCoordinates[1])
    ) {
      return { lat: activeCoordinates[0], lng: activeCoordinates[1] };
    }
    for (const salon of availableSalons) {
      const coords = getValidCoordinates(salon);
      if (coords) {
        return { lat: coords[0], lng: coords[1] };
      }
    }
    return DAVAO_CENTER;
  }, [activeCoordinates, availableSalons]);

  const safeCurrentCenter: [number, number] = useMemo(() => {
    const lat = Number(currentCenter?.lat);
    const lng = Number(currentCenter?.lng);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return [lat, lng];
    }
    return [DAVAO_CENTER.lat, DAVAO_CENTER.lng];
  }, [currentCenter]);

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
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 shadow-xs'
                  : 'bg-white border-pink-200 text-pink-700 hover:bg-pink-50 shadow-xs'
              }`}
              title="Locate salons near your current GPS position and adjust map to frame all pins"
            >
              <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin text-pink-600' : ''}`} />
              <span>{isLocating ? 'Locating...' : userLocation ? 'Salons Near Me (View All)' : 'Salons Near Me'}</span>
            </button>

            {/* Directions Route Button */}
            {userLocation && activeSalon && (
              <button
                onClick={handleToggleDirections}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                  showDirections
                    ? 'bg-pink-600 border-pink-600 text-white hover:bg-pink-700'
                    : 'bg-white border-pink-200 text-pink-700 hover:bg-pink-50 shadow-xs'
                }`}
                title="Show route to selected salon"
              >
                <Route className="w-4 h-4" />
                <span>{showDirections ? 'Hide Route' : 'Get Directions'}</span>
              </button>
            )}

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
              <option value="all">All Cities ({availableSalons.length})</option>
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

        {/* Quick Filter Chips */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-gray-400 mr-1 shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Quick:
          </span>

          {/* All Studios chip */}
          <button
            type="button"
            onClick={() => {
              setDistanceFilter('all');
              setMinRatingFilter(null);
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
              distanceFilter === 'all' && minRatingFilter === null
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-pink-200/80 hover:bg-pink-50/50'
            }`}
          >
            All Studios ({availableSalons.length})
          </button>

          {/* Top Rated chip */}
          <button
            type="button"
            onClick={() => setMinRatingFilter(minRatingFilter === 4.5 ? null : 4.5)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
              minRatingFilter === 4.5
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-pink-200/80 hover:bg-pink-50/50'
            }`}
          >
            <Star className={`w-3 h-3 ${minRatingFilter === 4.5 ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
            <span>Top Rated (4.5+ ★)</span>
          </button>

          {/* Distance Chips (When GPS is available) */}
          {userLocation ? (
            <>
              <button
                type="button"
                onClick={() => setDistanceFilter(distanceFilter === '5' ? 'all' : '5')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  distanceFilter === '5'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <Navigation className="w-2.5 h-2.5" />
                <span>Within 5 km</span>
              </button>

              <button
                type="button"
                onClick={() => setDistanceFilter(distanceFilter === '10' ? 'all' : '10')}
                className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  distanceFilter === '10'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <Navigation className="w-2.5 h-2.5" />
                <span>Within 10 km</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLocateMe}
              className="px-3 py-1 rounded-full text-[11px] font-medium shrink-0 text-pink-600 bg-pink-50 border border-pink-200 hover:bg-pink-100 transition-colors cursor-pointer flex items-center gap-1"
            >
              <LocateFixed className="w-3 h-3" />
              <span>Enable GPS for Radius</span>
            </button>
          )}

          {(searchQuery || selectedCity !== 'all' || selectedCategory !== 'all' || distanceFilter !== 'all' || minRatingFilter !== null) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedCategory('all');
                setDistanceFilter('all');
                setMinRatingFilter(null);
              }}
              className="ml-auto text-[11px] text-pink-600 hover:text-pink-800 font-semibold underline shrink-0 px-2 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {locationError && (
          <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl mt-2 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="flex-1">{locationError}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUserLocation({ lat: DAVAO_CENTER.lat, lng: DAVAO_CENTER.lng });
                  setLocationError(null);
                }}
                className="px-2 py-1 text-[10px] font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md transition-colors cursor-pointer"
              >
                Use Davao City (Demo)
              </button>
              <button
                type="button"
                onClick={() => setLocationError(null)}
                className="p-1 text-amber-600 hover:text-amber-900 rounded-md transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {routeInfo && (
          <div className="mt-2 p-2 rounded-lg bg-pink-50 border border-pink-200 flex items-center gap-3">
            <Route className="w-4 h-4 text-pink-600" />
            <div className="text-xs text-gray-700">
              <span className="font-semibold">{routeInfo.distance} km</span>
              <span className="mx-2">•</span>
              <span className="font-semibold">{routeInfo.duration} min</span>
              <span className="ml-1 text-gray-500">estimated travel time</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Map + Store Directory Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] relative">
        {/* LEFT COLUMN: Store Cards List (4 cols) */}
        <div className={`lg:col-span-4 border-r border-pink-100 flex flex-col bg-gray-50/50 max-h-[640px] overflow-y-auto order-2 lg:order-1 ${mobileView === 'list' ? 'flex' : 'hidden lg:flex'}`}>
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
                <p className="text-[11px] text-gray-400 mt-1">Try broadening your search or distance filter</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('all');
                    setSelectedCategory('all');
                    setDistanceFilter('all');
                    setMinRatingFilter(null);
                  }}
                  className="mt-3 px-3 py-1 text-xs text-pink-600 font-semibold border border-pink-200 rounded-lg hover:bg-pink-50 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredSalons.map((salon) => {
                const isSelected = activeSalon !== null && String(activeSalon.id) === String(salon.id);
                const salonCoords = salon.coordinates;

                return (
                  <div
                    key={salon.id}
                    id={`salon-card-${salon.id}`}
                    onClick={() => {
                      setActiveSalon(salon);
                      if (salonCoords) {
                        setActiveCoordinates(salonCoords);
                      }
                      if (onSelectSalon) onSelectSalon(salon);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-pink-50/40 border-gray-900 shadow-md ring-2 ring-gray-900/15'
                        : 'bg-white border-pink-100/80 hover:border-pink-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {salon.logo ? (
                        <img
                          src={salon.logo}
                          alt={salon.salon_name}
                          className="w-12 h-12 rounded-xl object-cover border border-pink-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {salon.salon_name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {salon.salon_name}
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected && (
                              <span className="text-[10px] font-bold text-gray-900 bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-600 animate-pulse" />
                                Selected
                              </span>
                            )}
                            {salon.distance !== undefined && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {salon.distance} km away
                              </span>
                            )}
                          </div>
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
                    <div className="flex items-center flex-wrap gap-1.5 pt-1.5 border-t border-gray-100 mt-1">
                      {salonCoords && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerDirectionsForSalon(salon);
                          }}
                          className={`px-2 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            showDirections && activeSalon && String(activeSalon.id) === String(salon.id)
                              ? 'bg-pink-600 border-pink-600 text-white hover:bg-pink-700 shadow-xs'
                              : 'border-pink-200 bg-pink-50/70 hover:bg-pink-100 text-pink-700'
                          }`}
                          title={
                            showDirections && activeSalon && String(activeSalon.id) === String(salon.id)
                              ? 'Hide directions route'
                              : 'Show directions route on map'
                          }
                        >
                          <Route className="w-2.5 h-2.5" />
                          <span>
                            {showDirections && activeSalon && String(activeSalon.id) === String(salon.id)
                              ? 'Hide Route'
                              : 'Directions'}
                          </span>
                        </button>
                      )}

                      {/* On mobile: jump straight to map view for this studio */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSalon(salon);
                          if (salonCoords) setActiveCoordinates(salonCoords);
                          setMobileView('map');
                        }}
                        className="lg:hidden px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <MapIcon className="w-2.5 h-2.5" />
                        <span>Show on Map</span>
                      </button>

                      {onViewSalonDetails && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewSalonDetails(salon);
                          }}
                          className="px-2 py-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      )}

                      {onBookSalon && (
                        <button
                          type="button"
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
        <div className={`lg:col-span-8 relative overflow-hidden bg-slate-900 flex flex-col order-1 lg:order-2 min-h-[440px] lg:min-h-[600px] ${mobileView === 'map' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Floating Quick Action: Fit All Pins */}
          <div className="absolute top-3.5 right-3.5 z-[400] flex items-center gap-2">
            <button
              type="button"
              onClick={() => fitUserAndSalonsView()}
              className="bg-white/95 hover:bg-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-pink-100 text-[11px] font-bold text-gray-800 hover:text-pink-600 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Zoom out and fit all salons and your location on the map"
            >
              <Maximize2 className="w-3.5 h-3.5 text-pink-600" />
              <span>Fit All Pins</span>
            </button>
          </div>

          {/* Leaflet Map Component */}
          <MapContainer
            center={safeCurrentCenter}
            zoom={zoomLevel}
            style={{ width: '100%', height: '100%' }}
            className="z-0"
          >
            <TileLayer
              url={tileLayerUrl}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            <MapViewUpdater
              center={currentCenter}
              zoom={zoomLevel}
              activeCoordinates={activeCoordinates}
              fitBoundsTarget={fitBoundsTarget}
            />

            {/* Routing path line and directions */}
            {showDirections && userLocation && activeSalon && (() => {
              const coords = getValidCoordinates(activeSalon);
              return coords ? (
                <RouteLine
                  userLocation={userLocation}
                  salonLocation={{ lat: coords[0], lng: coords[1] }}
                  onRouteCalculated={handleRouteCalculated}
                />
              ) : null;
            })()}

            {/* User location marker */}
            {userLocation &&
              Number.isFinite(userLocation.lat) &&
              Number.isFinite(userLocation.lng) &&
              !isNaN(userLocation.lat) &&
              !isNaN(userLocation.lng) && (
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
              if (!salon.coordinates) return null;
              const [lat, lng] = salon.coordinates;
              if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                isNaN(lat) ||
                isNaN(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
              ) {
                return null;
              }
              const isSelected = activeSalon !== null && String(activeSalon.id) === String(salon.id);

              return (
                <Marker
                  key={salon.id}
                  position={[lat, lng] as [number, number]}
                  icon={createCustomIcon(isSelected, salon.avg_rating)}
                  eventHandlers={{
                    click: () => {
                      setActiveSalon(salon);
                      if (salon.coordinates) {
                        setActiveCoordinates(salon.coordinates);
                      }
                      if (onSelectSalon) onSelectSalon(salon);
                      // Scroll the salon card in the list into view
                      const cardElement = document.getElementById(`salon-card-${salon.id}`);
                      if (cardElement) {
                        cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    },
                  }}
                />
              );
            })}
          </MapContainer>

          {/* Floating Active Salon Preview Card Over Map */}
          {activeSalon && activeCoordinates && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-pink-200/80 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  {activeSalon.logo ? (
                    <img
                      src={activeSalon.logo}
                      alt={activeSalon.salon_name}
                      className="w-12 h-12 rounded-xl object-cover border border-pink-100 shrink-0 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {activeSalon.salon_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {activeSalon.salon_name}
                      </h4>
                      {activeDistance !== undefined && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                          {activeDistance} km away
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500">
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                        <span>{Number(activeSalon.avg_rating || 0).toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <span className="truncate">{activeSalon.category_name || 'Nail Studio'}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-pink-600 shrink-0" />
                      <span className="truncate">{activeSalon.address}</span>
                    </p>
                    {showDirections && routeInfo && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200 w-fit">
                        <Route className="w-3 h-3 text-pink-600 shrink-0" />
                        <span>{routeInfo.distance} km • ~{routeInfo.duration} min drive</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSalon(null);
                    setActiveCoordinates(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => triggerDirectionsForSalon(activeSalon)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showDirections
                      ? 'bg-pink-600 border-pink-600 text-white hover:bg-pink-700 shadow-xs'
                      : 'border-pink-200 bg-pink-50 hover:bg-pink-100 text-pink-700'
                  }`}
                  title={showDirections ? 'Hide route on map' : 'Show directions route on Leaflet map'}
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>{showDirections ? 'Hide Route' : 'Show Directions'}</span>
                </button>

                {onBookSalon && (
                  <button
                    type="button"
                    onClick={() => onBookSalon(activeSalon)}
                    className="flex-1 px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Book Appointment</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating View Switcher (List vs Map) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          className="px-5 py-2.5 rounded-full bg-gray-900/95 backdrop-blur-md text-white font-semibold text-xs shadow-2xl flex items-center gap-2 hover:bg-black transition-all border border-pink-500/30 active:scale-95 cursor-pointer"
        >
          {mobileView === 'list' ? (
            <>
              <MapIcon className="w-4 h-4 text-pink-400" />
              <span>View on Map ({filteredSalons.length})</span>
            </>
          ) : (
            <>
              <List className="w-4 h-4 text-pink-400" />
              <span>View Studio Directory</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};