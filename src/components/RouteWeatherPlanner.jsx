import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Car,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CloudRain,
  Wind,
  Eye,
  Thermometer,
  Sparkles,
  ArrowRight,
  Compass,
  RefreshCw,
  Search,
  CheckCircle2,
  ChevronRight,
  Route,
  ArrowLeftRight,
  LocateFixed,
  AlertCircle,
  X,
  ExternalLink,
  Layers,
  Maximize2,
  Minimize2,
  Fuel,
  Info
} from 'lucide-react';
import L from 'leaflet';
import { TRANSLATIONS } from '../services/languages';
import { getWeatherDescription, searchLocation, fetchRainViewerMetadata } from '../services/weatherService';

const POPULAR_ROUTES = [
  {
    id: 'chennai-bangalore',
    from: 'Chennai',
    fromCoords: { lat: 13.0827, lon: 80.2707 },
    to: 'Bengaluru',
    toCoords: { lat: 12.9716, lon: 77.5946 },
    distanceKm: 348,
    driveHours: 6.2,
    waypoints: [
      { name: 'Kanchipuram', offsetHour: 1.4, lat: 12.8342, lon: 79.7036 },
      { name: 'Vellore', offsetHour: 2.8, lat: 12.9165, lon: 79.1325 },
      { name: 'Krishnagiri', offsetHour: 4.6, lat: 12.5186, lon: 78.2137 },
      { name: 'Hosur', offsetHour: 5.5, lat: 12.7409, lon: 77.8253 },
    ],
  },
  {
    id: 'coimbatore-ooty',
    from: 'Coimbatore',
    fromCoords: { lat: 11.0168, lon: 76.9558 },
    to: 'Ooty (Nilgiris)',
    toCoords: { lat: 11.4102, lon: 76.6950 },
    distanceKm: 86,
    driveHours: 3.1,
    waypoints: [
      { name: 'Mettupalayam', offsetHour: 0.8, lat: 11.3000, lon: 76.9500 },
      { name: 'Burliyar Ghat', offsetHour: 1.5, lat: 11.3400, lon: 76.8800 },
      { name: 'Coonoor', offsetHour: 2.3, lat: 11.3530, lon: 76.7959 },
    ],
  },
  {
    id: 'chennai-pondicherry',
    from: 'Chennai',
    fromCoords: { lat: 13.0827, lon: 80.2707 },
    to: 'Puducherry',
    toCoords: { lat: 11.9416, lon: 79.8083 },
    distanceKm: 152,
    driveHours: 3.4,
    waypoints: [
      { name: 'Mahabalipuram (ECR)', offsetHour: 1.1, lat: 12.6269, lon: 80.1927 },
      { name: 'Kalpakkam', offsetHour: 1.7, lat: 12.5012, lon: 80.1587 },
      { name: 'Marakkanam', offsetHour: 2.4, lat: 12.2000, lon: 79.9500 },
    ],
  },
  {
    id: 'madurai-kodaikanal',
    from: 'Madurai',
    fromCoords: { lat: 9.9252, lon: 78.1198 },
    to: 'Kodaikanal',
    toCoords: { lat: 10.2381, lon: 77.4892 },
    distanceKm: 118,
    driveHours: 3.4,
    waypoints: [
      { name: 'Batlagundu', offsetHour: 1.1, lat: 10.1600, lon: 77.7600 },
      { name: 'Silver Cascade Ghat', offsetHour: 2.4, lat: 10.2200, lon: 77.5200 },
    ],
  },
  {
    id: 'mumbai-pune',
    from: 'Mumbai',
    fromCoords: { lat: 19.0760, lon: 72.8777 },
    to: 'Pune',
    toCoords: { lat: 18.5204, lon: 73.8567 },
    distanceKm: 148,
    driveHours: 3.3,
    waypoints: [
      { name: 'Navi Mumbai', offsetHour: 0.8, lat: 19.0330, lon: 73.0297 },
      { name: 'Khandala Ghat', offsetHour: 1.8, lat: 18.7500, lon: 73.3700 },
      { name: 'Lonavala', offsetHour: 2.2, lat: 18.7557, lon: 73.4091 },
    ],
  },
  {
    id: 'delhi-jaipur',
    from: 'Delhi',
    fromCoords: { lat: 28.6139, lon: 77.2090 },
    to: 'Jaipur',
    toCoords: { lat: 26.9124, lon: 75.7873 },
    distanceKm: 282,
    driveHours: 5.1,
    waypoints: [
      { name: 'Gurugram', offsetHour: 0.8, lat: 28.4595, lon: 77.0266 },
      { name: 'Rewari', offsetHour: 2.0, lat: 28.1800, lon: 76.6200 },
      { name: 'Kotputli', offsetHour: 3.3, lat: 27.7000, lon: 76.2000 },
      { name: 'Shahpura', offsetHour: 4.1, lat: 27.3800, lon: 75.9600 },
    ],
  },
];

// Helper to calculate approximate distance in km
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Pre-defined High-Accuracy Coordinates for Tamil Nadu & Indian Cities
const TN_CITY_COORDS = {
  'chengalpattu': { name: 'Chengalpattu', latitude: 12.6922, longitude: 79.9774, admin1: 'Tamil Nadu' },
  'chengalpet': { name: 'Chengalpattu', latitude: 12.6922, longitude: 79.9774, admin1: 'Tamil Nadu' },
  'tiruvannamalai': { name: 'Tiruvannamalai', latitude: 12.2253, longitude: 79.0747, admin1: 'Tamil Nadu' },
  'thiruvannamalai': { name: 'Tiruvannamalai', latitude: 12.2253, longitude: 79.0747, admin1: 'Tamil Nadu' },
  'chennai': { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, admin1: 'Tamil Nadu' },
  'madurai': { name: 'Madurai', latitude: 9.9252, longitude: 78.1198, admin1: 'Tamil Nadu' },
  'coimbatore': { name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, admin1: 'Tamil Nadu' },
  'trichy': { name: 'Tiruchirappalli', latitude: 10.7905, longitude: 78.7047, admin1: 'Tamil Nadu' },
  'tiruchirappalli': { name: 'Tiruchirappalli', latitude: 10.7905, longitude: 78.7047, admin1: 'Tamil Nadu' },
  'salem': { name: 'Salem', latitude: 11.6643, longitude: 78.1460, admin1: 'Tamil Nadu' },
  'vellore': { name: 'Vellore', latitude: 12.9165, longitude: 79.1325, admin1: 'Tamil Nadu' },
  'tirunelveli': { name: 'Tirunelveli', latitude: 8.7139, longitude: 77.7567, admin1: 'Tamil Nadu' },
  'thanjavur': { name: 'Thanjavur', latitude: 10.7870, longitude: 79.1378, admin1: 'Tamil Nadu' },
  'kodaikanal': { name: 'Kodaikanal', latitude: 10.2381, longitude: 77.4892, admin1: 'Tamil Nadu' },
  'ooty': { name: 'Ooty (Nilgiris)', latitude: 11.4102, longitude: 76.6950, admin1: 'Tamil Nadu' },
  'kanchipuram': { name: 'Kanchipuram', latitude: 12.8342, longitude: 79.7036, admin1: 'Tamil Nadu' },
  'rameswaram': { name: 'Rameswaram', latitude: 9.2876, longitude: 79.3129, admin1: 'Tamil Nadu' },
  'kanyakumari': { name: 'Kanyakumari', latitude: 8.0883, longitude: 77.5385, admin1: 'Tamil Nadu' },
  'villupuram': { name: 'Villupuram', latitude: 11.9401, longitude: 79.4861, admin1: 'Tamil Nadu' },
  'cuddalore': { name: 'Cuddalore', latitude: 11.7480, longitude: 79.7714, admin1: 'Tamil Nadu' },
  'puducherry': { name: 'Puducherry', latitude: 11.9416, longitude: 79.8083, admin1: 'Puducherry' },
  'pondicherry': { name: 'Puducherry', latitude: 11.9416, longitude: 79.8083, admin1: 'Puducherry' },
  'bengaluru': { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, admin1: 'Karnataka' },
  'bangalore': { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946, admin1: 'Karnataka' },
  'hyderabad': { name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, admin1: 'Telangana' },
  'kochi': { name: 'Kochi', latitude: 9.9312, longitude: 76.2673, admin1: 'Kerala' },
  'mumbai': { name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, admin1: 'Maharashtra' },
  'pune': { name: 'Pune', latitude: 18.5204, longitude: 73.8567, admin1: 'Maharashtra' },
  'delhi': { name: 'Delhi', latitude: 28.6139, longitude: 77.2090, admin1: 'Delhi' },
};

export default function RouteWeatherPlanner({ activeLanguage = 'en', currentLocation }) {
  const [selectedRoute, setSelectedRoute] = useState(POPULAR_ROUTES[0]);
  const [departureOffset, setDepartureOffset] = useState(0); // in hours from now
  const [routeSimulation, setRouteSimulation] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [overallSafetyScore, setOverallSafetyScore] = useState(88);
  const [hazardPoints, setHazardPoints] = useState([]);

  // Road Polyline Coordinates for Leaflet Map
  const [routePolyline, setRoutePolyline] = useState([]);
  const [isFetchingOSRM, setIsFetchingOSRM] = useState(false);
  const [activeMapLayer, setActiveMapLayer] = useState('streets'); // 'streets' | 'satellite' | 'dark'
  const [showRadarOverlay, setShowRadarOverlay] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Custom Origin / Destination Search State
  const [originQuery, setOriginQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destQuery, setDestQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [customOrigin, setCustomOrigin] = useState(null);
  const [customDest, setCustomDest] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isSearchingRoute, setIsSearchingRoute] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const radarLayerRef = useRef(null);
  const polylineLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerObjMapRef = useRef({});

  // Ref to smoothly scroll to answer
  const resultsRef = useRef(null);

  // 1. Fetch Real Road Geometry & Accurate Driving Route from OSRM
  const fetchOSRMRoute = async (fromCoords, toCoords) => {
    setIsFetchingOSRM(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=full&geometries=geojson&steps=false`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('OSRM service response not ok');
      const data = await res.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const primary = data.routes[0];
        const distKm = Math.round((primary.distance / 1000) * 10) / 10;
        const driveHrs = Math.max(Math.round((primary.duration / 3600) * 10) / 10, 0.5);
        // Convert [lon, lat] -> [lat, lon] for Leaflet
        const coords = primary.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

        return {
          distanceKm: distKm,
          driveHours: driveHrs,
          coordinates: coords,
          source: 'osrm',
        };
      }
    } catch (e) {
      console.warn('OSRM Highway routing fallback to direct geometry:', e);
    } finally {
      setIsFetchingOSRM(false);
    }

    // Fallback: Haversine distance with realistic road curvature & straight coordinate line
    const straightDist = calculateHaversineDistance(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon);
    const estimatedRoadDist = Math.round(straightDist * 1.18); // Average road tortuosity factor
    const driveHrs = Math.max(Math.round((estimatedRoadDist / 50) * 10) / 10, 0.5);

    // Generate 20 intermediate points for a smooth polyline
    const fallbackCoords = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      fallbackCoords.push([
        fromCoords.lat + (toCoords.lat - fromCoords.lat) * frac,
        fromCoords.lon + (toCoords.lon - fromCoords.lon) * frac,
      ]);
    }

    return {
      distanceKm: estimatedRoadDist,
      driveHours: driveHrs,
      coordinates: fallbackCoords,
      source: 'fallback',
    };
  };

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const initialLat = selectedRoute?.fromCoords?.lat || 13.0827;
      const initialLon = selectedRoute?.fromCoords?.lon || 80.2707;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 7,
        zoomControl: true,
        attributionControl: false,
      });

      // Street Base Layer (Google Maps-style CartoDB Voyager)
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      polylineLayerRef.current = L.featureGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      leafletMapRef.current = map;
    }

    const timer = setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  // Update Base Tile Layer when activeMapLayer changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let subdomains = 'abcd';
    let maxZoom = 19;

    if (activeMapLayer === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = 'abc';
    } else if (activeMapLayer === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      subdomains = 'abcd';
    }

    tileLayerRef.current = L.tileLayer(url, { maxZoom, subdomains }).addTo(leafletMapRef.current);
    tileLayerRef.current.bringToBack();
  }, [activeMapLayer]);

  // Handle Live Doppler Weather Radar Overlay Layer
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (radarLayerRef.current) {
      leafletMapRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (showRadarOverlay) {
      fetchRainViewerMetadata()
        .then((data) => {
          if (data && data.radar && data.radar.past && data.radar.past.length > 0 && leafletMapRef.current) {
            const host = data.host || 'https://tilecache.rainviewer.com';
            const path = data.radar.past[data.radar.past.length - 1].path;
            const radarUrl = `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;

            radarLayerRef.current = L.tileLayer(radarUrl, {
              opacity: 0.65,
              zIndex: 50,
            }).addTo(leafletMapRef.current);
          }
        })
        .catch((e) => console.warn('Radar overlay fetch failed:', e));
    }
  }, [showRadarOverlay]);

  // 3. Whenever Selected Route or Departure Offset changes, recalculate route and simulate weather
  useEffect(() => {
    let isCancelled = false;

    const runRoutePipeline = async () => {
      if (!selectedRoute?.fromCoords || !selectedRoute?.toCoords) return;

      // 1. Fetch Real Road Geometry
      const roadData = await fetchOSRMRoute(selectedRoute.fromCoords, selectedRoute.toCoords);
      if (isCancelled) return;

      setRoutePolyline(roadData.coordinates);

      // Create intermediate waypoints along actual road geometry if not provided
      let routeWaypoints = selectedRoute.waypoints || [];
      if (!routeWaypoints.length || isCustomMode) {
        const coords = roadData.coordinates;
        const totalPoints = coords.length;
        const numWaypoints = roadData.distanceKm > 200 ? 3 : 2;
        routeWaypoints = [];

        for (let i = 1; i <= numWaypoints; i++) {
          const idx = Math.min(Math.floor((totalPoints * i) / (numWaypoints + 1)), totalPoints - 1);
          const [wLat, wLon] = coords[idx];
          const fraction = i / (numWaypoints + 1);
          const offsetHour = parseFloat((roadData.driveHours * fraction).toFixed(1));
          const kmMark = Math.round(roadData.distanceKm * fraction);

          routeWaypoints.push({
            name: `${activeLanguage === 'ta' ? 'வழித்தட புள்ளி' : 'Checkpoint'} ${i} (${kmMark} km)`,
            offsetHour,
            lat: wLat,
            lon: wLon,
          });
        }
      }

      // 2. Simulate Weather along Waypoints
      await simulateRouteWeather(
        {
          ...selectedRoute,
          distanceKm: roadData.distanceKm,
          driveHours: roadData.driveHours,
          waypoints: routeWaypoints,
        },
        departureOffset,
        roadData.coordinates
      );
    };

    runRoutePipeline();

    return () => {
      isCancelled = true;
    };
  }, [selectedRoute.id, departureOffset, activeLanguage]);

  // Robust city resolver with local dictionary fallback
  const resolveCity = async (text) => {
    const clean = (text || '').trim().toLowerCase();
    if (TN_CITY_COORDS[clean]) return TN_CITY_COORDS[clean];
    for (const [k, v] of Object.entries(TN_CITY_COORDS)) {
      if (clean.includes(k) || k.includes(clean)) return v;
    }
    const results = await searchLocation(text);
    if (results && results.length > 0) return results[0];
    return null;
  };

  // Handle Origin Search
  const handleOriginSearch = async (val) => {
    setOriginQuery(val);
    setSearchError('');
    if (val.trim().length >= 2) {
      try {
        const results = await searchLocation(val.trim());
        setOriginSuggestions(results.slice(0, 4));
      } catch (e) {
        setOriginSuggestions([]);
      }
    } else {
      setOriginSuggestions([]);
    }
  };

  // Handle Destination Search
  const handleDestSearch = async (val) => {
    setDestQuery(val);
    setSearchError('');
    if (val.trim().length >= 2) {
      try {
        const results = await searchLocation(val.trim());
        setDestSuggestions(results.slice(0, 4));
      } catch (e) {
        setDestSuggestions([]);
      }
    } else {
      setDestSuggestions([]);
    }
  };

  // Build & Apply Custom Route
  const createAndApplyCustomRoute = async (originLoc, destLoc) => {
    if (!originLoc || !destLoc) return;

    const fromCoords = {
      lat: originLoc.latitude ?? originLoc.lat,
      lon: originLoc.longitude ?? originLoc.lon,
    };
    const toCoords = {
      lat: destLoc.latitude ?? destLoc.lat,
      lon: destLoc.longitude ?? destLoc.lon,
    };

    const roadData = await fetchOSRMRoute(fromCoords, toCoords);

    const customRouteObj = {
      id: `custom-${Date.now()}`,
      from: originLoc.name || 'Origin',
      fromCoords,
      to: destLoc.name || 'Destination',
      toCoords,
      distanceKm: roadData.distanceKm,
      driveHours: roadData.driveHours,
      waypoints: [],
    };

    setSelectedRoute(customRouteObj);
    setIsCustomMode(true);
    setSearchError('');

    // Smooth scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);
  };

  // Execute Direct Search & Calculate Route Weather
  const handleExecuteRouteSearch = async (e) => {
    if (e) e.preventDefault();
    setSearchError('');

    const startTxt = (customOrigin?.name || originQuery).trim();
    const destTxt = (customDest?.name || destQuery).trim();

    if (!startTxt || !destTxt) {
      setSearchError(
        activeLanguage === 'ta'
          ? 'தயவுசெய்து புறப்படும் இடம் மற்றும் சேருமிடம் இரண்டையும் உள்ளிடவும்.'
          : 'Please enter both Origin and Destination locations.'
      );
      return;
    }

    setIsSearchingRoute(true);
    try {
      let resolvedOrigin = customOrigin;
      if (!resolvedOrigin || resolvedOrigin.name.toLowerCase() !== startTxt.toLowerCase()) {
        resolvedOrigin = await resolveCity(startTxt);
        if (!resolvedOrigin) {
          throw new Error(
            activeLanguage === 'ta'
              ? `புறப்படும் இடம் "${startTxt}" கிடைக்கவில்லை. எழுத்துப் பிழையைச் சரிபார்க்கவும்.`
              : `Origin location "${startTxt}" not found. Please check spelling.`
          );
        }
        setCustomOrigin(resolvedOrigin);
        setOriginQuery(resolvedOrigin.name);
      }

      let resolvedDest = customDest;
      if (!resolvedDest || resolvedDest.name.toLowerCase() !== destTxt.toLowerCase()) {
        resolvedDest = await resolveCity(destTxt);
        if (!resolvedDest) {
          throw new Error(
            activeLanguage === 'ta'
              ? `சேருமிடம் "${destTxt}" கிடைக்கவில்லை. எழுத்துப் பிழையைச் சரிபார்க்கவும்.`
              : `Destination location "${destTxt}" not found. Please check spelling.`
          );
        }
        setCustomDest(resolvedDest);
        setDestQuery(resolvedDest.name);
      }

      setOriginSuggestions([]);
      setDestSuggestions([]);
      await createAndApplyCustomRoute(resolvedOrigin, resolvedDest);
    } catch (err) {
      setSearchError(err.message || 'Route calculation failed');
    } finally {
      setIsSearchingRoute(false);
    }
  };

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    const prevOrigin = customOrigin;
    const prevOriginQ = originQuery;
    const prevDest = customDest;
    const prevDestQ = destQuery;

    setCustomOrigin(prevDest);
    setOriginQuery(prevDestQ || prevDest?.name || '');
    setCustomDest(prevOrigin);
    setDestQuery(prevOriginQ || prevOrigin?.name || '');
    setOriginSuggestions([]);
    setDestSuggestions([]);
    setSearchError('');

    if (prevDest && prevOrigin) {
      createAndApplyCustomRoute(prevDest, prevOrigin);
    }
  };

  // Use GPS / Current Location for Origin
  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      const locObj = {
        name: currentLocation.name || 'Current Location',
        latitude: currentLocation.lat || 13.0827,
        longitude: currentLocation.lon || 80.2707,
        admin1: 'Current GPS',
      };
      setCustomOrigin(locObj);
      setOriginQuery(locObj.name);
      setOriginSuggestions([]);
      setSearchError('');

      if (customDest) {
        createAndApplyCustomRoute(locObj, customDest);
      }
    }
  };

  // Clear Custom Search Fields
  const handleClearCustomInputs = () => {
    setCustomOrigin(null);
    setOriginQuery('');
    setCustomDest(null);
    setDestQuery('');
    setOriginSuggestions([]);
    setDestSuggestions([]);
    setSearchError('');
  };

  // 4. Simulate Weather along Waypoints & Render Leaflet Visual Overlays
  const simulateRouteWeather = async (route, depHour, polylineCoords) => {
    setIsSimulating(true);
    try {
      const now = new Date();
      const points = [
        { name: route.from, lat: route.fromCoords.lat, lon: route.fromCoords.lon, hourOffset: 0, isStart: true },
        ...route.waypoints.map((w) => ({ ...w, hourOffset: w.offsetHour })),
        { name: route.to, lat: route.toCoords.lat, lon: route.toCoords.lon, hourOffset: route.driveHours, isEnd: true },
      ];

      // Fetch NWP weather for all waypoints concurrently
      const fetched = await Promise.all(
        points.map(async (pt) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${pt.lat}&longitude=${pt.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,visibility&forecast_days=2&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();
            const targetHourIndex = Math.min(Math.round(depHour + pt.hourOffset), 23);
            const h = data.hourly || {};

            const temp = Math.round(h.temperature_2m?.[targetHourIndex] ?? 28);
            const rainProb = h.precipitation_probability?.[targetHourIndex] ?? 10;
            const rainMm = h.precipitation?.[targetHourIndex] ?? 0;
            const code = h.weather_code?.[targetHourIndex] ?? 0;
            const wind = Math.round(h.wind_speed_10m?.[targetHourIndex] ?? 15);
            const vis = h.visibility?.[targetHourIndex] ? Math.round(h.visibility[targetHourIndex] / 1000) : 10;
            const wmo = getWeatherDescription(code, activeLanguage);

            const arrivalTime = new Date(now.getTime() + (depHour + pt.hourOffset) * 3600000);
            const arrivalStr = arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

            return {
              ...pt,
              arrivalStr,
              temp,
              rainProb,
              rainMm,
              wind,
              vis,
              wmo,
              isRainy: rainProb >= 40 || rainMm > 0.5,
              isFoggy: vis <= 3,
              isGale: wind >= 35,
            };
          } catch (e) {
            return {
              ...pt,
              arrivalStr: `${Math.round(depHour + pt.hourOffset)}h`,
              temp: 27,
              rainProb: 15,
              rainMm: 0,
              wind: 12,
              vis: 10,
              wmo: { label: 'Clear Sky' },
              isRainy: false,
              isFoggy: false,
              isGale: false,
            };
          }
        })
      );

      setRouteSimulation(fetched);

      // Compute Route Safety Score (0-100)
      let score = 100;
      const hazards = [];

      fetched.forEach((pt) => {
        if (pt.isRainy) {
          score -= 12;
          hazards.push({ point: pt.name, type: 'Rain / Wet Road', time: pt.arrivalStr, severity: 'amber' });
        }
        if (pt.isFoggy) {
          score -= 15;
          hazards.push({ point: pt.name, type: 'Dense Fog / Low Visibility (<3 km)', time: pt.arrivalStr, severity: 'red' });
        }
        if (pt.isGale) {
          score -= 10;
          hazards.push({ point: pt.name, type: 'Crosswind Gusts (>35 km/h)', time: pt.arrivalStr, severity: 'amber' });
        }
      });

      setOverallSafetyScore(Math.max(score, 30));
      setHazardPoints(hazards);

      // Render Leaflet Map Elements
      renderLeafletRouteMap(polylineCoords || routePolyline, fetched, route);
    } catch (err) {
      console.error('Route simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // 5. Draw Polyline & Markers on Leaflet Map
  const renderLeafletRouteMap = (coords, waypointsData, route) => {
    if (!leafletMapRef.current) return;
    const map = leafletMapRef.current;

    // Clear previous layers
    if (polylineLayerRef.current) polylineLayerRef.current.clearLayers();
    if (markersLayerRef.current) markersLayerRef.current.clearLayers();
    markerObjMapRef.current = {};

    if (!coords || coords.length === 0) return;

    // Outer Glow / Casing Polyline
    const outerPolyline = L.polyline(coords, {
      color: '#1d4ed8',
      weight: 7,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
    });

    // Inner Google Maps-style Blue Route Polyline
    const innerPolyline = L.polyline(coords, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    });

    polylineLayerRef.current.addLayer(outerPolyline);
    polylineLayerRef.current.addLayer(innerPolyline);

    // Fit map bounds to the polyline with pleasant padding
    try {
      const bounds = innerPolyline.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 13,
        });
      }
    } catch (e) {
      console.warn('Map fitBounds error:', e);
    }

    // Add Markers for Start, End, and Waypoints
    waypointsData.forEach((pt, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === waypointsData.length - 1;

      let markerHtml = '';
      let iconSize = [36, 36];
      let iconAnchor = [18, 18];

      if (isStart) {
        // Origin Pin (Green Pulse Marker)
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute -inset-1 rounded-full bg-emerald-500/40 pulse-start-marker"></div>
            <div class="relative w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs ring-2 ring-emerald-300">
              A
            </div>
          </div>
        `;
        iconSize = [34, 34];
        iconAnchor = [17, 17];
      } else if (isEnd) {
        // Destination Pin (Red/Rose Pulse Marker)
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute -inset-1 rounded-full bg-rose-500/40 pulse-dest-marker"></div>
            <div class="relative w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs ring-2 ring-rose-300">
              B
            </div>
          </div>
        `;
        iconSize = [34, 34];
        iconAnchor = [17, 17];
      } else {
        // Checkpoint Weather Badge Pin
        const isRainy = pt.isRainy;
        const isFog = pt.isFoggy;
        const bgBadge = isRainy
          ? 'bg-sky-600 text-white border-white'
          : isFog
          ? 'bg-amber-600 text-white border-white'
          : 'bg-white text-slate-800 border-slate-300';

        markerHtml = `
          <div class="flex items-center space-x-1 px-2 py-1 rounded-full ${bgBadge} border shadow-md text-[10px] font-black cursor-pointer transform hover:scale-110 transition-transform whitespace-nowrap">
            <span>${isRainy ? '🌧️' : isFog ? '🌫️' : '☀️'}</span>
            <span>${pt.temp}°C</span>
          </div>
        `;
        iconSize = [64, 26];
        iconAnchor = [32, 13];
      }

      const customDivIcon = L.divIcon({
        className: 'route-map-marker',
        html: markerHtml,
        iconSize,
        iconAnchor,
      });

      const marker = L.marker([pt.lat, pt.lon], { icon: customDivIcon }).addTo(markersLayerRef.current);

      // Bind Rich Popup
      const popupHtml = `
        <div class="p-1 font-sans text-xs min-w-[210px]">
          <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-100">
            <span class="font-extrabold text-slate-900 text-sm">${pt.name}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isStart ? 'bg-emerald-100 text-emerald-800' : isEnd ? 'bg-rose-100 text-rose-800' : 'bg-sky-100 text-sky-800'
            }">${isStart ? 'Origin' : isEnd ? 'Destination' : `Checkpoint #${idx}`}</span>
          </div>
          <div class="space-y-1 text-slate-600 text-[11px]">
            <div class="flex justify-between">
              <span>ETA Arrival:</span>
              <b class="text-slate-900">${pt.arrivalStr}</b>
            </div>
            <div class="flex justify-between">
              <span>Weather:</span>
              <b class="${pt.isRainy ? 'text-sky-600' : 'text-slate-800'}">${pt.wmo?.label || 'Clear'}</b>
            </div>
            <div class="flex justify-between">
              <span>Temperature:</span>
              <b>${pt.temp}°C</b>
            </div>
            <div class="flex justify-between">
              <span>Rain Probability:</span>
              <b class="${pt.rainProb >= 40 ? 'text-sky-600' : 'text-slate-700'}">${pt.rainProb}%</b>
            </div>
            <div class="flex justify-between">
              <span>Wind Speed:</span>
              <b>${pt.wind} km/h</b>
            </div>
            <div class="flex justify-between">
              <span>Visibility:</span>
              <b class="${pt.vis <= 3 ? 'text-rose-600' : 'text-slate-700'}">${pt.vis} km</b>
            </div>
          </div>
          ${
            pt.isRainy || pt.isFoggy
              ? `<div class="mt-1.5 p-1 rounded bg-amber-50 text-[10px] text-amber-800 font-bold border border-amber-200">
                  ⚠️ ${pt.isRainy ? 'Wet road surface expected' : 'Low visibility fog risk'}
                 </div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: isStart || isEnd ? [0, -10] : [0, -5],
      });

      markerObjMapRef.current[idx] = marker;
    });
  };

  // Fly to specific waypoint when clicked in the timeline
  const handleFocusWaypoint = (idx) => {
    const pt = routeSimulation[idx];
    if (pt && leafletMapRef.current) {
      leafletMapRef.current.flyTo([pt.lat, pt.lon], 12, { duration: 1.2 });
      setTimeout(() => {
        const marker = markerObjMapRef.current[idx];
        if (marker) marker.openPopup();
      }, 1200);
    }
  };

  // Fit all route bounds on button click
  const handleFitRouteBounds = () => {
    if (leafletMapRef.current && polylineLayerRef.current) {
      try {
        const bounds = polylineLayerRef.current.getBounds();
        if (bounds.isValid()) {
          leafletMapRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
        }
      } catch (e) {
        console.warn('Fit bounds error:', e);
      }
    }
  };

  // Google Maps Direct Navigation Link URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${selectedRoute.fromCoords.lat},${selectedRoute.fromCoords.lon}&destination=${selectedRoute.toCoords.lat},${selectedRoute.toCoords.lon}&travelmode=driving`;

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* 1. Header Card with Corridor Chooser & Custom Search */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 shadow-xs">
              <Navigation className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {activeLanguage === 'ta' ? 'பயணப் பாதை வானிலை & நேரலை வரைபடம்' : 'Live Highway Route Map & Weather Planner'}
              </h2>
              <p className="text-xs text-slate-500">
                {activeLanguage === 'ta'
                  ? 'கூகிள் மேப்ஸ் போன்ற நேரலை வரைபடம், உண்மையான சாலை தூரம் & வழித்தட வானிலை'
                  : 'Google Maps-style road routing, live road distance telemetry & multi-waypoint weather'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>OSRM Highway GIS</span>
            </span>
          </div>
        </div>

        {/* Custom Origin & Destination Input Form */}
        <form
          onSubmit={handleExecuteRouteSearch}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-50/80 via-indigo-50/70 to-blue-50/80 border border-sky-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center space-x-1.5">
              <Search className="w-3.5 h-3.5 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'உங்கள் சொந்த வழித்தடத்தைத் தேடுங்கள்' : 'Custom Route Planner (Any Cities / Towns)'}</span>
            </span>
            <div className="flex items-center space-x-2">
              {currentLocation && (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-[10px] font-bold text-sky-700 hover:text-sky-800 bg-white hover:bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 shadow-2xs transition-all cursor-pointer flex items-center space-x-1"
                  title="Use Current Location for Origin"
                >
                  <LocateFixed className="w-3 h-3 text-emerald-600" />
                  <span>{activeLanguage === 'ta' ? 'என் இருப்பிடம்' : 'Use My GPS'}</span>
                </button>
              )}
              {(originQuery || destQuery || customOrigin || customDest) && (
                <button
                  type="button"
                  onClick={handleClearCustomInputs}
                  className="text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 px-2 py-0.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                  title="Clear inputs"
                >
                  {activeLanguage === 'ta' ? 'அழி' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          {/* Search Inputs with Middle Swap Button */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 relative">
            {/* Origin Input */}
            <div className="relative">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-2 shadow-2xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={originQuery}
                  onChange={(e) => handleOriginSearch(e.target.value)}
                  placeholder={customOrigin ? customOrigin.name : (activeLanguage === 'ta' ? 'புறப்படும் ஊர் (எ.கா: சென்னை)' : 'From (Origin city / town)...')}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-medium"
                />
                {originQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setOriginQuery('');
                      setCustomOrigin(null);
                      setOriginSuggestions([]);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Origin Autocomplete Suggestions */}
              {originSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100">
                  {originSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomOrigin(s);
                        setOriginQuery(s.name);
                        setOriginSuggestions([]);
                        if (customDest) createAndApplyCustomRoute(s, customDest);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-700 font-medium transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{s.name}, {s.admin1 || s.country}</span>
                      <span className="text-[9px] text-slate-400">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-0.5 sm:my-0">
              <button
                type="button"
                onClick={handleSwapLocations}
                className="p-2 rounded-xl bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-600 border border-slate-200 shadow-2xs hover:border-sky-300 transition-all cursor-pointer"
                title={activeLanguage === 'ta' ? 'இடங்களை மாற்று (Swap)' : 'Swap Origin & Destination'}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 rotate-90 sm:rotate-0" />
              </button>
            </div>

            {/* Destination Input */}
            <div className="relative">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-2 shadow-2xs focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                <div className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={destQuery}
                  onChange={(e) => handleDestSearch(e.target.value)}
                  placeholder={customDest ? customDest.name : (activeLanguage === 'ta' ? 'சென்றடையும் ஊர் (எ.கா: மதுரை)' : 'To (Destination city / town)...')}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-medium"
                />
                {destQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestQuery('');
                      setCustomDest(null);
                      setDestSuggestions([]);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Destination Autocomplete Suggestions */}
              {destSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100">
                  {destSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomDest(s);
                        setDestQuery(s.name);
                        setDestSuggestions([]);
                        if (customOrigin) createAndApplyCustomRoute(customOrigin, s);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-700 font-medium transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{s.name}, {s.admin1 || s.country}</span>
                      <span className="text-[9px] text-slate-400">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {searchError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-slate-500 font-medium self-start sm:self-auto">
              {isCustomMode && selectedRoute.from ? (
                <span className="text-sky-800 font-bold flex items-center space-x-1.5 bg-white/90 px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs">
                  <Route className="w-3.5 h-3.5 text-sky-600 inline" />
                  <span>{selectedRoute.from} ➔ {selectedRoute.to} ({selectedRoute.distanceKm} km • ~{selectedRoute.driveHours}h)</span>
                </span>
              ) : (
                <span>{activeLanguage === 'ta' ? 'ஊர்களை உள்ளிட்டு "Search & Plan" அழுத்தவும்' : 'Enter 2 locations & click Search to analyze live route & weather'}</span>
              )}
            </div>

            {/* Calculate Route Weather Button */}
            <button
              type="submit"
              disabled={isSearchingRoute || (!originQuery.trim() && !customOrigin) || (!destQuery.trim() && !customDest)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-sky-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearchingRoute || isSimulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{activeLanguage === 'ta' ? 'வரைபடம் ஏற்றப்படுகிறது...' : 'Loading Highway Telemetry...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>{activeLanguage === 'ta' ? 'வழித்தடத்தைக் கணக்கிடு (Show Route Map)' : 'Search & Plan Route Map'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* AI Suggested Popular Corridors Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{activeLanguage === 'ta' ? 'பிரபலமான நெடுஞ்சாலை வழித்தடங்கள் (AI Suggested):' : 'AI Popular Highway Corridors:'}</span>
          </label>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_ROUTES.map((rt) => (
              <button
                key={rt.id}
                onClick={() => {
                  setSelectedRoute(rt);
                  setIsCustomMode(false);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  selectedRoute.id === rt.id && !isCustomMode
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 ring-2 ring-sky-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                <span>{rt.from}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{rt.to}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Departure Time Slider */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'திட்டமிட்ட புறப்படும் நேரம்:' : 'Planned Departure Time:'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-extrabold border border-sky-200">
              {departureOffset === 0
                ? (activeLanguage === 'ta' ? 'இப்போது (Now)' : 'Departing Now')
                : `+${departureOffset} ${activeLanguage === 'ta' ? 'மணி நேரத்தில்' : 'Hours from now'}`}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={departureOffset}
            onChange={(e) => setDepartureOffset(parseInt(e.target.value, 10))}
            className="w-full accent-sky-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Now</span>
            <span>+3h</span>
            <span>+6h</span>
            <span>+9h</span>
            <span>+12h</span>
          </div>
        </div>
      </div>

      {/* 2. ✨ LIVE INTERACTIVE GOOGLE-MAPS STYLE ROUTE MAP */}
      <div ref={resultsRef} className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        {/* Map Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Route className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-900">
                  {selectedRoute.from} ➔ {selectedRoute.to}
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                  {selectedRoute.distanceKm} km
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ~{selectedRoute.driveHours}h
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {activeLanguage === 'ta'
                  ? 'நேரலை நெடுஞ்சாலை வரைபடம் & வானிலை சோதனைச் சாவடிகள்'
                  : 'Live road polyline & waypoint weather checkpoints'}
              </p>
            </div>
          </div>

          {/* Map Actions: Layer Selectors + Fit Bounds + Google Maps Button */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            {/* Base Layer Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActiveMapLayer('streets')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMapLayer === 'streets' ? 'bg-white text-sky-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Google Streets View"
              >
                🚗 Street
              </button>
              <button
                type="button"
                onClick={() => setActiveMapLayer('satellite')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMapLayer === 'satellite' ? 'bg-white text-sky-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Satellite View"
              >
                🛰️ Satellite
              </button>
              <button
                type="button"
                onClick={() => setActiveMapLayer('dark')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  activeMapLayer === 'dark' ? 'bg-white text-sky-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Night Highway Mode"
              >
                🌙 Night
              </button>
            </div>

            {/* Radar Overlay Toggle */}
            <button
              type="button"
              onClick={() => setShowRadarOverlay(!showRadarOverlay)}
              className={`text-[10px] font-bold px-2 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-1 ${
                showRadarOverlay
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
              title="Toggle Live RainViewer Radar Cloud Overlay"
            >
              <CloudRain className="w-3 h-3" />
              <span>{activeLanguage === 'ta' ? 'மழை ரேடார்' : 'Live Radar'}</span>
            </button>

            {/* Fit Bounds Button */}
            <button
              type="button"
              onClick={handleFitRouteBounds}
              className="p-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title="Center & Fit Full Route"
            >
              <LocateFixed className="w-3.5 h-3.5" />
            </button>

            {/* Expand / Shrink Map Height */}
            <button
              type="button"
              onClick={() => {
                setIsMapExpanded(!isMapExpanded);
                setTimeout(() => {
                  if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
                }, 150);
              }}
              className="p-1.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title={isMapExpanded ? 'Collapse Map' : 'Expand Map'}
            >
              {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Open in Google Maps Direct Action */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
              title="Open turn-by-turn navigation in Google Maps"
            >
              <span>{activeLanguage === 'ta' ? 'Google Maps திறக்க' : 'Google Maps'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Embedded Leaflet Map Container */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner">
          <div
            ref={mapContainerRef}
            style={{ height: isMapExpanded ? '600px' : '440px', width: '100%' }}
            className="z-10 transition-all duration-300"
          />

          {/* Overlay Map Badge (Bottom Left) */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center space-x-2 text-[10px] font-bold text-slate-800">
              <span className="flex items-center space-x-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                <span>A: {selectedRoute.from}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center space-x-1 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                <span>B: {selectedRoute.to}</span>
              </span>
            </div>
          </div>

          {/* Loading Indicator for OSRM / Weather Simulation */}
          {(isSimulating || isFetchingOSRM) && (
            <div className="absolute top-3 right-3 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-200 shadow-md flex items-center space-x-1.5 text-xs text-sky-700 font-bold animate-fadeIn">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'சாலை தரவு புதுப்பிக்கப்படுகிறது...' : 'Updating Route Data...'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Route Safety Score & Distance Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Safety Score Meter */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'பயண பாதுகாப்பு குறியீடு' : 'Route Safety Index'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-black ${
              overallSafetyScore >= 80 ? 'text-emerald-600' : overallSafetyScore >= 60 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {overallSafetyScore}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md self-start ${
            overallSafetyScore >= 80
              ? 'bg-emerald-100 text-emerald-800'
              : overallSafetyScore >= 60
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          }`}>
            {overallSafetyScore >= 80
              ? (activeLanguage === 'ta' ? 'பயணத்திற்கு உகந்தது' : 'Optimal Highway Driving')
              : overallSafetyScore >= 60
              ? (activeLanguage === 'ta' ? 'மிதமான மழை எச்சரிக்கை' : 'Caution Advised')
              : (activeLanguage === 'ta' ? 'அதிக அபாயம் / ஒத்திவைக்கவும்' : 'High Hazard Risk')}
          </span>
        </div>

        {/* Distance & Driving Hours */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'தொலைவு & பயண நேரம்' : 'Distance & Duration'}</span>
            <Car className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{selectedRoute.distanceKm} km</div>
            <div className="text-xs text-slate-500 font-medium">~{selectedRoute.driveHours} hours driving time</div>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-500">
            <Fuel className="w-3 h-3 text-amber-500" />
            <span>~{Math.round(selectedRoute.distanceKm / 15)} L fuel / ~{Math.round(selectedRoute.distanceKm * 0.15)} kWh EV</span>
          </div>
        </div>

        {/* AI Optimal Window */}
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{activeLanguage === 'ta' ? 'சிறந்த புறப்படும் நேரம்' : 'AI Departure Window'}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-black text-slate-900 leading-tight">
            {hazardPoints.length === 0
              ? (activeLanguage === 'ta' ? 'இப்போதே புறப்படலாம்' : 'Depart Immediately')
              : (activeLanguage === 'ta' ? 'அடுத்த 2 மணி நேரம் உகந்தது' : 'Optimal at +2 Hours')}
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            {hazardPoints.length === 0
              ? (activeLanguage === 'ta' ? 'முழு வழித்தடத்திலும் தெளிவான வானிலை.' : 'Clear dry highway across all waypoints.')
              : (activeLanguage === 'ta' ? 'மழை பெய்வதற்கு முன் அல்லது பின் பயணிக்கவும்.' : 'Avoid peak rain window along ghats/highways.')}
          </p>
        </div>
      </div>

      {/* 4. Hazard Warnings Callout */}
      {hazardPoints.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs space-y-2 animate-fadeIn">
          <div className="flex items-center space-x-2 text-amber-800 font-extrabold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{activeLanguage === 'ta' ? 'வழித்தட வானிலை எச்சரிக்கைகள்' : 'Active Route Weather Hazards'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {hazardPoints.map((hz, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/90 border border-amber-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{hz.point}</span>
                  <p className="text-[10px] text-amber-700">{hz.type}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{hz.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Interactive Waypoint-by-Waypoint Telemetry Timeline */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>{activeLanguage === 'ta' ? 'வழித்தட வாரியான நேரலை முன்னறிவிப்பு' : 'Waypoint-by-Waypoint Live Telemetry'}</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {activeLanguage === 'ta' ? 'வரைபடத்தில் பார்க்க ஏதேனும் ஒரு சோதனைச் சாவடியைக் கிளிக் செய்யவும்' : 'Click any checkpoint below to focus and inspect on the map'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => simulateRouteWeather(selectedRoute, departureOffset, routePolyline)}
              disabled={isSimulating}
              className="text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200 flex items-center space-x-1 transition-all cursor-pointer"
              title="Reload Route Forecast"
            >
              <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin text-sky-600' : ''}`} />
              <span>{activeLanguage === 'ta' ? 'மீண்டும் ஏற்று' : 'Reload'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {routeSimulation.map((pt, idx) => {
            const isOrigin = idx === 0;
            const isDestination = idx === routeSimulation.length - 1;

            return (
              <div
                key={idx}
                onClick={() => handleFocusWaypoint(idx)}
                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                  pt.isRainy || pt.isFoggy
                    ? 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200'
                    : 'bg-slate-50/70 hover:bg-sky-50/70 border-slate-200/70'
                }`}
                title="Click to pan map to this checkpoint"
              >
                {/* Waypoint Identity & ETA */}
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl text-white font-black text-xs flex items-center justify-center h-8 w-8 flex-shrink-0 ${
                    isOrigin ? 'bg-emerald-600' : isDestination ? 'bg-rose-600' : 'bg-sky-600'
                  }`}>
                    {isOrigin ? 'A' : isDestination ? 'B' : idx}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-black text-slate-900">{pt.name}</span>
                      {isOrigin && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">Start</span>
                      )}
                      {isDestination && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold">End</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium flex items-center space-x-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>ETA: {pt.arrivalStr}</span>
                      <span>•</span>
                      <span>{pt.wmo?.label || 'Clear'}</span>
                    </div>
                  </div>
                </div>

                {/* Weather Metrics Grid */}
                <div className="grid grid-cols-4 gap-2 text-center sm:text-right">
                  {/* Temp */}
                  <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">Temp</span>
                    <span className="text-xs font-black text-slate-800">{pt.temp}°C</span>
                  </div>

                  {/* Rain */}
                  <div className={`p-1.5 rounded-lg border ${
                    pt.rainProb >= 40 ? 'bg-sky-50 border-sky-200 text-sky-800 font-bold' : 'bg-white border-slate-100 text-slate-700'
                  }`}>
                    <span className="text-[9px] text-slate-400 block">Rain</span>
                    <span className="text-xs font-black">{pt.rainProb}%</span>
                  </div>

                  {/* Wind */}
                  <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">Wind</span>
                    <span className="text-xs font-bold text-slate-700">{pt.wind} km/h</span>
                  </div>

                  {/* Visibility */}
                  <div className={`p-1.5 rounded-lg border ${
                    pt.vis <= 3 ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold' : 'bg-white border-slate-100 text-slate-700'
                  }`}>
                    <span className="text-[9px] text-slate-400 block">Visibility</span>
                    <span className="text-xs font-bold">{pt.vis} km</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

