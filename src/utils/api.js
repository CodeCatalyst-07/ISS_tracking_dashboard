/**
 * safeFetch — attempts a direct fetch first, then retries via CORS proxy
 * on network/CORS errors. Auth errors (4xx) are thrown immediately.
 */

const CORS_PROXY = 'https://corsproxy.io/?';

export async function safeFetch(url, options = {}) {
  // ── Attempt 1: Direct fetch ────────────────────────────────────────
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) return res;

    // 4xx auth/rate errors — throw immediately (proxy won't help)
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      throw new Error(`HTTP_${res.status}`);
    }

    // Other non-ok → try proxy
    throw new Error(`HTTP_${res.status}`);
  } catch (directErr) {
    // Don't proxy auth/rate-limit failures
    if (
      directErr.message.includes('HTTP_401') ||
      directErr.message.includes('HTTP_403') ||
      directErr.message.includes('HTTP_429')
    ) {
      throw directErr;
    }

    // Proxy on: network errors, CORS, connection refused, timeout
    const isCorsOrNetwork =
      directErr.name === 'TypeError' ||
      directErr.name === 'AbortError' ||
      directErr.message.includes('Failed to fetch') ||
      directErr.message.includes('ERR_CONNECTION_REFUSED') ||
      directErr.message.includes('HTTP_5') ||
      directErr.message.includes('HTTP_4');

    if (!isCorsOrNetwork) throw directErr;

    // ── Attempt 2: Via CORS proxy ──────────────────────────────────
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 12000);
    const proxied = await fetch(
      CORS_PROXY + encodeURIComponent(url),
      { ...options, signal: controller2.signal }
    );
    clearTimeout(timeoutId2);

    if (proxied.ok) return proxied;
    throw new Error(`Proxy also failed: HTTP_${proxied.status}`);
  }
}
