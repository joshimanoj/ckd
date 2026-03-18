import type { Video, Category } from '@ckd/shared/types/video'
import { CATEGORIES } from '@ckd/shared/types/video'
import { CategoryFilter } from './CategoryFilter'
import { SkeletonGrid } from './SkeletonGrid'
import { VideoCard } from './VideoCard'

interface VideoGridProps {
  videos: Video[]
  allVideos: Video[]
  loading: boolean
  error: string | null
  onVideoTap: (videoId: string) => void
  selectedCategory: Category | null
  onCategorySelect: (category: Category | null) => void
  onRefresh: () => void
}

export function VideoGrid({
  videos,
  allVideos,
  loading,
  error,
  onVideoTap,
  selectedCategory,
  onCategorySelect,
  onRefresh,
}: VideoGridProps) {
  if (loading) return <SkeletonGrid />

  if (error !== null) {
    return (
      <div data-testid="error-state" className="ckd-app-shell" style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ font: "700 18px 'Baloo 2', cursive", color: '#1E1B4B', margin: '0 0 8px' }}>
          Check your internet connection
        </p>
        <p style={{ font: '11px monospace', color: '#dc2626', wordBreak: 'break-all', padding: '0 16px' }}>{error}</p>
        <button data-testid="retry-btn" className="ckd-btn-purple" onClick={onRefresh} style={{ padding: '0 24px' }}>
          Retry
        </button>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div data-testid="empty-state" className="ckd-app-shell" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ font: "700 20px 'Baloo 2', cursive", color: '#1E1B4B', margin: '0 0 8px' }}>
          Videos coming soon!
        </p>
        <p style={{ font: "400 15px 'Nunito', sans-serif", color: '#6B7280', margin: 0 }}>
          Check back soon for new rhymes.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100svh - 160px)',
        background: '#BAE6FD',
      }}
    >
      <CategoryFilter
        categories={CATEGORIES}
        selected={selectedCategory}
        onSelect={onCategorySelect}
        visible={allVideos.length >= 20}
      />

      <div
        data-testid="video-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          padding: '12px 16px 24px',
          alignContent: 'start',
        }}
      >
        {videos.map((video) => (
          <VideoCard key={video.videoId} video={video} onClick={onVideoTap} />
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'center' }}>
          <button
            data-testid="refresh-btn"
            className="ckd-btn-ghost"
            onClick={onRefresh}
            style={{ minHeight: 40, border: '2px solid #9333EA', padding: '0 24px' }}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
