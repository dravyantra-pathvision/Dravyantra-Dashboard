// src/components/maps/LiveTripGoogleMap.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMapsScript, GOOGLE_MAPS_API_KEY, calculateOptimizedDrivingRoute } from '@/lib/google-maps';
import {
  Truck,
  Navigation,
  MapPin,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw,
  LocateFixed,
  AlertCircle,
  Clock,
  Gauge,
  Route,
} from 'lucide-react';
import type { Trip, Vehicle } from '@/types';
import { cn } from '@/lib/utils';

interface LiveTripGoogleMapProps {
  trip?: Trip | null;
  origin?: string;
  destination?: string;
  vehicleData?: Vehicle | null;
  height?: string | number;
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
  autoAnimate?: boolean;
}

export function LiveTripGoogleMap({
  trip,
  origin,
  destination,
  vehicleData,
  height = '360px',
  className,
  showControls = true,
  interactive = true,
  autoAnimate = true,
}: LiveTripGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const vehicleMarkerRef = useRef<google.maps.Marker | null>(null);
  const startMarkerRef = useRef<google.maps.Marker | null>(null);
  const endMarkerRef = useRef<google.maps.Marker | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(trip?.progress ?? 0.35);
  const [routeInfo, setRouteInfo] = useState<{
    distanceText: string;
    durationText: string;
    routeSummary: string;
  } | null>(null);

  const originQuery = origin || trip?.from || trip?.origin || 'Mumbai, Maharashtra';
  const destinationQuery = destination || trip?.to || trip?.destination || 'Pune, Maharashtra';
  const isTripRunning = trip?.status === 'running' || trip?.status === 'active';
  const isTripCompleted = trip?.status === 'completed' || trip?.tripCompleted === true;

  // Track polyline path coordinates
  const pathPointsRef = useRef<google.maps.LatLng[]>([]);

  // Initialize Google Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const googleMaps = await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY);
        if (!isMounted || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = new googleMaps.maps.Map(mapContainerRef.current, {
            center: { lat: 19.076, lng: 72.8777 }, // Default center India
            zoom: 7,
            mapTypeId: mapType,
            disableDefaultUI: !interactive,
            zoomControl: interactive,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
              {
                featureType: 'transit',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'off' }],
              },
            ],
          });

          mapInstanceRef.current = map;
          setMapLoaded(true);
        }
      } catch (err) {
        console.error('Failed to init Google Map:', err);
        if (isMounted) {
          setMapError('Failed to load Google Maps. Please check your network and API key.');
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [interactive]);

  // Toggle map type
  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    const nextType = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(nextType);
    setMapType(nextType);
  };

  // Render Route and Markers
  const drawRoute = useCallback(async () => {
    if (!mapInstanceRef.current || !window.google?.maps || !originQuery || !destinationQuery) return;
    const googleMaps = window.google;

    // Clear existing elements
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
    if (startMarkerRef.current) startMarkerRef.current.setMap(null);
    if (endMarkerRef.current) endMarkerRef.current.setMap(null);
    if (routePolylineRef.current) routePolylineRef.current.setMap(null);

    const route = await calculateOptimizedDrivingRoute(originQuery, destinationQuery);
    if (route && route.pathCoordinates.length > 0 && mapInstanceRef.current) {
      setRouteInfo({
        distanceText: route.distanceText || `${trip?.distance || 0} km`,
        durationText: route.durationText || '',
        routeSummary: route.routeSummary || 'Optimal Route',
      });

      // Save path points
      pathPointsRef.current = route.pathCoordinates.map(
        (pt) => new googleMaps.maps.LatLng(pt.lat, pt.lng)
      );

      // Draw rich custom polyline
      const polyline = new googleMaps.maps.Polyline({
        path: pathPointsRef.current,
        geodesic: true,
        strokeColor: '#2563EB', // Blue-600
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: mapInstanceRef.current!,
      });
      routePolylineRef.current = polyline;

      // Fit bounds
      const bounds = new googleMaps.maps.LatLngBounds();
      route.pathCoordinates.forEach((pt) => bounds.extend(new googleMaps.maps.LatLng(pt.lat, pt.lng)));
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });

      // Custom Origin Marker (Green)
      startMarkerRef.current = new googleMaps.maps.Marker({
        position: route.startLocation,
        map: mapInstanceRef.current!,
        title: `Origin: ${originQuery}`,
        icon: {
          path: googleMaps.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
      });

      // Custom Destination Marker (Red)
      endMarkerRef.current = new googleMaps.maps.Marker({
        position: route.endLocation,
        map: mapInstanceRef.current!,
        title: `Destination: ${destinationQuery}`,
        icon: {
          path: googleMaps.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
      });
    }
  }, [originQuery, destinationQuery, trip?.distance]);

  useEffect(() => {
    if (mapLoaded) {
      drawRoute();
    }
  }, [mapLoaded, drawRoute]);

  // Live Vehicle Animation along the Polyline
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google?.maps) return;
    const googleMaps = window.google;

    // Position vehicle marker along route path
    const path = pathPointsRef.current;
    if (!path || path.length === 0) return;

    let targetProgress = isTripCompleted ? 1.0 : trip?.progress ?? (isTripRunning ? 0.45 : 0.0);
    let animatedProg = currentProgress > 0 ? currentProgress : targetProgress;

    const totalPoints = path.length;
    const initialIndex = Math.min(totalPoints - 1, Math.floor(animatedProg * (totalPoints - 1)));
    const initialPos = path[initialIndex] || path[0];

    // Create or update Vehicle Marker
    if (!vehicleMarkerRef.current && initialPos) {
      const truckSvg = {
        path: 'M18 18.5a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 1-1.5 1.5H18zm-15 0A1.5 1.5 0 0 1 1.5 17V6.5A1.5 1.5 0 0 1 3 5h10.5A1.5 1.5 0 0 1 15 6.5V17a1.5 1.5 0 0 1-1.5 1.5H3zm2.5-3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
        fillColor: '#2563EB',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 1.3,
        anchor: new googleMaps.maps.Point(10, 10),
      };

      vehicleMarkerRef.current = new googleMaps.maps.Marker({
        position: initialPos,
        map: mapInstanceRef.current,
        title: `Vehicle: ${trip?.vehicle || 'Fleet Truck'}`,
        icon: truckSvg,
        zIndex: 1000,
      });
    } else if (vehicleMarkerRef.current && initialPos) {
      vehicleMarkerRef.current.setPosition(initialPos);
    }

    // Animation interval for live vehicle movement simulation
    const interval = setInterval(() => {
      if (!autoAnimate || pathPointsRef.current.length === 0) return;

      if (isTripRunning) {
        // Increment live progress smoothly
        animatedProg = (animatedProg + 0.001) % 0.98;
        if (animatedProg < 0.05) animatedProg = 0.05;
      } else if (isTripCompleted) {
        animatedProg = 1.0;
      } else {
        animatedProg = 0.0;
      }

      setCurrentProgress(animatedProg);

      // Compute position on polyline
      const pts = pathPointsRef.current;
      const pointIndex = Math.min(
        pts.length - 1,
        Math.floor(animatedProg * (pts.length - 1))
      );
      const currentPoint = pts[pointIndex];

      if (currentPoint && vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setPosition(currentPoint);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mapLoaded, trip?.progress, trip?.vehicle, isTripRunning, isTripCompleted, autoAnimate, currentProgress]);

  // Recenter on vehicle
  const handleRecenter = () => {
    if (vehicleMarkerRef.current && mapInstanceRef.current) {
      const pos = vehicleMarkerRef.current.getPosition();
      if (pos) {
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(12);
      }
    }
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-sm transition-all',
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : '',
        className
      )}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* Google Map Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Error state if API key or network fails */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center z-20">
          <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
          <p className="text-xs font-semibold text-slate-200">{mapError}</p>
          <button
            onClick={() => {
              setMapError(null);
              drawRoute();
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Top HUD Telemetry Banner */}
      {showControls && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-lg border border-slate-700/60 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="font-mono text-xs font-bold text-white">{trip?.vehicle || 'Fleet Truck'}</span>
            </div>

            {routeInfo && (
              <>
                <div className="h-3 w-px bg-slate-700" />
                <div className="flex items-center gap-1 text-[11px] text-slate-200 font-medium">
                  <Route className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{routeInfo.distanceText}</span>
                </div>
                {routeInfo.durationText && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-200 font-medium">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>{routeInfo.durationText}</span>
                  </div>
                )}
              </>
            )}

            {isTripRunning && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                MOVING LIVE
              </span>
            )}
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={handleRecenter}
              title="Recenter on Vehicle"
              className="p-2 rounded-lg bg-slate-900/90 backdrop-blur shadow-md text-slate-200 hover:text-blue-400 hover:bg-slate-800 transition-colors border border-slate-700/60"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
            <button
              onClick={toggleMapType}
              title="Toggle Satellite / Roadmap"
              className="p-2 rounded-lg bg-slate-900/90 backdrop-blur shadow-md text-slate-200 hover:text-blue-400 hover:bg-slate-800 transition-colors border border-slate-700/60"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-lg bg-slate-900/90 backdrop-blur shadow-md text-slate-200 hover:text-blue-400 hover:bg-slate-800 transition-colors border border-slate-700/60"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Route Progress HUD */}
      {showControls && (
        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-slate-700/60 pointer-events-auto flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-xs font-semibold text-slate-100 truncate">
                {originQuery}
              </p>
            </div>
            <div className="flex-1 max-w-xs space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span>Progress: {Math.round(currentProgress * 100)}%</span>
                <span className="text-blue-400">{routeInfo?.routeSummary || 'Optimized Highway'}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  style={{ width: `${Math.round(currentProgress * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
              <p className="text-xs font-semibold text-slate-100 truncate">
                {destinationQuery}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
