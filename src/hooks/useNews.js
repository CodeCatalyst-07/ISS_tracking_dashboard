import { useState, useEffect, useCallback } from 'react';
import { safeFetch } from '../utils/api';

// 30min cache in production, 15min in dev
const CACHE_TTL = import.meta.env.PROD ? 30 * 60 * 1000 : 15 * 60 * 1000;
const CACHE_KEY = 'news_cache';

// ── Relative time formatter ────────────────────────────────────────────
function getRelativeTime(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return 'Recently';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Normalizers ────────────────────────────────────────────────────────
function normalizeNewsAPI(articles) {
  return articles
    .filter((a) => a.title && a.title !== '[Removed]')
    .map((a, i) => ({
      id: `newsapi-${i}-${a.publishedAt}`,
      title: a.title || 'Untitled',
      source: a.source?.name || 'NewsAPI',
      author: a.author || '',
      date: getRelativeTime(a.publishedAt),
      image: a.urlToImage || null,
      description: a.description || '',
      url: a.url || '#',
      category: 'Top Headlines',
      type: 'headline',
      via: 'NewsAPI',
    }));
}

function normalizeGNews(articles) {
  return articles.map((a, i) => ({
    id: `gnews-${i}-${a.publishedAt}`,
    title: a.title || 'Untitled',
    source: a.source?.name || 'GNews',
    author: a.source?.name || '',
    date: getRelativeTime(a.publishedAt),
    image: a.image || null,
    description: a.description || '',
    url: a.url || '#',
    category: 'Top Headlines',
    type: 'headline',
    via: 'GNews',
  }));
}

function normalizeGuardian(results) {
  return results.map((a, i) => ({
    id: `guardian-${i}-${a.webPublicationDate}`,
    title: a.webTitle || 'Untitled',
    source: 'The Guardian',
    author: a.fields?.byline || 'The Guardian',
    date: getRelativeTime(a.webPublicationDate),
    image: a.fields?.thumbnail || null,
    description: a.fields?.trailText || '',
    url: a.webUrl || '#',
    category: 'Top Headlines',
    type: 'headline',
    via: 'The Guardian',
  }));
}

function normalizeBreakingEvent(event, index) {
  const cats = event.categories || [];
  const images = event.images || [];
  return {
    id: `event-${index}-${event.eventDate}`,
    title: event.title?.eng || 'Untitled Event',
    source: event.newsDomains?.[0] || 'Event Registry',
    author: event.newsDomains?.[0] || '',
    date: getRelativeTime(event.eventDate),
    image: images.length > 0 ? images[0] : null,
    description: event.summary?.eng || '',
    url: event.url || '#',
    category: cats.length > 0 ? cats[0].label : 'Breaking',
    type: 'breaking',
    via: 'EventRegistry',
  };
}

// ── Cache helpers ──────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw);
    if (!data || !fetchedAt) return null;
    if (Date.now() - fetchedAt > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch { /* storage full */ }
}

// ── Breaking events (EventRegistry) ───────────────────────────────────
// Note: VITE_NEWS_API_KEY holds the EventRegistry key in this project
async function fetchBreakingEvents() {
  const key = import.meta.env.VITE_NEWS_API_KEY;
  if (!key) return [];
  try {
    const res = await safeFetch(
      `https://eventregistry.org/api/v1/event/getBreakingEvents?breakingEventsMinBreakingScore=0.2&apiKey=${key}`
    );
    const data = await res.json();
    const results = data?.breakingEvents?.results || [];
    return results.slice(0, 5).map(normalizeBreakingEvent);
  } catch (err) {
    console.warn('[News] EventRegistry failed:', err.message);
    return [];
  }
}

// ── Top headlines (cascade: GNews → NewsAPI → Guardian) ────────────────
async function fetchHeadlines(addToast) {
  const isProd = import.meta.env.PROD;

  // ── Source 1: GNews (primary — works in both dev and prod via proxy) ──
  if (import.meta.env.VITE_GNEWS_KEY) {
    try {
      const gnewsUrl = `https://gnews.io/api/v4/top-headlines?category=general&lang=en&max=5&apikey=${import.meta.env.VITE_GNEWS_KEY}`;
      // In prod GNews blocks vercel.app domains via CORS → use safeFetch (proxied)
      const res = isProd
        ? await safeFetch(gnewsUrl)
        : await fetch(gnewsUrl);
      if (!res.ok) throw new Error(`GNews HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.articles) && data.articles.length > 0) {
        return normalizeGNews(data.articles);
      }
      throw new Error('GNews returned 0 articles');
    } catch (err) {
      console.warn('[News] GNews failed:', err.message);
    }
  }

  // ── Source 2: NewsAPI (localhost only — 426 on live domains) ──────────
  if (!isProd && import.meta.env.VITE_NEWS_API_KEY) {
    try {
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=${import.meta.env.VITE_NEWS_API_KEY}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && data.articles?.length > 0) {
          return normalizeNewsAPI(data.articles);
        }
      }
    } catch (err) {
      console.warn('[News] NewsAPI failed (localhost):', err.message);
    }
  }

  // ── Source 3: The Guardian (best for prod — no CORS, unlimited free) ─
  if (import.meta.env.VITE_GUARDIAN_KEY) {
    try {
      const res = await fetch(
        `https://content.guardianapis.com/search?show-fields=thumbnail,trailText,byline&page-size=5&api-key=${import.meta.env.VITE_GUARDIAN_KEY}`
      );
      if (!res.ok) throw new Error(`Guardian HTTP ${res.status}`);
      const data = await res.json();
      const results = data?.response?.results || [];
      if (results.length > 0) {
        addToast?.('Using The Guardian as news source', 'info');
        return normalizeGuardian(results);
      }
    } catch (err) {
      console.warn('[News] Guardian failed:', err.message);
    }
  }

  return [];
}

// ── Hook ───────────────────────────────────────────────────────────────
export function useNews(addToast) {
  const [articles, setArticles] = useState([]);
  const [breakingArticles, setBreakingArticles] = useState([]);
  const [headlineArticles, setHeadlineArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchNews = useCallback(async (forceRefresh = false) => {
    // Always check cache first — reduces API calls significantly in prod
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) {
        setBreakingArticles(cached.filter((a) => a.type === 'breaking'));
        setHeadlineArticles(cached.filter((a) => a.type === 'headline'));
        setArticles(cached);
        setLoading(false);
        addToast?.('Using cached news data', 'info');
        return;
      }
    }

    setLoading(true);
    setError(null);

    // Fetch both sources in parallel
    const [breaking, headlines] = await Promise.all([
      fetchBreakingEvents(),
      fetchHeadlines(addToast),
    ]);

    const allArticles = [...breaking, ...headlines];

    setBreakingArticles(breaking);
    setHeadlineArticles(headlines);
    setArticles(allArticles);

    if (allArticles.length > 0) {
      writeCache(allArticles);
      addToast?.('News loaded successfully', 'success');
    } else {
      setError('No news data available. Check API keys in Vercel environment variables.');
      addToast?.('News sources unavailable', 'warning');
    }

    setLoading(false);
  }, [addToast]);

  const refresh = useCallback(() => fetchNews(true), [fetchNews]);

  useEffect(() => {
    fetchNews(false);
  }, [fetchNews]);

  // Filtered + sorted views
  const applyFilter = (list) =>
    list
      .filter((a) => {
        const q = searchQuery.toLowerCase();
        const matchSearch =
          !q ||
          a.title.toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q);
        const matchCat = !selectedCategory || a.category === selectedCategory;
        return matchSearch && matchCat;
      })
      .sort((a, b) =>
        sortBy === 'source' ? a.source.localeCompare(b.source) : 0
      );

  return {
    articles,
    breakingArticles: applyFilter(breakingArticles),
    headlineArticles: applyFilter(headlineArticles),
    loading,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedCategory,
    setSelectedCategory,
  };
}
