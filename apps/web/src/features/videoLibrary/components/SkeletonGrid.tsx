interface SkeletonGridProps {
  count?: number
}

export function SkeletonGrid({ count = 6 }: SkeletonGridProps) {
  return (
    <div
      data-testid="skeleton-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8,
        padding: 16,
      }}
    >
      <style>{`
        @keyframes ckd-shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        .ckd-skeleton-card {
          background: linear-gradient(90deg, #F3E8FF 25%, #E9D5FF 50%, #F3E8FF 75%);
          background-size: 200% 100%;
          animation: ckd-shimmer 1.4s infinite linear;
          border-radius: 16px;
        }
      `}</style>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} data-testid="skeleton-card" className="ckd-skeleton-card">
          {/* 16:9 aspect ratio spacer */}
          <div style={{ paddingTop: '56.25%', borderRadius: 16 }} />
          {/* title placeholder */}
          <div style={{ height: 36, margin: '8px 8px 10px', borderRadius: 8, background: 'inherit' }} />
        </div>
      ))}
    </div>
  )
}
