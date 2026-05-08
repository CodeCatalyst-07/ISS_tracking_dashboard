import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { StatSkeleton } from './SkeletonLoader';

// Custom ISS glowing marker icon
const issIcon = L.divIcon({
  className: 'iss-marker-icon',
  html: `<div class="iss-marker-dot"></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  tooltipAnchor: [16, 0],
});

// Auto-pan map to follow ISS
function MapFollower({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom(), {
        animate: true,
        duration: 1,
      });
    }
  }, [position, map]);
  return null;
}

function formatTimestamp(ts) {
  if (!ts) return '--:--:--';
  return new Date(ts * 1000).toTimeString().slice(0, 8);
}

// ── Status Banner ──────────────────────────────────────────────────────
function StatusBanner({ error, loading, lastUpdated }) {
  if (error) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-space-grotesk"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#FCA5A5',
        }}
      >
        <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 animate-pulse" />
        CONNECTION ERROR — RETRYING...
      </div>
    );
  }
  if (loading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-space-grotesk"
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#FCD34D',
        }}
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
        ACQUIRING SIGNAL...
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-space-grotesk"
      style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: '#6EE7B7',
      }}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
      ● LIVE DATA
      {lastUpdated && (
        <span style={{ color: 'rgba(110,231,183,0.6)', marginLeft: 4 }}>
          · Last updated: {lastUpdated}
        </span>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function ISSTracker({ issData, addToast }) {
  const {
    currentPos,
    positions,
    speed,
    altitude,
    positionCount,
    locationName,
    loading,
    error,
    lastUpdated,
    refresh,
  } = issData;

  const polylinePositions = useMemo(
    () => positions.map((p) => [p.lat, p.lng]),
    [positions]
  );

  const handleRefresh = () => {
    refresh();
    addToast?.('ISS data refreshed', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* ── LEFT STATS PANEL ──────────────────────────────────────── */}
      <div className="lg:col-span-2 card p-5 flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="live-dot" />
            <span className="section-title text-sm">ISS LIVE POSITION</span>
          </div>
          <button
            id="iss-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <svg
              width="12" height="12"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              className={loading ? 'animate-spin' : ''}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            REFRESH
          </button>
        </div>

        {/* Status banner */}
        <StatusBanner error={error} loading={loading && !currentPos} lastUpdated={lastUpdated} />

        {/* Stats list */}
        <div className="space-y-0 divide-y divide-cyan-500/10">
          {/* Latitude */}
          <div className="py-3">
            <div className="stat-label mb-1">LATITUDE</div>
            {loading && !currentPos
              ? <StatSkeleton />
              : <div className="stat-value glow-text-cyan">
                  {currentPos ? `${parseFloat(currentPos.lat).toFixed(4)}°` : '---'}
                </div>}
          </div>

          {/* Longitude */}
          <div className="py-3">
            <div className="stat-label mb-1">LONGITUDE</div>
            {loading && !currentPos
              ? <StatSkeleton />
              : <div className="stat-value glow-text-cyan">
                  {currentPos ? `${parseFloat(currentPos.lng).toFixed(4)}°` : '---'}
                </div>}
          </div>

          {/* Orbital Speed */}
          <div className="py-3">
            <div className="stat-label mb-1">ORBITAL SPEED</div>
            <div className="flex items-baseline gap-2">
              <div
                className="stat-value"
                style={{ color: '#F59E0B', textShadow: '0 0 20px rgba(245,158,11,0.5)' }}
              >
                {speed.toLocaleString()}
              </div>
              <span className="text-xs text-amber-400/60 font-space-grotesk font-medium">km/h</span>
            </div>
          </div>

          {/* Altitude */}
          <div className="py-3">
            <div className="stat-label mb-1">ALTITUDE</div>
            <div className="flex items-baseline gap-2">
              <div
                className="stat-value"
                style={{ color: '#7C3AED', textShadow: '0 0 20px rgba(124,58,237,0.5)' }}
              >
                {altitude ?? '---'}
              </div>
              {altitude && (
                <span className="text-xs font-space-grotesk font-medium" style={{ color: 'rgba(124,58,237,0.6)' }}>
                  km
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="py-3">
            <div className="stat-label mb-1">CURRENT LOCATION</div>
            <div
              className="font-orbitron font-bold text-base truncate"
              style={{ color: '#00D4FF' }}
            >
              {locationName}
            </div>
          </div>

          {/* Progress bar */}
          <div className="py-3">
            <div className="stat-label mb-1">POSITIONS TRACKED</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(positionCount / 15) * 100}%`,
                    background: 'linear-gradient(90deg, #00D4FF, #7C3AED)',
                    boxShadow: '0 0 8px rgba(0,212,255,0.6)',
                  }}
                />
              </div>
              <span className="font-orbitron text-sm font-bold" style={{ color: '#00D4FF' }}>
                {positionCount}/15
              </span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div
          className="mt-auto p-3 rounded-lg text-xs"
          style={{
            background: 'rgba(0,212,255,0.05)',
            border: '1px solid rgba(0,212,255,0.1)',
            color: 'rgba(148,163,184,0.7)',
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          📡 ISS orbits at ~408 km altitude · Data: wheretheiss.at · Polls every 16s
        </div>
      </div>

      {/* ── RIGHT MAP PANEL ───────────────────────────────────────── */}
      <div className="lg:col-span-3 card p-0 overflow-hidden min-h-[350px] lg:min-h-[480px]">
        {currentPos ? (
          <MapContainer
            center={[currentPos.lat, currentPos.lng]}
            zoom={3}
            style={{ width: '100%', height: '100%', minHeight: '480px' }}
            zoomControl
            attributionControl
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />

            <MapFollower position={currentPos} />

            {polylinePositions.length >= 2 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: '#00D4FF',
                  weight: 2,
                  opacity: 0.7,
                  dashArray: '6, 4',
                }}
              />
            )}

            <Marker position={[currentPos.lat, currentPos.lng]} icon={issIcon}>
              <Tooltip
                direction="top"
                offset={[0, -10]}
                className="iss-tooltip"
              >
                LAT: {parseFloat(currentPos.lat).toFixed(4)} | LNG:{' '}
                {parseFloat(currentPos.lng).toFixed(4)} | {formatTimestamp(currentPos.timestamp)}
              </Tooltip>
            </Marker>
          </MapContainer>
        ) : (
          <div
            className="w-full h-full min-h-[480px] flex items-center justify-center"
            style={{ background: 'rgba(15,23,42,0.5)' }}
          >
            {loading ? (
              <div className="text-center space-y-3">
                <div className="text-4xl animate-pulse-slow">🛸</div>
                <p className="text-sm font-space-grotesk text-gray-400">Acquiring ISS position...</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-4xl">⚠</div>
                <p className="text-sm font-space-grotesk text-red-400">{error || 'Map unavailable'}</p>
                <button onClick={handleRefresh} className="btn-primary text-xs">
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
