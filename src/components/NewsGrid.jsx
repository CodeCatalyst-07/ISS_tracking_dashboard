import { NewsCardSkeleton } from './SkeletonLoader';

const FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='160' viewBox='0 0 400 160'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23020817'/><stop offset='100%25' stop-color='%230f172a'/></linearGradient></defs><rect width='400' height='160' fill='url(%23g)'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2300D4FF' font-size='32' opacity='0.4'>🛰</text></svg>`;

function ArticleCard({ article }) {
  return (
    <div className="card flex flex-col overflow-hidden group" style={{ minHeight: '340px' }}>
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: '160px', flexShrink: 0 }}>
        <img
          src={article.image || FALLBACK_SVG}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.src = FALLBACK_SVG; }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 60%)' }}
        />
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full font-space-grotesk backdrop-blur-sm"
            style={{
              background: 'rgba(0,212,255,0.2)',
              border: '1px solid rgba(0,212,255,0.5)',
              color: '#00D4FF',
            }}
          >
            {article.category || 'News'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3
          className="font-semibold font-space-grotesk text-sm leading-snug line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {article.title}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs font-medium font-space-grotesk" style={{ color: '#00D4FF', opacity: 0.8 }}>
            {article.source}
          </span>
          {article.author && (
            <>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-xs font-space-grotesk truncate max-w-[100px]" style={{ color: 'var(--text-muted)' }}>
                {article.author}
              </span>
            </>
          )}
          <span className="text-gray-600 text-xs">•</span>
          <span className="text-xs font-space-grotesk" style={{ color: 'var(--text-muted)' }}>
            {article.date}
          </span>
        </div>

        {/* Description */}
        <p
          className="text-xs font-space-grotesk leading-relaxed line-clamp-3 flex-1"
          style={{ color: 'rgba(148,163,184,0.8)' }}
        >
          {article.description}
        </p>

        {/* Footer: Read More + source indicator */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold font-space-grotesk transition-all duration-200"
            style={{ color: '#00D4FF' }}
            onMouseEnter={(e) => (e.currentTarget.style.textShadow = '0 0 10px rgba(0,212,255,0.6)')}
            onMouseLeave={(e) => (e.currentTarget.style.textShadow = 'none')}
          >
            Read More →
          </a>
          {article.via && (
            <span
              className="text-xs font-space-grotesk"
              style={{ color: 'rgba(100,116,139,0.5)', fontSize: '10px' }}
            >
              via {article.via}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FullErrorState({ onRefresh }) {
  return (
    <div
      className="col-span-2 rounded-xl p-8 text-center flex flex-col items-center gap-4"
      style={{
        background: 'rgba(239,68,68,0.05)',
        border: '1px dashed rgba(239,68,68,0.3)',
      }}
    >
      <div className="text-4xl">⚠️</div>
      <p className="text-sm font-space-grotesk text-red-400 font-medium">
        Unable to load news. Check your API keys in .env
      </p>
      <p
        className="text-xs font-space-grotesk font-mono"
        style={{ color: 'rgba(148,163,184,0.5)' }}
      >
        VITE_NEWS_API_KEY · VITE_GNEWS_KEY · VITE_GUARDIAN_KEY
      </p>
      <button onClick={onRefresh} className="btn-primary text-xs px-4 py-2">
        Retry
      </button>
    </div>
  );
}

function NewsSection({ title, articles, loading, error, allFailed, onRefresh, badgeColor }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="section-title">{title}</h3>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full font-space-grotesk"
            style={{
              background: `${badgeColor}20`,
              border: `1px solid ${badgeColor}50`,
              color: badgeColor,
            }}
          >
            {articles.length} articles
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg p-3 text-sm text-red-400 border border-red-500/30 bg-red-500/10 font-space-grotesk">
          ⚠ {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <NewsCardSkeleton key={i} />)
          : allFailed
          ? <FullErrorState onRefresh={onRefresh} />
          : articles.length === 0
          ? (
            <div
              className="col-span-2 text-center py-12 rounded-lg border border-dashed font-space-grotesk text-sm"
              style={{ borderColor: 'rgba(0,212,255,0.2)', color: 'var(--text-muted)' }}
            >
              No articles match your search
            </div>
          )
          : articles.slice(0, 4).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
      </div>
    </div>
  );
}

export default function NewsGrid({ newsData, selectedCategory, setSelectedCategory }) {
  const {
    breakingArticles,
    headlineArticles,
    loading,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
  } = newsData;

  const allFailed = !loading && error && breakingArticles.length === 0 && headlineArticles.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'rgba(0,212,255,0.5)' }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="news-search"
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg font-space-grotesk outline-none transition-all duration-200"
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.6)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(0,212,255,0.2)')}
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 text-xs font-space-grotesk px-3 py-2 rounded-lg transition-all"
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#7C3AED',
              }}
            >
              ✕ {selectedCategory}
            </button>
          )}
          <select
            id="news-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs rounded-lg px-3 py-2 outline-none font-space-grotesk cursor-pointer"
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="date">Sort by Date</option>
            <option value="source">Sort by Source</option>
          </select>
        </div>
      </div>

      {/* Two sections side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <NewsSection
          title="BREAKING EVENTS"
          articles={breakingArticles}
          loading={loading}
          error={null}
          allFailed={allFailed}
          onRefresh={refresh}
          badgeColor="#F59E0B"
        />
        <NewsSection
          title="TOP HEADLINES"
          articles={headlineArticles}
          loading={loading}
          error={null}
          allFailed={allFailed}
          onRefresh={refresh}
          badgeColor="#00D4FF"
        />
      </div>
    </div>
  );
}
