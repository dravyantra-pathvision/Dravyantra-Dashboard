'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Map,
  Truck,
  Navigation,
  Search,
  Radio,
  Gauge,
  Fuel,
  Activity,
  User,
  Compass,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Route,
  Zap,
} from 'lucide-react';
import {
  SectionCard,
  StatCard,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  PageHeader,
} from '@/components/ui/primitives';
import { fetchLiveLocations } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Vehicle } from '@/types';
import { cn } from '@/lib/utils';

import { FleetGoogleMap } from '@/components/maps/FleetGoogleMap';

function vehicleVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'moving':
      return 'success';
    case 'idle':
      return 'warning';
    case 'offline':
    case 'stopped':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default function LiveTrackingPage() {
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'moving' | 'idle' | 'offline'>('all');
  const [search, setSearch] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapEngine, setMapEngine] = useState<'google' | 'grid'>('google');

  // Poll every 5 seconds per backend requirement
  const { data: vehicles, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useQuery<Vehicle[]>({
    queryKey: queryKeys.liveLocations(),
    queryFn: fetchLiveLocations,
    refetchInterval: 5000,
    staleTime: 4000,
    retry: 2,
  });

  const fleet = vehicles ?? [];

  // Categorize counts
  const movingCount = fleet.filter((v) => v.status === 'running' || v.status === 'moving').length;
  const idleCount = fleet.filter((v) => v.status === 'idle').length;
  const offlineCount = fleet.filter((v) => v.status === 'offline' || v.status === 'stopped').length;
  const withGpsVehicles = fleet.filter((v) => v.lat != null && v.lng != null && !isNaN(Number(v.lat)) && !isNaN(Number(v.lng)));
  const withGpsCount = withGpsVehicles.length;

  // Auto-select first vehicle if none selected
  const activeSelected = fleet.find((v) => v.plate === selectedPlate) || fleet[0] || null;

  // Filtered list for the side-pane
  const filteredVehicles = useMemo(() => {
    return fleet.filter((v) => {
      const norm = v.status?.toLowerCase();
      const isMoving = norm === 'running' || norm === 'moving';
      const isIdle = norm === 'idle';
      const isOffline = norm === 'offline' || norm === 'stopped';

      let matchesFilter = true;
      if (statusFilter === 'moving') matchesFilter = isMoving;
      else if (statusFilter === 'idle') matchesFilter = isIdle;
      else if (statusFilter === 'offline') matchesFilter = isOffline;

      const matchesSearch =
        !search ||
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        (v.driver && v.driver.toLowerCase().includes(search.toLowerCase())) ||
        (v.loc && v.loc.toLowerCase().includes(search.toLowerCase())) ||
        (v.model && v.model.toLowerCase().includes(search.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [fleet, statusFilter, search]);

  // Compute bounding box for GPS vehicles to project onto canvas
  const mapBounds = useMemo(() => {
    if (withGpsVehicles.length === 0) return null;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    withGpsVehicles.forEach((v) => {
      const lat = Number(v.lat);
      const lng = Number(v.lng);
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    // Add padding margin
    const latPadding = Math.max((maxLat - minLat) * 0.15, 0.05);
    const lngPadding = Math.max((maxLng - minLng) * 0.15, 0.05);

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding,
    };
  }, [withGpsVehicles]);

  // Project lat/lng to percentage (0% - 100%) within SVG container
  const getCoordinatesPercent = (lat?: number, lng?: number) => {
    if (!mapBounds || lat == null || lng == null) return { x: 50, y: 50 };
    const x = ((Number(lng) - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
    // Invert Y because latitude goes South -> North but SVG goes Top -> Bottom
    const y = ((mapBounds.maxLat - Number(lat)) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const lastUpdatedText = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN') : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Tracking"
        subtitle="Real-time telemetry and GPS position stream from fleet IoT devices."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
              <Radio className={cn('h-3.5 w-3.5 text-emerald-500', isFetching && 'animate-pulse')} />
              <span>Poll Interval: <strong>5s</strong></span>
              <span className="text-slate-300">|</span>
              <span>Updated: <strong>{lastUpdatedText}</strong></span>
            </div>
            <button
              onClick={() => refetch()}
              title="Manual Refresh"
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 shadow-2xs transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin text-blue-600')} />
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Moving"
          value={movingCount}
          subtitle="Vehicles actively running"
          icon={<Navigation className="h-5 w-5" />}
          accent="green"
          onClick={() => setStatusFilter(statusFilter === 'moving' ? 'all' : 'moving')}
          actionText={statusFilter === 'moving' ? 'Active filter' : 'Filter Moving'}
        />
        <StatCard
          title="Idle"
          value={idleCount}
          subtitle="Engines on, stationary"
          icon={<Gauge className="h-5 w-5" />}
          accent="amber"
          onClick={() => setStatusFilter(statusFilter === 'idle' ? 'all' : 'idle')}
          actionText={statusFilter === 'idle' ? 'Active filter' : 'Filter Idle'}
        />
        <StatCard
          title="Offline / Stopped"
          value={offlineCount}
          subtitle="No movement or signal"
          icon={<Truck className="h-5 w-5" />}
          accent={offlineCount > 0 ? 'red' : 'slate'}
          onClick={() => setStatusFilter(statusFilter === 'offline' ? 'all' : 'offline')}
          actionText={statusFilter === 'offline' ? 'Active filter' : 'Filter Offline'}
        />
        <StatCard
          title="GPS Fix Active"
          value={withGpsCount}
          subtitle={`of ${fleet.length} total vehicles`}
          icon={<MapPin className="h-5 w-5" />}
          accent="blue"
          onClick={() => setStatusFilter('all')}
          actionText={statusFilter === 'all' ? 'Showing all coordinates' : 'Reset: Show All'}
        />
      </div>

      {isLoading && <LoadingSpinner label="Fetching fleet telemetry stream…" />}
      {isError && (
        <ErrorState message="Could not connect to fleet telemetry endpoint." onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* MAP CANVAS — Col 8 */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <SectionCard
              title="Interactive Live Fleet Map"
              subtitle={
                withGpsCount > 0
                  ? `${withGpsCount} vehicle(s) transmitting live GPS telemetry`
                  : 'No active GPS coordinates available in telemetry feed'
              }
              actions={
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 mr-1">
                    <button
                      onClick={() => setMapEngine('google')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-md transition-all',
                        mapEngine === 'google'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      Google Maps
                    </button>
                    <button
                      onClick={() => setMapEngine('grid')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-md transition-all',
                        mapEngine === 'grid'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      Grid
                    </button>
                  </div>
                  {mapEngine === 'grid' && (
                    <>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
                        className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                        className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        -
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="px-2 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    </>
                  )}
                </div>
              }
              bodyClassName="p-0 relative overflow-hidden"
            >
              {mapEngine === 'google' ? (
                <FleetGoogleMap
                  vehicles={fleet}
                  selectedPlate={selectedPlate}
                  onSelectVehicle={(plate) => setSelectedPlate(plate)}
                  height="480px"
                />
              ) : withGpsCount === 0 ? (
                <div className="flex h-[480px] items-center justify-center bg-slate-50/50 p-6 text-center">
                  <div className="max-w-md space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Map className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">No Live GPS Positions Available</h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        The backend returned {fleet.length} vehicle(s), but none currently broadcast latitude/longitude coordinates. Select a vehicle from the right panel to inspect available sensor telemetry.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-[480px] w-full bg-slate-900 overflow-hidden select-none">
                  {/* Map Grid Background */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0),
                        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px, 80px 80px, 80px 80px',
                    }}
                  />

                  {/* Compass HUD */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-slate-800/80 backdrop-blur-xs px-3 py-1.5 border border-slate-700/60 text-[11px] text-slate-300">
                    <Compass className="h-4 w-4 text-blue-400 animate-spin-slow" />
                    <span className="font-mono">GPS GRID • WGS84</span>
                  </div>

                  {/* Vehicle Pins Canvas */}
                  <div
                    className="absolute inset-0 transition-transform duration-300"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                    }}
                  >
                    {withGpsVehicles.map((v) => {
                      const isSelected = activeSelected?.plate === v.plate;
                      const { x, y } = getCoordinatesPercent(v.lat, v.lng);
                      const isMoving = v.status === 'running' || v.status === 'moving';
                      const isIdle = v.status === 'idle';

                      return (
                        <div
                          key={v.plate}
                          onClick={() => setSelectedPlate(v.plate)}
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className={cn(
                            'absolute cursor-pointer transition-all duration-300 z-20 group',
                            isSelected && 'z-30 scale-110'
                          )}
                        >
                          {/* Pulse Ring */}
                          {isMoving && (
                            <span className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
                          )}
                          {isIdle && (
                            <span className="absolute -inset-2 rounded-full bg-amber-500/20 animate-pulse pointer-events-none" />
                          )}

                          {/* Marker Pin */}
                          <div
                            className={cn(
                              'relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-lg transition-all border',
                              isSelected
                                ? 'bg-blue-600 text-white border-white ring-4 ring-blue-500/40'
                                : isMoving
                                ? 'bg-emerald-600 text-white border-emerald-400'
                                : isIdle
                                ? 'bg-amber-600 text-white border-amber-400'
                                : 'bg-slate-700 text-slate-200 border-slate-500'
                            )}
                          >
                            <Truck className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono">{v.plate}</span>
                            {v.speed > 0 && (
                              <span className="text-[10px] opacity-90 font-mono">
                                {v.speed}k
                              </span>
                            )}
                          </div>

                          {/* Tooltip on Hover */}
                          <div className="absolute left-1/2 -top-8 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-slate-950 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap border border-slate-800 pointer-events-none">
                            <span>{v.driver || 'No Driver'}</span>
                            <span>•</span>
                            <span>{v.speed} km/h</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Map Footer Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-4 font-mono">
                      <span>BOUNDS: Lat [{mapBounds?.minLat.toFixed(3)} → {mapBounds?.maxLat.toFixed(3)}]</span>
                      <span>Lng [{mapBounds?.minLng.toFixed(3)} → {mapBounds?.maxLng.toFixed(3)}]</span>
                    </div>
                    <div>Click any vehicle pin to focus</div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* SELECTED VEHICLE TELEMETRY INSPECTOR */}
            {activeSelected && (
              <SectionCard
                title={`Telemetry Inspector — ${activeSelected.plate}`}
                subtitle={activeSelected.model ? `${activeSelected.model} (${activeSelected.type || 'Vehicle'})` : 'Live sensor data'}
                actions={
                  <StatusBadge
                    label={activeSelected.status.toUpperCase()}
                    variant={vehicleVariant(activeSelected.status)}
                    dot
                  />
                }
              >
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {/* Live Speed */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Live Speed</span>
                      <Gauge className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-mono font-bold text-slate-800">
                      {activeSelected.speed} <span className="text-xs font-normal text-slate-500">km/h</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {activeSelected.speed > 80 ? '⚠️ High Speed' : activeSelected.speed > 0 ? 'Normal Speed' : 'Stationary'}
                    </p>
                  </div>

                  {/* Fuel Level */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Fuel Level</span>
                      <Fuel className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-xl font-mono font-bold text-slate-800">
                      {activeSelected.fuel}%
                    </p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          activeSelected.fuel > 40 ? 'bg-emerald-500' : activeSelected.fuel > 15 ? 'bg-amber-500' : 'bg-rose-500'
                        )}
                        style={{ width: `${Math.min(activeSelected.fuel, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Driver */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Driver</span>
                      <User className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {activeSelected.driver || 'Unassigned'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {activeSelected.driver ? 'Active on duty' : 'No driver logged'}
                    </p>
                  </div>

                  {/* IoT Signal & GPS Status */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Device Signal</span>
                      <Radio className="h-4 w-4 text-cyan-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 font-mono">
                      {activeSelected.device_id || activeSelected.deviceId || 'Not Assigned'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      GPS: {activeSelected.lat && activeSelected.lng ? 'FIXED 3D' : 'NO FIX'} • Signal: {activeSelected.signal_quality || '—'}
                    </p>
                  </div>
                </div>

                {/* Additional Geo & Trip info */}
                <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">GPS Coordinates: </span>
                    <span className="font-mono font-semibold text-slate-700">
                      {activeSelected.lat && activeSelected.lng
                        ? `${Number(activeSelected.lat).toFixed(5)}, ${Number(activeSelected.lng).toFixed(5)}`
                        : 'No coordinates available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Current Location: </span>
                    <span className="font-semibold text-slate-700">
                      {activeSelected.loc || 'En route / In transit'}
                    </span>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>

          {/* VEHICLE FLEET LIST — Col 4 */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <SectionCard
              title={`Fleet Stream (${filteredVehicles.length})`}
              subtitle="Live status list"
              bodyClassName="p-0"
            >
              {/* Filter Tabs & Search */}
              <div className="p-3 border-b border-slate-100 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search plate, driver, model…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Status Tabs */}
                <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-[11px] font-semibold text-center">
                  {(['all', 'moving', 'idle', 'offline'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={cn(
                        'py-1 rounded capitalize transition-all',
                        statusFilter === filter
                          ? 'bg-white text-blue-700 shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Vehicle List */}
              <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
                {filteredVehicles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No vehicles match your search or filter.
                  </div>
                ) : (
                  filteredVehicles.map((v) => {
                    const isSelected = activeSelected?.plate === v.plate;
                    const isMoving = v.status === 'running' || v.status === 'moving';
                    const isIdle = v.status === 'idle';

                    return (
                      <div
                        key={v.plate}
                        onClick={() => setSelectedPlate(v.plate)}
                        className={cn(
                          'flex items-center justify-between p-3 cursor-pointer transition-colors text-xs',
                          isSelected
                            ? 'bg-blue-50/80 border-l-4 border-blue-600'
                            : 'hover:bg-slate-50/70 border-l-4 border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Live pulse dot */}
                          <div
                            className={cn(
                              'h-2.5 w-2.5 rounded-full shrink-0',
                              isMoving
                                ? 'bg-emerald-500 animate-pulse'
                                : isIdle
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            )}
                          />
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-slate-800 truncate">
                              {v.plate}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {v.driver || 'No Driver'} {v.model ? `• ${v.model}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusBadge
                            label={v.status.toUpperCase()}
                            variant={vehicleVariant(v.status)}
                            dot={false}
                          />
                          <span className="font-mono text-[11px] font-bold text-slate-600">
                            {v.speed > 0 ? `${v.speed} km/h` : '0 km/h'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
