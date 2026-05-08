export default function Header({ theme, toggleTheme, activeSection }) {
  const navItems = [
    { label: 'ISS TRACKER', href: '#iss-tracker' },
    { label: 'NEWS', href: '#news' },
    { label: 'CHARTS', href: '#charts' },
  ];

  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3"
      style={{
        background: theme === 'dark'
          ? 'rgba(2, 8, 23, 0.85)'
          : 'rgba(248, 250, 252, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.12)',
        boxShadow: '0 4px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* LOGO */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <span
            className="font-orbitron font-black text-lg sm:text-xl tracking-widest glow-text-cyan"
            style={{ letterSpacing: '0.2em' }}
          >
            ⚡ ANTIGRAVITY
          </span>
          <div
            className="absolute -bottom-0.5 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)',
            }}
          />
        </div>

        {/* LIVE badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10">
          <div className="live-dot" style={{ width: '7px', height: '7px' }} />
          <span className="text-emerald-400 text-xs font-semibold font-orbitron tracking-wider">
            LIVE
          </span>
        </div>
      </div>

      {/* NAV */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => scrollTo(e, item.href)}
            className="relative px-4 py-2 text-xs font-semibold font-orbitron tracking-widest transition-all duration-200 rounded-md group"
            style={{
              color: activeSection === item.href.slice(1)
                ? '#00D4FF'
                : 'rgba(148, 163, 184, 0.8)',
            }}
          >
            <span className="relative z-10">{item.label}</span>
            <div
              className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{
                background: 'rgba(0, 212, 255, 0.08)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
              }}
            />
            {activeSection === item.href.slice(1) && (
              <div
                className="absolute bottom-0 left-4 right-4 h-px"
                style={{ background: '#00D4FF' }}
              />
            )}
          </a>
        ))}
      </nav>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {/* Mobile LIVE badge */}
        <div className="flex sm:hidden items-center gap-1">
          <div className="live-dot" style={{ width: '7px', height: '7px' }} />
        </div>

        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
          style={{
            background: 'rgba(0, 212, 255, 0.1)',
            border: '1px solid rgba(0, 212, 255, 0.25)',
            color: '#00D4FF',
          }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
