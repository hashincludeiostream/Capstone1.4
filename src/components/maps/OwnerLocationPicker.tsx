import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Save,
  Check,
  LocateFixed,
  Building,
  Car,
  Compass,
  Eye,
  Sliders,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Salon } from '../../types';
import { updateSalon } from '../../lib/api';
import {
  DAVAO_LOCATION_PRESETS,
  DavaoLocationPreset,
  calculateDistanceKm,
  getOpenStreetMapDirectionsUrl,
  getOpenStreetMapViewUrl,
} from '../../utils/geoUtils';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
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

// Custom icon for draggable salon marker
const createSalonIcon = () => {
  return L.divIcon({
    className: 'salon-marker',
    html: `
      <div style="
        background-color: #7c3aed;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: move;
      ">
        <span style="color: white; font-size: 16px;">💅</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e: any) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to handle draggable marker
function DraggableMarker({ 
  position, 
  onPositionChange 
}: { 
  position: { lat: number; lng: number }; 
  onPositionChange: (lat: number, lng: number) => void;
}) {
  return (
    <Marker
      position={[position.lat, position.lng] as [number, number]}
      draggable={true}
      icon={createSalonIcon()}
      eventHandlers={{
        dragend: (e: any) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          onPositionChange(newPosition.lat, newPosition.lng);
        }
      }}
    >
      <Popup>
        <div className="text-xs">
          <strong>Drag me to set location</strong>
        </div>
      </Popup>
    </Marker>
  );
}

interface OwnerLocationPickerProps {
  salon: Salon;
  onSalonUpdated?: (updated: Salon) => void;
  onShowToast?: (msg: string) => void;
}

export const OwnerLocationPicker: React.FC<OwnerLocationPickerProps> = ({
  salon,
  onSalonUpdated,
  onShowToast,
}) => {
  const [address, setAddress] = useState(salon.address || '');
  const [city, setCity] = useState(salon.city || 'Taguig');
  const [province, setProvince] = useState(salon.province || 'Metro Manila');
  const [postalCode, setPostalCode] = useState(salon.postal_code || '');
  const [landmark, setLandmark] = useState(salon.landmark || '');
  const [parkingInfo, setParkingInfo] = useState(salon.parking_info || '');
  const parseSafeCoord = (val: any, fallback: number) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return Number.isFinite(num) && !isNaN(num) ? num : fallback;
  };

  const [latitude, setLatitude] = useState<number>(() => parseSafeCoord(salon.latitude, 7.0731));
  const [longitude, setLongitude] = useState<number>(() => parseSafeCoord(salon.longitude, 125.6128));
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>(() => ({
    lat: parseSafeCoord(salon.latitude, 7.0731),
    lng: parseSafeCoord(salon.longitude, 125.6128)
  }));
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');

  const updateGuidesForPosition = (lat: number, lng: number) => {
    const nearestPreset = DAVAO_LOCATION_PRESETS.reduce((nearest, preset) => {
      const nearestDistance = calculateDistanceKm(lat, lng, nearest.lat, nearest.lng);
      const presetDistance = calculateDistanceKm(lat, lng, preset.lat, preset.lng);
      return presetDistance < nearestDistance ? preset : nearest;
    });

    setLandmark(`Near ${nearestPreset.name}: ${nearestPreset.landmark}`);
    setParkingInfo(nearestPreset.parking);
  };

  // Sync marker position when coordinates change
  useEffect(() => {
    const safeLat = parseSafeCoord(latitude, 7.0731);
    const safeLng = parseSafeCoord(longitude, 125.6128);
    setMarkerPosition({ lat: safeLat, lng: safeLng });
  }, [latitude, longitude]);

  // Sync state when salon prop changes
  useEffect(() => {
    setAddress(salon.address || '');
    setCity(salon.city || 'Davao City');
    setProvince(salon.province || 'Davao del Sur');
    setPostalCode(salon.postal_code || '');
    setLandmark(salon.landmark || '');
    setParkingInfo(salon.parking_info || '');
    setLatitude(parseSafeCoord(salon.latitude, 7.0731));
    setLongitude(parseSafeCoord(salon.longitude, 125.6128));
  }, [salon]);

  // Handle Preset Mall/Hub Selection
  const handleApplyPreset = (preset: DavaoLocationPreset) => {
    setAddress(preset.address);
    setCity(preset.city);
    setProvince(preset.province);
    setLandmark(preset.landmark);
    setParkingInfo(preset.parking);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    if (onShowToast) {
      onShowToast(`Applied preset: ${preset.name}`);
    }
  };

  // Handle GPS Geolocation from device
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      if (onShowToast) onShowToast('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        setLatitude(lat);
        setLongitude(lng);
        updateGuidesForPosition(lat, lng);
        setIsLocating(false);
        if (onShowToast) {
          onShowToast(`Updated coordinates to GPS position (${lat}, ${lng})`);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not acquire your device GPS position. Please check permissions.';
        if (err.code === 1) {
          msg = 'Location permission denied. Please allow location access in your browser or open in a new tab.';
        } else if (err.code === 2) {
          msg = 'GPS signal unavailable from your device or network.';
        } else if (err.code === 3) {
          msg = 'GPS acquisition timed out. Please try again.';
        }
        if (onShowToast) {
          onShowToast(msg);
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
  };

  // Handle map click to set marker position
  const handleMapClick = (lat: number, lng: number) => {
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    setLatitude(roundedLat);
    setLongitude(roundedLng);
    updateGuidesForPosition(roundedLat, roundedLng);
  };

  // Handle marker drag end
  const handleMarkerDrag = (lat: number, lng: number) => {
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    setLatitude(roundedLat);
    setLongitude(roundedLng);
    updateGuidesForPosition(roundedLat, roundedLng);
  };

  // Save location updates to backend
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedData: Partial<Salon> = {
        address,
        city,
        province,
        postal_code: postalCode,
        landmark,
        parking_info: parkingInfo,
        latitude: Number(latitude),
        longitude: Number(longitude),
      };

      const res = await updateSalon(salon.id, updatedData);
      if (res) {
        setSaveSuccess(true);
        if (onSalonUpdated) onSalonUpdated(res);
        if (onShowToast) onShowToast('Store location & map settings saved successfully!');
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to update salon location:', err);
      alert('Failed to save location changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Tile layer URL based on map style
  const tileLayerUrl = mapStyle === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-700" />
            Store Location, Pin Placement & Customer Navigation
          </h3>
          <p className="text-xs text-gray-500">
            Set your salon's exact map coordinates, landmarks, and parking instructions so clients find you effortlessly.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPreviewMode('editor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              previewMode === 'editor'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Map & Coordinates Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              previewMode === 'preview'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Customer View Preview</span>
          </button>
        </div>
      </div>

      {previewMode === 'editor' ? (
        <form onSubmit={handleSaveLocation} className="space-y-6">
          {/* Preset Hubs Quick Selector */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                Quick Presets: Davao City Shopping & Business Hubs
              </span>
              <span className="text-[11px] text-purple-700 font-medium">
                Click any hub to auto-fill address & coordinates
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {DAVAO_LOCATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-purple-500 hover:bg-purple-50 text-[11px] font-semibold text-purple-900 shadow-2xs transition-all cursor-pointer"
                >
                  📍 {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Map Pin Placement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-gray-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-700" />
                Interactive Map Pin Drop (Click anywhere on the map to relocate pin)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentGPS}
                  disabled={isLocating}
                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-300 text-purple-800 hover:bg-purple-50 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Acquiring GPS...' : 'Use My GPS Location'}</span>
                </button>
                <div className="hidden sm:flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setMapStyle('street')}
                    className={`px-2 py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
                      mapStyle === 'street'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Street
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapStyle('satellite')}
                    className={`px-2 py-1 text-[10px] font-semibold rounded transition-all cursor-pointer ${
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

            <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden border-2 border-purple-200 bg-slate-900 group shadow-inner">
              <MapContainer
                center={[parseSafeCoord(latitude, 7.0731), parseSafeCoord(longitude, 125.6128)] as [number, number]}
                zoom={15}
                style={{ width: '100%', height: '100%' }}
                className="z-0"
              >
                <TileLayer
                  url={tileLayerUrl}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler onMapClick={handleMapClick} />
                <DraggableMarker 
                  position={markerPosition} 
                  onPositionChange={handleMarkerDrag}
                />
              </MapContainer>
            </div>
          </div>

          {/* Form Fields: Address, Coordinates, Landmarks, Parking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Street Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Street Address / Mall Unit Number
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Unit 402, High Street Promenade, Bonifacio Global City, Taguig"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City / Municipality</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Davao City"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            {/* Province / Region */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Province / Metro Area</label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="e.g. Davao del Sur"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Exact Latitude */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Latitude Coordinates (Decimal)
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none font-mono"
                required
              />
            </div>

            {/* Exact Longitude */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Longitude Coordinates (Decimal)
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none font-mono"
                required
              />
            </div>

            {/* Landmark & Floor Instructions */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-purple-700" />
                <span>Customer Landmark & Floor Guide</span>
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. 4th Floor across Central Plaza Fountain, beside Sephora"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Parking & Accessibility */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-purple-700" />
                <span>Parking & Accessibility Guide</span>
              </label>
              <input
                type="text"
                value={parkingInfo}
                onChange={(e) => setParkingInfo(e.target.value)}
                placeholder="e.g. Underground B1/B2 Parkade with dedicated Valet & PWD ramp"
                className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action and Save Button */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <a
                href={getOpenStreetMapDirectionsUrl(latitude, longitude, salon.salon_name)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 underline underline-offset-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Navigation Link</span>
              </a>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <Check className="w-4 h-4" /> Location settings saved!
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Location & Map Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Customer View Preview */
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-xs text-purple-900 flex items-center justify-between">
            <span>
              This is an interactive preview of how clients see your studio on the Explore Map and in your salon profile.
            </span>
            <button
              type="button"
              onClick={() => setPreviewMode('editor')}
              className="text-purple-700 font-bold hover:underline"
            >
              Back to Editor
            </button>
          </div>

          <div className="p-5 rounded-3xl border border-pink-100 bg-white shadow-sm space-y-4">
            <div className="flex items-start gap-4">
              <img
                src={salon.logo}
                alt={salon.salon_name}
                className="w-16 h-16 rounded-2xl object-cover border border-pink-200 shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">{salon.salon_name}</h4>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{address}</p>
                {landmark && (
                  <div className="text-[10px] text-purple-900 bg-purple-50/70 px-2 py-1 rounded-lg border border-purple-100 flex items-center gap-1">
                    <Building className="w-3 h-3 text-purple-600 shrink-0" />
                    <span className="truncate">Landmark: {landmark}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-[10px] text-gray-500 mb-1">Latitude</div>
                <div className="text-xs font-mono font-bold text-gray-900">{latitude.toFixed(4)}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-[10px] text-gray-500 mb-1">Longitude</div>
                <div className="text-xs font-mono font-bold text-gray-900">{longitude.toFixed(4)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={getOpenStreetMapDirectionsUrl(latitude, longitude, salon.salon_name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions</span>
              </a>
              <a
                href={getOpenStreetMapViewUrl(latitude, longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on Map</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};