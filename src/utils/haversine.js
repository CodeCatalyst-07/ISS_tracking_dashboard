/**
 * Haversine formula — calculate ISS speed between two positions
 * @param {Object} pos1 - { lat, lng }
 * @param {Object} pos2 - { lat, lng }
 * @param {number} timeDiffSeconds - time difference in seconds
 * @returns {number} speed in km/h
 */
export function calculateSpeed(pos1, pos2, timeDiffSeconds) {
  if (!pos1 || !pos2 || timeDiffSeconds <= 0) return 0;

  const R = 6371; // Earth radius in km
  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(pos2.lat - pos1.lat);
  const dLon = toRad(pos2.lng - pos1.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pos1.lat)) *
      Math.cos(toRad(pos2.lat)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  return (distanceKm / timeDiffSeconds) * 3600; // convert to km/h
}
