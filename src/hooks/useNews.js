import { useState, useEffect, useCallback } from 'react';
import { safeFetch } from '../utils/api';

const CACHE_KEY = 'news_cache';
const CACHE_TTL = 900000; // 15 minutes

// ── Relative time formatter (no libraries) ─────────────────────────────
function getRelativeTime(dateStr) {
  if (!dateStr) return 'Recently';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return 'Recently';
  const diff = Math.floor((now - then) / 1000);
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
  const category = cats.length > 0 ? cats[0].label : 'Breaking';
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
    category,
    type: 'breaking',
    via: 'EventRegistry',
  };
}

// ── Cache helpers ──────────────────────────────────────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.data || !parsed.fetchedAt) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch { /* storage full — ignore */ }
}

// ── Headline cascade fetch ─────────────────────────────────────────────
async function fetchHeadlines(addToast) {
  // Source 1: NewsAPI via safeFetch (auto-proxies if CORS blocked)
  try {
    const res = await safeFetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=${import.meta.env.VITE_NEWS_API_KEY}`
    );
    const data = await res.json();
    if (data.status === 'ok' && Array.isArray(data.articles) && data.articles.length > 0) {
      return normalizeNewsAPI(data.articles);
    }
    throw new Error('No articles from NewsAPI');
  } catch (err) {
    console.warn('[News] NewsAPI failed:', err.message);
  }

  // Source 2: GNews (free, no CORS issues)
  if (import.meta.env.VITE_GNEWS_KEY) {
    try {
      const res = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=general&lang=en&max=5&apikey=${import.meta.env.VITE_GNEWS_KEY}`
      );
      if (!res.ok) throw new Error(`GNews HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.articles) && data.articles.length > 0) {
        addToast?.('NewsAPI unavailable — using GNews', 'info');
        return normalizeGNews(data.articles);
      }
      throw new Error('No articles from GNews');
    } catch (err) {
      console.warn('[News] GNews failed:', err.message);
    }
  }

  // Source 3: The Guardian (free, excellent CORS support)
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
      throw new Error('No results from Guardian');
    } catch (err) {
      console.warn('[News] Guardian failed:', err.message);
    }
  }

  return [];
}

// ── Breaking events fetch ──────────────────────────────────────────────
async function fetchBreakingEvents() {
  try {
    const res = await safeFetch(
      'https://eventregistry.org/api/v1/event/getBreakingEvents?breakingEventsMinBreakingScore=0.2&apiKey=bd738fcff53c40888d23f2d1f06b57ae'
    );
    const data = await res.json();
    const results = data?.breakingEvents?.results || [];
    return results.slice(0, 5).map(normalizeBreakingEvent);
  } catch (err) {
    console.warn('[News] EventRegistry failed:', err.message);
    return [];
  }
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
  const [sourceStatus, setSourceStatus] = useState({
    eventRegistry: 'idle',
    newsapi: 'idle',
    gnews: 'idle',
    guardian: 'idle',
  });

  const fetchNews = useCallback(async (forceRefresh = false) => {
    // Serve from cache if still fresh
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) {
        const breaking = cached.filter((a) => a.type === 'breaking');
        const headlines = cached.filter((a) => a.type === 'headline');
        setBreakingArticles(breaking);
        setHeadlineArticles(headlines);
        setArticles(cached);
        setLoading(false);
        addToast?.('Using cached news data', 'info');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSourceStatus({ eventRegistry: 'loading', newsapi: 'loading', gnews: 'idle', guardian: 'idle' });

    // Fetch both sources in parallel
    const [breaking, headlines] = await Promise.all([
      fetchBreakingEvents().then((res) => {
        setSourceStatus((s) => ({
          ...s,
          eventRegistry: res.length > 0 ? 'success' : 'error',
        }));
        return res;
      }),
      fetchHeadlines(addToast).then((res) => {
        const via = res[0]?.via || 'none';
        setSourceStatus((s) => ({
          ...s,
          newsapi: via === 'NewsAPI' ? 'success' : 'error',
          gnews: via === 'GNews' ? 'success' : s.gnews,
          guardian: via === 'The Guardian' ? 'success' : s.guardian,
        }));
        return res;
      }),
    ]);

    const allArticles = [...breaking, ...headlines];

    setBreakingArticles(breaking);
    setHeadlineArticles(headlines);
    setArticles(allArticles);

    if (allArticles.length > 0) {
      writeCache(allArticles);
      addToast?.('News loaded successfully', 'success');
    } else {
      setError('No news data available. Check API keys in .env');
      addToast?.('News sources unavailable — check API keys', 'warning');
    }

    setLoading(false);
  }, [addToast]);

  const refresh = useCallback(() => {
    fetchNews(true);
  }, [fetchNews]);

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
    sourceStatus,
  };
}
