/**
 * SkeletonLoader — reusable shimmer skeleton components
 */

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '6px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, flexShrink: 0 }}
    />
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Image block */}
      <Skeleton width="100%" height="160px" borderRadius="8px" />
      {/* Category badge */}
      <Skeleton width="80px" height="20px" borderRadius="12px" />
      {/* Title */}
      <div className="flex flex-col gap-1">
        <Skeleton width="100%" height="14px" />
        <Skeleton width="75%" height="14px" />
      </div>
      {/* Source row */}
      <div className="flex gap-2">
        <Skeleton width="100px" height="12px" />
        <Skeleton width="60px" height="12px" />
      </div>
      {/* Description */}
      <div className="flex flex-col gap-1">
        <Skeleton width="100%" height="12px" />
        <Skeleton width="90%" height="12px" />
        <Skeleton width="60%" height="12px" />
      </div>
      {/* Button */}
      <Skeleton width="100px" height="32px" borderRadius="6px" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="flex flex-col gap-2 py-3">
      <Skeleton width="70px" height="11px" />
      <Skeleton width="130px" height="28px" />
    </div>
  );
}

export function AstronautCardSkeleton() {
  return (
    <div className="card p-3 flex flex-col gap-2">
      <Skeleton width="100%" height="16px" />
      <Skeleton width="60px" height="20px" borderRadius="12px" />
    </div>
  );
}
