import { useState, useEffect, useRef, useCallback } from 'react';
import { safeFetch } from '../utils/api';

const MAX_POSITIONS = 15;
const MAX_SPEED_HISTORY = 30;
const POLL_INTERVAL_MS = 16000; // 16s — keeps well under wheretheiss.at rate limit

// Module-level fetch lock — persists across HMR hot-reloads
let isFetching = false;

// Static fallback crew when all astronaut APIs fail
const FALLBACK_CREW = [
  { name: 'Oleg Kononenko', craft: 'ISS' },
  { name: 'Nikolai Chub', craft: 'ISS' },
  { name: 'Tracy Dyson', craft: 'ISS' },
  { name: 'Matthew Dominick', craft: 'ISS' },
  { name: 'Michael Barratt', craft: 'ISS' },
  { name: 'Jeanette Epps', craft: 'ISS' },
  { name: 'Alexander Grebenkin', craft: 'ISS' },
];

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toTimeString().slice(0, 8);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useISS(addToast) {
  const [currentPos, setCurrentPos] = useState(null);
  const [positions, setPositions] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(null);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [locationName, setLocationName] = useState('Calculating...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [astronautCount, setAstronautCount] = useState(0);
  const [astronauts, setAstronauts] = useState([]);
  const [isCachedCrew, setIsCachedCrew] = useState(false);

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // ── ISS Position Fetch ──────────────────────────────────────────────
  const fetchPosition = useCallback(async () => {
    if (isFetching) return; // lock — prevent overlapping calls
    isFetching = true;

    const ISS_ENDPOINTS = [
      {
        // Primary: wheretheiss.at direct
        url: 'https://api.wheretheiss.at/v1/satellites/25544',
        parse: (data) => ({
          lat: data.latitude,
          lng: data.longitude,
          timestamp: Math.floor(data.timestamp),
          velocity: Math.round(data.velocity),
          altitude: parseFloat(data.altitude).toFixed(1),
        }),
      },
      {
        // Secondary: wheretheiss.at via CORS proxy (bypasses per-IP 429)
        url: 'https://corsproxy.io/?' + encodeURIComponent('https://api.wheretheiss.at/v1/satellites/25544'),
        parse: (data) => ({
          lat: data.latitude,
          lng: data.longitude,
          timestamp: Math.floor(data.timestamp),
          velocity: Math.round(data.velocity),
          altitude: parseFloat(data.altitude).toFixed(1),
        }),
      },
      {
        // Tertiary: open-notify via corsproxy (offline but worth 1 try)
        url: 'https://corsproxy.io/?' + encodeURIComponent('https://api.open-notify.org/iss-now.json'),
        parse: (data) => ({
          lat: parseFloat(data.iss_position.latitude),
          lng: parseFloat(data.iss_position.longitude),
          timestamp: data.timestamp,
          velocity: 27600,
          altitude: '408.0',
        }),
      },
    ];

    let lastErr;
    for (const endpoint of ISS_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(endpoint.url, { signal: controller.signal });
        clearTimeout(timer);

        if (res.status === 429) {
          addToast?.('ISS API rate limited — retrying in 5s', 'warning');
          await sleep(5000);
          // try next endpoint
          lastErr = new Error('429 rate limited');
          continue;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const raw = await res.json();
        const data = endpoint.parse(raw);

        if (!isMountedRef.current) return;

        const newPos = { lat: data.lat, lng: data.lng, timestamp: data.timestamp };

        setError(null);
        setLoading(false);
        setCurrentPos(newPos);
        setSpeed(data.velocity);
        setAltitude(String(data.altitude));
        setLastUpdated(formatTime(data.timestamp));

        setPositions((prev) => [...prev, newPos].slice(-MAX_POSITIONS));
        setSpeedHistory((sh) => [
          ...sh,
          { time: formatTime(data.timestamp), speed: data.velocity },
        ].slice(-MAX_SPEED_HISTORY));

        // Async geocode — non-blocking
        import('../utils/geocode').then(({ reverseGeocode }) => {
          reverseGeocode(newPos.lat, newPos.lng).then((name) => {
            if (isMountedRef.current) setLocationName(name);
          });
        });

        isFetching = false;
        return; // success — stop trying endpoints
      } catch (err) {
        lastErr = err;
        // continue to next endpoint
      }
    }

    // All endpoints failed
    if (isMountedRef.current) {
      const msg = lastErr?.name === 'AbortError'
        ? 'ISS API timed out'
        : lastErr?.message || 'Failed to fetch ISS data';
      setError(msg);
      setLoading(false);
    }
    isFetching = false;
  }, [addToast]);

  // ── Astronaut Fetch ─────────────────────────────────────────────────
  const fetchAstronauts = useCallback(async () => {
    // Try 1: corsproxy.io → open-notify
    try {
      const res = await safeFetch('https://api.open-notify.org/astros.json');
      const data = await res.json();
      if (isMountedRef.current) {
        setAstronautCount(data.number);
        setAstronauts(data.people);
        setIsCachedCrew(false);
      }
      return;
    } catch {
      // fall through to static fallback
    }

    // Fallback: static crew
    if (isMountedRef.current) {
      setAstronautCount(FALLBACK_CREW.length);
      setAstronauts(FALLBACK_CREW);
      setIsCachedCrew(true);
      addToast?.('Showing cached astronaut data', 'warning');
    }
  }, [addToast]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchPosition();
  }, [fetchPosition]);

  useEffect(() => {
    isMountedRef.current = true;

    fetchPosition();
    fetchAstronauts();

    intervalRef.current = setInterval(fetchPosition, POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      isFetching = false; // release lock on unmount
    };
  }, [fetchPosition, fetchAstronauts]);

  return {
    currentPos,
    positions,
    speed,
    altitude,
    speedHistory,
    positionCount: positions.length,
    locationName,
    loading,
    error,
    lastUpdated,
    refresh,
    astronautCount,
    astronauts,
    isCachedCrew,
  };
}
