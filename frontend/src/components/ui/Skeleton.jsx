// Dark-theme shimmer skeleton — dark-on-dark gradient, not light gray

export const Skeleton = ({ className = '', width, height }) => (
  <div
    className={`rounded ${className}`}
    style={{
      width, height,
      background: 'linear-gradient(90deg, #161b22 25%, #1e2633 50%, #161b22 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite',
    }}
  />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height={12} className="w-full" style={{ width: i === lines - 1 ? '65%' : '100%' }} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-base-card border border-base-border rounded-lg p-4 space-y-3 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton width={36} height={36} className="rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton height={12} className="w-3/4" />
        <Skeleton height={10} className="w-1/2" />
      </div>
    </div>
    <Skeleton height={10} className="w-full" />
    <Skeleton height={10} className="w-4/5" />
  </div>
);
