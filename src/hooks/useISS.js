import { useState, useEffect, useRef, useCallback } from 'react';

// Production: 20s polling. Dev: 16s.
const POLL_INTERVAL = import.meta.env.PROD ? 20000 : 16000;

// Module-level guards — survive HMR re-renders and React StrictMode double-mounts
let isFetching = false;
let lastFetchTime = 0;
const MIN_FETCH_GAP_MS = 15000; // never fetch more than once per 15s no matter what

const MAX_POSITIONS = 15;
const MAX_SPEED_HISTORY = 30;

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
  return new Promise((r) => setTimeout(r, ms));
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

  // ── ISS Position ────────────────────────────────────────────────────
  const fetchPosition = useCallback(async () => {
    const now = Date.now();

    // Hard gap guard — never fire within 15s of last successful call
    if (isFetching || (now - lastFetchTime) < MIN_FETCH_GAP_MS) return;

    isFetching = true;
    lastFetchTime = now;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.status === 429) {
        // Rate limited — back off 30s, don't update lastFetchTime so next
        // interval will try again but at least 30s from now
        addToast?.('ISS API rate limited — retrying in 30s', 'warning');
        lastFetchTime = now + 15000; // extend the gap
        await sleep(30000);
        isFetching = false;
        return;
      }

      if (!res.ok) throw new Error(`wheretheiss HTTP ${res.status}`);

      const data = await res.json();
      if (!isMountedRef.current) { isFetching = false; return; }

      const newPos = {
        lat: data.latitude,
        lng: data.longitude,
        timestamp: Math.floor(data.timestamp),
      };

      setError(null);
      setLoading(false);
      setCurrentPos(newPos);
      setSpeed(Math.round(data.velocity));
      setAltitude(parseFloat(data.altitude).toFixed(1));
      setLastUpdated(formatTime(newPos.timestamp));

      setPositions((prev) => [...prev, newPos].slice(-MAX_POSITIONS));
      setSpeedHistory((sh) => [
        ...sh,
        { time: formatTime(newPos.timestamp), speed: Math.round(data.velocity) },
      ].slice(-MAX_SPEED_HISTORY));

      // Async geocode — never blocks the render
      import('../utils/geocode').then(({ reverseGeocode }) => {
        reverseGeocode(newPos.lat, newPos.lng).then((name) => {
          if (isMountedRef.current) setLocationName(name);
        });
      });
    } catch (err) {
      if (isMountedRef.current) {
        const msg = err.name === 'AbortError' ? 'ISS API timed out' : err.message;
        setError(msg);
        setLoading(false);
      }
    } finally {
      isFetching = false;
    }
  }, [addToast]);

  // ── Astronauts ──────────────────────────────────────────────────────
  const fetchAstronauts = useCallback(async () => {
    try {
      // open-notify is offline — go straight to allorigins proxy
      const res = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api.open-notify.org/astros.json')}`,
        { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (isMountedRef.current) {
        setAstronautCount(data.number);
        setAstronauts(data.people);
        setIsCachedCrew(false);
      }
    } catch {
      // Fallback to static crew
      if (isMountedRef.current) {
        setAstronautCount(FALLBACK_CREW.length);
        setAstronauts(FALLBACK_CREW);
        setIsCachedCrew(true);
        addToast?.('Showing cached astronaut data', 'warning');
      }
    }
  }, [addToast]);

  const refresh = useCallback(() => {
    // Reset the gap guard so manual refresh always works
    lastFetchTime = 0;
    setLoading(true);
    setError(null);
    fetchPosition();
  }, [fetchPosition]);

  useEffect(() => {
    isMountedRef.current = true;

    // Stagger initial fetch slightly to avoid StrictMode double-mount race
    const initTimer = setTimeout(() => fetchPosition(), 300);
    fetchAstronauts();

    intervalRef.current = setInterval(fetchPosition, POLL_INTERVAL);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      isFetching = false;
      lastFetchTime = 0;
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
