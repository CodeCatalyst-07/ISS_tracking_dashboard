import { AstronautCardSkeleton } from './SkeletonLoader';

const CRAFT_COLORS = {
  ISS: { bg: 'rgba(0,212,255,0.15)', border: 'rgba(0,212,255,0.4)', text: '#00D4FF' },
  default: { bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.4)', text: '#7C3AED' },
};

function CraftBadge({ craft }) {
  const style = CRAFT_COLORS[craft] || CRAFT_COLORS.default;
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full font-space-grotesk tracking-wide"
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
    >
      {craft}
    </span>
  );
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export default function AstronautPanel({ astronauts, count, loading, isCachedCrew }) {
  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">PEOPLE IN SPACE</h2>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
            }}
          >
            <span className="font-orbitron font-black text-2xl text-emerald-400">{count || 0}</span>
            <span className="text-xs text-emerald-400/70 font-space-grotesk">humans</span>
          </div>

          {/* Offline data badge */}
          {isCachedCrew && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-space-grotesk"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.35)',
                color: '#FCD34D',
              }}
            >
              ⚡ offline data
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <AstronautCardSkeleton key={i} />)}
        </div>
      ) : astronauts.length === 0 ? (
        <div className="text-center py-6 text-gray-500 font-space-grotesk text-sm">
          No astronaut data available
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {astronauts.map((person, i) => (
            <div
              key={i}
              className="card p-3 flex flex-col items-center gap-2 text-center cursor-default"
              style={{ background: 'rgba(15,23,42,0.6)', transition: 'transform 0.2s ease' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-orbitron font-bold text-sm flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))',
                  border: '1px solid rgba(0,212,255,0.3)',
                  color: '#00D4FF',
                }}
              >
                {getInitials(person.name)}
              </div>
              <div
                className="text-xs font-medium font-space-grotesk leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {person.name}
              </div>
              <CraftBadge craft={person.craft} />
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-center font-space-grotesk" style={{ color: 'var(--text-muted)' }}>
        {isCachedCrew
          ? '⚠ Live astronaut data unavailable — showing known crew'
          : 'Data from open-notify.org · Updated on load'}
      </p>
    </div>
  );
}
