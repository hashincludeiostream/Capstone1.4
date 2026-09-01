// Utility helpers for geolocation, distances, and map navigation

export interface PhilippineLocationPreset {
  id: string;
  name: string;
  city: string;
  province: string;
  address: string;
  landmark: string;
  parking: string;
  lat: number;
  lng: number;
}

export interface DavaoLocationPreset {
  id: string;
  name: string;
  city: string;
  province: string;
  address: string;
  landmark: string;
  parking: string;
  lat: number;
  lng: number;
}

export const PHILIPPINE_LOCATION_PRESETS: PhilippineLocationPreset[] = [
  {
    id: 'bgc-high-street',
    name: 'Bonifacio High Street Promenade',
    city: 'Taguig',
    province: 'Metro Manila',
    address: 'High Street Promenade, Bonifacio Global City, Taguig, 1634',
    landmark: 'BGC High Street Promenade, across Central Plaza Fountain',
    parking: 'Underground B1/B2 Parkade with dedicated Valet & PWD ramp',
    lat: 14.5505,
    lng: 121.0509,
  },
  {
    id: 'eastwood-city',
    name: 'Eastwood Citywalk 2',
    city: 'Quezon City',
    province: 'Metro Manila',
    address: '2nd Floor, Eastwood City Walk, Libis, Quezon City, 1110',
    landmark: 'Eastwood Citywalk 2, beside Cinema Lobby & East Wing Bridge',
    parking: 'Eastwood Mall Multi-Level Parking (P1-P4) with EV charging',
    lat: 14.6091,
    lng: 121.0799,
  },
  {
    id: 'vertis-north',
    name: 'Ayala Malls Vertis North',
    city: 'Quezon City',
    province: 'Metro Manila',
    address: 'Level 3 Fashion Wing, Ayala Malls Vertis North, North Ave, QC, 1105',
    landmark: 'Level 3 Fashion & Wellness Wing, adjacent to Activity Center',
    parking: 'Ayala Malls Vertis North Basement 1 & 2 Carpark',
    lat: 14.6538,
    lng: 121.0366,
  },
  {
    id: 'century-city',
    name: 'Century City Mall Makati',
    city: 'Makati',
    province: 'Metro Manila',
    address: 'Ground Floor, Century City Mall, Kalayaan Ave, Makati, 1210',
    landmark: 'Ground Floor Luxury Lane, opposite Century City Lifestyle Entrance',
    parking: 'Mall Basement Parking with complimentary valet service',
    lat: 14.5684,
    lng: 121.0304,
  },
  {
    id: 'shangri-la',
    name: 'Shangri-La Plaza Mall',
    city: 'Mandaluyong',
    province: 'Metro Manila',
    address: 'Level 3 Main Wing, Shangri-La Plaza, EDSA, Mandaluyong, 1550',
    landmark: 'Level 3 Main Wing, near Garden Galleria and Rustan’s Entrance',
    parking: 'Shangri-La Plaza multi-level parking with direct mall concourse elevators',
    lat: 14.5815,
    lng: 121.0558,
  },
  {
    id: 'greenbelt-makati',
    name: 'Greenbelt 5 Makati',
    city: 'Makati',
    province: 'Metro Manila',
    address: '2nd Floor, Greenbelt 5, Legazpi Village, Makati, 1228',
    landmark: 'Level 2 Luxury Avenue, near Fashion Walk escalator',
    parking: 'Greenbelt Basement Parking & Valet drop-off on Legazpi St.',
    lat: 14.5526,
    lng: 121.0205,
  },
  {
    id: 'sm-megamall',
    name: 'SM Megamall Fashion Hall',
    city: 'Mandaluyong',
    province: 'Metro Manila',
    address: '4th Floor Mega Fashion Hall, EDSA, Ortigas Center, Mandaluyong, 1550',
    landmark: 'Level 4 Fashion Hall, overlooking Mega Ice Rink',
    parking: 'Mega Fashion Hall Multi-Deck Parking B & C',
    lat: 14.5847,
    lng: 121.0567,
  },
  {
    id: 'ayala-cebu',
    name: 'Ayala Center Cebu',
    city: 'Cebu City',
    province: 'Cebu',
    address: 'Level 3 The Terraces, Ayala Center Cebu, Cebu Business Park, Cebu City, 6000',
    landmark: 'Level 3 The Terraces Garden, adjacent to Rustan’s',
    parking: 'Ayala Center Cebu Basement & Phase 2 Parkade',
    lat: 10.3173,
    lng: 123.9058,
  },
  {
    id: 'abreeza-davao',
    name: 'Abreeza Ayala Mall Davao',
    city: 'Davao City',
    province: 'Davao del Sur',
    address: '2nd Floor, Abreeza Mall, J.P. Laurel Ave, Bajada, Davao City, 8000',
    landmark: '2nd Floor Central Atrium, near Main Escalator',
    parking: 'Abreeza Mall Ground & Basement Parking',
    lat: 7.0898,
    lng: 125.6111,
  },
];

export const DAVAO_LOCATION_PRESETS: DavaoLocationPreset[] = [
  {
    id: 'abreeza-davao',
    name: 'Abreeza Ayala Mall Davao',
    city: 'Davao City',
    province: 'Davao del Sur',
    address: '2nd Floor, Abreeza Mall, J.P. Laurel Ave, Bajada, Davao City, 8000',
    landmark: '2nd Floor Central Atrium, near Main Escalator',
    parking: 'Abreeza Mall Ground & Basement Parking',
    lat: 7.0898,
    lng: 125.6111,
  },
  {
    id: 'sm-lanang',
    name: 'SM Lanang Premier Davao',
    city: 'Davao City',
    province: 'Davao del Sur',
    address: '3rd Floor, SM Lanang Premier, J.P. Laurel Ave, Davao City, 8000',
    landmark: '3rd Floor Main Atrium, near SM Cinema',
    parking: 'SM Lanang Premier Multi-Level Parking',
    lat: 7.0972,
    lng: 125.6156,
  },
  {
    id: 'gaisano-mall',
    name: 'Gaisano Mall of Davao',
    city: 'Davao City',
    province: 'Davao del Sur',
    address: '2nd Floor, Gaisano Mall, J.P. Laurel Ave, Bajada, Davao City, 8000',
    landmark: '2nd Floor Center Court, near Escalator',
    parking: 'Gaisano Mall Basement Parking',
    lat: 7.0856,
    lng: 125.6089,
  },
  {
    id: 'sm-city-davao',
    name: 'SM City Davao',
    city: 'Davao City',
    province: 'Davao del Sur',
    address: '2nd Floor, SM City Davao, Quimpo Blvd, Davao City, 8000',
    landmark: '2nd Floor Main Mall, near The SM Store',
    parking: 'SM City Davao Multi-Level Parking',
    lat: 7.0654,
    lng: 125.6012,
  },
  {
    id: 'victoria-plaza',
    name: 'Victoria Plaza Mall',
    city: 'Davao City',
    province: 'Davao del Sur',
    address: 'Ground Floor, Victoria Plaza, J.P. Laurel Ave, Davao City, 8000',
    landmark: 'Ground Floor Main Entrance, near Food Court',
    parking: 'Victoria Plaza Open Parking',
    lat: 7.0789,
    lng: 125.6145,
  },
  {
    id: 'davao-downtown',
    name: 'Davao City Downtown',
    city: 'Davao City',
    province: 'Davao del Sur',
    address: 'San Pedro St, Davao City, 8000',
    landmark: 'Near San Pedro Cathedral',
    parking: 'Street Parking Available',
    lat: 7.0731,
    lng: 125.6128,
  },
];

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Generates an official Google Maps navigation directions URL
 */
export function getGoogleMapsDirectionsUrl(
  lat: number,
  lng: number,
  destinationName?: string
): string {
  const destination = `${lat},${lng}`;
  const query = destinationName ? encodeURIComponent(destinationName) : destination;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_name=${query}`;
}

/**
 * Generates a Google Maps place search/view URL
 */
export function getGoogleMapsViewUrl(
  lat: number,
  lng: number,
  salonName?: string
): string {
  const query = salonName ? encodeURIComponent(`${salonName}, ${lat},${lng}`) : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Generates an OpenStreetMap navigation directions URL (alternative to Google Maps)
 */
export function getOpenStreetMapDirectionsUrl(
  lat: number,
  lng: number,
  destinationName?: string
): string {
  return `https://www.openstreetmap.org/directions?to=${lat},${lng}`;
}

/**
 * Generates an OpenStreetMap view URL (alternative to Google Maps)
 */
export function getOpenStreetMapViewUrl(
  lat: number,
  lng: number,
  salonName?: string
): string {
  const zoom = 15;
  return `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`;
}
