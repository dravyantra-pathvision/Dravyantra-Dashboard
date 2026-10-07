// src/lib/google-maps.ts

declare global {
  interface Window {
    google?: any;
    __googleMapsLoadedPromise?: Promise<any>;
  }
}

export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBQD3n2aqQdxz6h1teJ3D3fdnN7htkGFh8';

// Comprehensive directory of Indian logistics hubs, ports, industrial corridors, and major cities
const INDIAN_CITIES: Array<{ name: string; state: string; lat: number; lng: number }> = [
  // Metro & Tier 1
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi NCR', lat: 28.6139, lng: 77.209 },
  { name: 'Bengaluru (Bangalore)', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },

  // Key Logistics Hubs & Industrial Zones
  { name: 'Bhiwandi Logistics Hub', state: 'Maharashtra', lat: 19.3002, lng: 73.0635 },
  { name: 'Jawaharlal Nehru Port (JNPT / Nhava Sheva)', state: 'Maharashtra', lat: 18.9499, lng: 72.9515 },
  { name: 'Mundra Port Logistics SEZ', state: 'Gujarat', lat: 22.8396, lng: 69.7042 },
  { name: 'Kandla Port (Deendayal Port)', state: 'Gujarat', lat: 23.0135, lng: 70.2173 },
  { name: 'Manesar Industrial Hub (Gurgaon)', state: 'Haryana', lat: 28.3545, lng: 76.9385 },
  { name: 'Sri City Industrial Zone', state: 'Andhra Pradesh', lat: 13.5281, lng: 79.9972 },
  { name: 'Sanand Industrial Park', state: 'Gujarat', lat: 22.9935, lng: 72.3811 },
  { name: 'Chakan Auto Hub', state: 'Maharashtra', lat: 18.7606, lng: 73.8576 },
  { name: 'Pithampur Industrial Corridor', state: 'Madhya Pradesh', lat: 22.6074, lng: 75.6885 },
  { name: 'Oragadam Auto Corridor (Chennai)', state: 'Tamil Nadu', lat: 12.8344, lng: 79.9575 },
  { name: 'ICD Tuglakabad', state: 'Delhi NCR', lat: 28.5085, lng: 77.2917 },
  { name: 'ICD Dadri', state: 'Uttar Pradesh', lat: 28.5522, lng: 77.5539 },

  // Tier 2 & Key Freight Centers
  { name: 'Gurugram (Gurgaon)', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  { name: 'Greater Noida', state: 'Uttar Pradesh', lat: 28.4744, lng: 77.504 },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781 },
  { name: 'Navi Mumbai', state: 'Maharashtra', lat: 19.033, lng: 73.0297 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Visakhapatnam (Vizag Port)', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
  { name: 'Pimpri-Chinchwad', state: 'Maharashtra', lat: 18.6298, lng: 73.7997 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
  { name: 'Vadodara (Baroda)', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Ludhiana', state: 'Punjab', lat: 30.901, lng: 75.8573 },
  { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081 },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739 },
  { name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973 },
  { name: 'Aurangabad (Chhatrapati Sambhajinagar)', state: 'Maharashtra', lat: 19.8762, lng: 75.3433 },
  { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304 },
  { name: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723 },
  { name: 'Allahabad (Prayagraj)', state: 'Uttar Pradesh', lat: 25.4358, lng: 81.8463 },
  { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Howrah', state: 'West Bengal', lat: 22.5958, lng: 88.2636 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lng: 79.9864 },
  { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828 },
  { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lng: 80.648 },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296 },
  { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648 },
  { name: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362 },
  { name: 'Chandigarh', state: 'Punjab & Haryana', lat: 30.7333, lng: 76.7794 },
  { name: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064 },
  { name: 'Hubballi-Dharwad', state: 'Karnataka', lat: 15.3647, lng: 75.124 },
  { name: 'Mysuru (Mysore)', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { name: 'Tiruchirappalli (Trichy)', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047 },
  { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245 },
  { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.146 },
  { name: 'Warangal', state: 'Telangana', lat: 17.9689, lng: 79.5941 },
  { name: 'Thiruvananthapuram (Trivandrum)', state: 'Kerala', lat: 8.5241, lng: 76.9366 },
  { name: 'Kochi (Cochin Port)', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322 },
  { name: 'Jamshedpur (Tatanagar)', state: 'Jharkhand', lat: 22.8046, lng: 86.2029 },
  { name: 'Mangaluru (Mangalore Port)', state: 'Karnataka', lat: 12.9141, lng: 74.856 },
  { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lng: 73.7125 },
  { name: 'Jalgaon', state: 'Maharashtra', lat: 21.0077, lng: 75.5626 },
  { name: 'Kolhapur', state: 'Maharashtra', lat: 16.705, lng: 74.2433 },
  { name: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8828 },
  { name: 'Rourkela', state: 'Odisha', lat: 22.2604, lng: 84.8536 },
  { name: 'Bhilai', state: 'Chhattisgarh', lat: 21.1938, lng: 81.3509 },
  { name: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0797, lng: 82.1409 },
  { name: 'Durgapur', state: 'West Bengal', lat: 23.5204, lng: 87.3119 },
  { name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lng: 88.3953 },
  { name: 'Asansol', state: 'West Bengal', lat: 23.6739, lng: 86.9524 },
  { name: 'Gaya', state: 'Bihar', lat: 24.7914, lng: 85.0002 },
  { name: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3647 },
  { name: 'Bhagalpur', state: 'Bihar', lat: 25.2425, lng: 86.9842 },
  { name: 'Belagavi (Belgaum)', state: 'Karnataka', lat: 15.8497, lng: 74.4977 },
  { name: 'Shivamogga (Shimoga)', state: 'Karnataka', lat: 13.9299, lng: 75.5681 },
  { name: 'Kozhikode (Calicut)', state: 'Kerala', lat: 11.2588, lng: 75.7804 },
  { name: 'Thrissur', state: 'Kerala', lat: 10.5276, lng: 76.2144 },
  { name: 'Tirupur', state: 'Tamil Nadu', lat: 11.1085, lng: 77.3411 },
  { name: 'Erode', state: 'Tamil Nadu', lat: 11.341, lng: 77.7172 },
  { name: 'Vellore', state: 'Tamil Nadu', lat: 12.9165, lng: 79.1325 },
  { name: 'Tuticorin (V.O.C Port)', state: 'Tamil Nadu', lat: 8.7642, lng: 78.1348 },
  { name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lng: 80.4365 },
  { name: 'Nellore', state: 'Andhra Pradesh', lat: 14.4426, lng: 79.9865 },
  { name: 'Kakinada Port', state: 'Andhra Pradesh', lat: 16.9891, lng: 82.2475 },
  { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192 },
  { name: 'Karnal', state: 'Haryana', lat: 29.6857, lng: 76.9905 },
  { name: 'Panipat', state: 'Haryana', lat: 29.3909, lng: 76.9635 },
  { name: 'Sonipat', state: 'Haryana', lat: 28.9931, lng: 77.0151 },
  { name: 'Ambala', state: 'Haryana', lat: 30.3782, lng: 76.7767 },
  { name: 'Rohtak', state: 'Haryana', lat: 28.8955, lng: 76.6066 },
  { name: 'Hisar', state: 'Haryana', lat: 29.1492, lng: 75.7217 },
  { name: 'Baddi Industrial Area', state: 'Himachal Pradesh', lat: 30.9578, lng: 76.7914 },
  { name: 'Haridwar SIDCUL', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642 },
  { name: 'Rudrapur Industrial Zone', state: 'Uttarakhand', lat: 28.9800, lng: 79.4000 },
  { name: 'Vapi Industrial Estate', state: 'Gujarat', lat: 20.3713, lng: 72.9048 },
  { name: 'Ankleshwar GIDC', state: 'Gujarat', lat: 21.6264, lng: 73.0039 },
  { name: 'Bharuch', state: 'Gujarat', lat: 21.7051, lng: 72.9959 },
  { name: 'Morbi Ceramic Hub', state: 'Gujarat', lat: 22.8173, lng: 70.8370 },
  { name: 'Bhavnagar Port', state: 'Gujarat', lat: 21.7645, lng: 72.1519 },
  { name: 'Jamnagar', state: 'Gujarat', lat: 22.4707, lng: 70.0577 },
];

/**
 * Loads Google Maps JavaScript API safely
 */
export async function loadGoogleMapsScript(apiKey: string = GOOGLE_MAPS_API_KEY): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps can only be loaded in the browser');
  }

  if (window.google?.maps) {
    if (window.google.maps.importLibrary) {
      try {
        await window.google.maps.importLibrary('places');
        await window.google.maps.importLibrary('geometry');
      } catch (_) {}
    }
    return window.google;
  }

  if (window.__googleMapsLoadedPromise) {
    return window.__googleMapsLoadedPromise;
  }

  window.__googleMapsLoadedPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('google-maps-sdk') as HTMLScriptElement | null;
    if (existingScript) {
      let attempts = 0;
      const checkInterval = setInterval(async () => {
        attempts++;
        if (window.google?.maps) {
          clearInterval(checkInterval);
          if (window.google.maps.importLibrary) {
            try {
              await window.google.maps.importLibrary('places');
            } catch (_) {}
          }
          resolve(window.google);
        } else if (attempts > 30) {
          clearInterval(checkInterval);
          resolve(window.google || null);
        }
      }, 50);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,geometry,marker&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = async () => {
      if (window.google?.maps) {
        if (window.google.maps.importLibrary) {
          try {
            await window.google.maps.importLibrary('places');
          } catch (_) {}
        }
        resolve(window.google);
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsLoadedPromise;
}

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

/**
 * Fetch autocomplete predictions for a given search query.
 * Uses modern Places API (New) if available, with immediate 0ms fallback to Indian Cities & Hubs directory.
 */
export async function fetchPlacePredictions(
  input: string,
  apiKey: string = GOOGLE_MAPS_API_KEY
): Promise<PlacePrediction[]> {
  if (!input || input.trim().length === 0) return [];
  const q = input.trim().toLowerCase();

  // Instant local match against Indian cities, transport hubs & industrial corridors
  const directCityMatches = INDIAN_CITIES.filter((c) => {
    const nameLower = c.name.toLowerCase();
    const stateLower = c.state.toLowerCase();
    return (
      nameLower.startsWith(q) ||
      nameLower.includes(q) ||
      stateLower.startsWith(q) ||
      stateLower.includes(q)
    );
  }).map((c) => ({
    placeId: `hub_${c.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    mainText: c.name,
    secondaryText: `${c.state}, India`,
    description: `${c.name}, ${c.state}, India`,
  }));

  // If query is an exact or strong match in Indian Cities list, return fast
  if (directCityMatches.length >= 2 && q.length < 5) {
    return directCityMatches.slice(0, 8);
  }

  // 1. Try modern Places API (New): AutocompleteSuggestion
  try {
    const googleMaps = await loadGoogleMapsScript(apiKey);
    if (googleMaps?.maps?.places?.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      const response = await googleMaps.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        includedRegionCodes: ['in'],
      });

      if (response?.suggestions && response.suggestions.length > 0) {
        return response.suggestions.map((s: any) => {
          const p = s.placePrediction;
          const main = p?.mainText?.toString() || p?.text?.toString() || input;
          const sec = p?.secondaryText?.toString() || 'India';
          const full = p?.text?.toString() || `${main}, ${sec}`;
          return {
            placeId: p?.placeId || `pred_${Math.random()}`,
            mainText: main,
            secondaryText: sec,
            description: full,
          };
        });
      }
    }
  } catch (_) {
    // Avoid triggering console errors; smoothly proceed to fallbacks
  }

  // If local city matches exist, return them
  if (directCityMatches.length > 0) {
    return directCityMatches.slice(0, 8);
  }

  // Fallback 2: OpenStreetMap Nominatim for specific addresses and localities
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        input
      )}&countrycodes=in&limit=6&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => {
          const parts = item.display_name.split(',');
          const main = parts[0]?.trim() || item.name || input;
          const secondary = parts.slice(1, 3).join(',').trim() || 'India';
          return {
            placeId: String(item.place_id || item.osm_id),
            mainText: main,
            secondaryText: secondary,
            description: item.display_name,
          };
        });
      }
    }
  } catch (_) {}

  // Fallback 3: Return typed input formatted cleanly
  return [
    {
      placeId: `custom_${Date.now()}`,
      mainText: input.trim(),
      secondaryText: 'India',
      description: `${input.trim()}, India`,
    },
  ];
}

export interface OptimizedRouteResult {
  distanceKm: number;
  distanceText: string;
  durationText: string;
  durationSeconds: number;
  routeSummary: string;
  startAddress: string;
  endAddress: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  pathCoordinates: { lat: number; lng: number }[];
  overviewPolyline: string;
}

/**
 * Helper to geocode a location name into lat/lng coordinates
 */
export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  if (!query || !query.trim()) return null;
  const q = query.trim().toLowerCase();

  // 1. Check local Indian cities & logistics hubs first (0ms)
  const matched = INDIAN_CITIES.find(
    (c) =>
      q.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(q) ||
      (q.includes(c.state.toLowerCase()) && c.name.toLowerCase().split(' ')[0] && q.includes(c.name.toLowerCase().split(' ')[0]))
  );

  if (matched) {
    return { lat: matched.lat, lng: matched.lng, name: matched.name };
  }

  // 2. OpenStreetMap Nominatim Geocoder
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=in&limit=1`,
      {
        headers: { 'Accept-Language': 'en' },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].name || query,
        };
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Calculate the most optimized driving route between origin and destination
 * using high-performance OSRM driving engine without deprecated Google Directions API calls.
 */
export async function calculateOptimizedDrivingRoute(
  origin: string,
  destination: string,
  _apiKey: string = GOOGLE_MAPS_API_KEY
): Promise<OptimizedRouteResult | null> {
  if (!origin || !destination) return null;

  const start = await geocodeLocation(origin);
  const end = await geocodeLocation(destination);

  if (!start || !end) {
    // If exact coords couldn't be resolved, create a basic fallback
    return {
      distanceKm: 0,
      distanceText: 'Calculated at dispatch',
      durationText: '1 hr',
      durationSeconds: 3600,
      routeSummary: `${origin} to ${destination}`,
      startAddress: origin,
      endAddress: destination,
      startLocation: { lat: 19.076, lng: 72.8777 },
      endLocation: { lat: 28.6139, lng: 77.209 },
      pathCoordinates: [],
      overviewPolyline: '',
    };
  }

  // 1. Fetch exact road network route from OSRM Driving Engine
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Number((route.distance / 1000).toFixed(1));

        // Calibrated for Heavy Commercial Vehicles (HCV / Multi-axle Freight Trucks)
        // Indian commercial truck average highway speed: ~42 km/h (factoring in speed governor, payload, and toll checkpoints)
        const hcvSpeedKmph = 42;
        const durationHoursExact = distanceKm / hcvSpeedKmph;
        const durationSec = Math.round(durationHoursExact * 3600);
        const hours = Math.floor(durationHoursExact);
        const mins = Math.round((durationHoursExact - hours) * 60);
        const durationText = hours > 0 ? (mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`) : `${mins} mins`;

        const pathCoordinates: { lat: number; lng: number }[] = (
          route.geometry?.coordinates || []
        ).map(([lng, lat]: [number, number]) => ({ lat, lng }));

        return {
          distanceKm,
          distanceText: `${distanceKm} km`,
          durationText,
          durationSeconds: durationSec,
          routeSummary: `${start.name} to ${end.name} Highway Corridor`,
          startAddress: start.name,
          endAddress: end.name,
          startLocation: { lat: start.lat, lng: start.lng },
          endLocation: { lat: end.lat, lng: end.lng },
          pathCoordinates,
          overviewPolyline: '',
        };
      }
    }
  } catch (_) {
    // Network fallback below
  }

  // 2. Offline Fallback: Haversine distance with highway factor
  const R = 6371; // Earth radius in km
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLon = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directKm = R * c;
  const highwayKm = Math.max(10, Number((directKm * 1.25).toFixed(1)));
  const durationHoursExact = highwayKm / 42;
  const estHours = Math.floor(durationHoursExact);
  const estMins = Math.round((durationHoursExact - estHours) * 60);
  const durationText = estHours > 0 ? (estMins > 0 ? `${estHours} hr ${estMins} min` : `${estHours} hr`) : `${estMins} mins`;

  // Generate smooth multi-step path points
  const steps = 10;
  const pathCoordinates: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    pathCoordinates.push({
      lat: start.lat + (end.lat - start.lat) * frac,
      lng: start.lng + (end.lng - start.lng) * frac,
    });
  }

  return {
    distanceKm: highwayKm,
    distanceText: `${highwayKm} km`,
    durationText,
    durationSeconds: Math.round(durationHoursExact * 3600),
    routeSummary: `${start.name} to ${end.name} Corridor`,
    startAddress: start.name,
    endAddress: end.name,
    startLocation: { lat: start.lat, lng: start.lng },
    endLocation: { lat: end.lat, lng: end.lng },
    pathCoordinates,
    overviewPolyline: '',
  };
}


