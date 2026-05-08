/**
 * Reverse geocode a lat/lng to a human-readable location name
 * Uses Nominatim (OpenStreetMap). Caches result for 60 seconds.
 */

const geocodeCache = new Map(); // key: "lat,lng", value: { name, fetchedAt }

export async function reverseGeocode(lat, lng) {
  const key = `${parseFloat(lat).toFixed(2)},${parseFloat(lng).toFixed(2)}`;
  const now = Date.now();
  const TTL = 60000; // 60 seconds

  // Return cached result if still fresh
  if (geocodeCache.has(key)) {
    const cached = geocodeCache.get(key);
    if (now - cached.fetchedAt < TTL) {
      return cached.name;
    }
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AntigravityDashboard/1.0',
        },
      }
    );

    if (!response.ok) throw new Error('Geocode fetch failed');

    const data = await response.json();
    const addr = data.address || {};

    const name =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.county ||
      addr.state ||
      addr.country ||
      'Over Ocean';

    geocodeCache.set(key, { name, fetchedAt: now });
    return name;
  } catch {
    // If geocoding fails, determine if over ocean from coordinates
    const cachedAny = geocodeCache.get(key);
    if (cachedAny) return cachedAny.name;
    return 'Over Ocean';
  }
}
