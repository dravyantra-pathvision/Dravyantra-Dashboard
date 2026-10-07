// src/components/maps/FleetGoogleMap.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript, GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';
import { Truck, Layers, LocateFixed, RefreshCw, AlertCircle } from 'lucide-react';
import type { Vehicle } from '@/types';
import { cn } from '@/lib/utils';

interface FleetGoogleMapProps {
  vehicles: Vehicle[];
  selectedPlate?: string | null;
  onSelectVehicle?: (plate: string) => void;
  height?: string | number;
  className?: string;
}

export function FleetGoogleMap({
  vehicles,
  selectedPlate,
  onSelectVehicle,
  height = '520px',
  className,
}: FleetGoogleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersMapRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  // Filter vehicles with valid coordinates
  const validVehicles = vehicles.filter(
    (v) => v.lat != null && v.lng != null && !isNaN(Number(v.lat)) && !isNaN(Number(v.lng))
  );

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!mapContainerRef.current) return;
      try {
        const googleMaps = await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY);
        if (!isMounted || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = new googleMaps.maps.Map(mapContainerRef.current, {
            center: { lat: 20.5937, lng: 78.9629 }, // Center India
            zoom: 5,
            mapTypeId: mapType,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
          });

          mapInstanceRef.current = map;
          setMapLoaded(true);
        }
      } catch (err) {
        console.error('Failed to init Fleet Google Map:', err);
        if (isMounted) {
          setMapError('Failed to load Google Maps SDK');
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google?.maps) return;
    const googleMaps = window.google;
    const currentMarkers = markersMapRef.current;
    const activePlates = new Set(validVehicles.map((v) => v.plate));

    // Remove obsolete markers
    currentMarkers.forEach((marker, plate) => {
      if (!activePlates.has(plate)) {
        marker.setMap(null);
        currentMarkers.delete(plate);
      }
    });

    const bounds = new googleMaps.maps.LatLngBounds();

    validVehicles.forEach((v) => {
      const isSelected = v.plate === selectedPlate;
      const isMoving = v.status === 'running' || v.status === 'moving';
      const isIdle = v.status === 'idle';
      const pos = { lat: Number(v.lat), lng: Number(v.lng) };

      bounds.extend(pos);

      const markerColor = isMoving ? '#10B981' : isIdle ? '#F59E0B' : '#EF4444';

      const existingMarker = currentMarkers.get(v.plate);

      if (!existingMarker) {
        const newMarker = new googleMaps.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          title: `${v.plate} · ${v.driver || 'Driver'}`,
          label: {
            text: v.plate.slice(-4),
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: 'bold',
          },
          icon: {
            path: googleMaps.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 12 : 9,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: isSelected ? '#1E3A8A' : '#FFFFFF',
            strokeWeight: isSelected ? 3 : 2,
          },
        });

        newMarker.addListener('click', () => {
          if (onSelectVehicle) {
            onSelectVehicle(v.plate);
          }
        });

        currentMarkers.set(v.plate, newMarker);
      } else {
        existingMarker.setPosition(pos);
        existingMarker.setIcon({
          path: googleMaps.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 12 : 9,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: isSelected ? '#1E3A8A' : '#FFFFFF',
          strokeWeight: isSelected ? 3 : 2,
        });
      }
    });

    // Fit bounds if valid vehicles exist and no specific selectedPlate
    if (validVehicles.length > 0 && !selectedPlate && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [mapLoaded, validVehicles, selectedPlate, onSelectVehicle]);

  // Center on selected vehicle if changed
  useEffect(() => {
    if (!selectedPlate || !mapInstanceRef.current) return;
    const selectedVeh = validVehicles.find((v) => v.plate === selectedPlate);
    if (selectedVeh && selectedVeh.lat != null && selectedVeh.lng != null) {
      mapInstanceRef.current.panTo({ lat: Number(selectedVeh.lat), lng: Number(selectedVeh.lng) });
      mapInstanceRef.current.setZoom(13);
    }
  }, [selectedPlate, validVehicles]);

  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    const nextType = mapType === 'roadmap' ? 'hybrid' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(nextType);
    setMapType(nextType);
  };

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm', className)}
      style={{ height }}
    >
      <div ref={mapContainerRef} className="h-full w-full" />

      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/95 p-6 text-center z-20">
          <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
          <p className="text-xs font-semibold text-slate-800">{mapError}</p>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          onClick={toggleMapType}
          title="Toggle Satellite / Roadmap"
          className="p-2 rounded-lg bg-white/95 backdrop-blur shadow-md text-slate-700 hover:text-blue-600 hover:bg-white transition-colors border border-slate-200"
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
