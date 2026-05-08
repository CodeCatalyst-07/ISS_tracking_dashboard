/**
 * safeFetch — direct fetch first, then cascades through multiple CORS proxies.
 * allorigins.win is primary proxy (more reliable in production than corsproxy.io).
 */

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function fetchWithTimeout(url, options = {}, ms = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function safeFetch(url, options = {}) {
  // ── Attempt 1: Direct (no proxy) ──────────────────────────────────
  try {
    const res = await fetchWithTimeout(url, options, 8000);
    if (res.ok) return res;
    // Auth failures — proxying won't help
    if (res.status === 401 || res.status === 403) {
      throw new Error(`AUTH_${res.status}`);
    }
    throw new Error(`HTTP_${res.status}`);
  } catch (directErr) {
    if (directErr.message?.startsWith('AUTH_')) throw directErr;

    // Only proxy on network/CORS errors, not on API errors (4xx/5xx non-auth)
    const isNetworkError =
      directErr.name === 'AbortError' ||
      directErr.name === 'TypeError' ||
      directErr.message?.includes('Failed to fetch') ||
      directErr.message?.includes('ERR_CONNECTION_REFUSED');

    if (!isNetworkError) throw directErr;
  }

  // ── Attempt 2+: Try each CORS proxy ───────────────────────────────
  let lastErr;
  for (const makeProxyUrl of CORS_PROXIES) {
    try {
      const res = await fetchWithTimeout(makeProxyUrl(url), options, 12000);
      if (res.ok) return res;
      lastErr = new Error(`Proxy HTTP_${res.status}`);
    } catch (err) {
      lastErr = err;
      // continue to next proxy
    }
  }

  throw lastErr || new Error(`All proxies failed for: ${url}`);
}
