import type { Video, Category } from '@ckd/shared/types/video'
import { CATEGORIES } from '@ckd/shared/types/video'
import { VideoCard } from './VideoCard'
import { SkeletonGrid } from './SkeletonGrid'
import { CategoryFilter } from './CategoryFilter'

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
  if (loading) {
    return <SkeletonGrid />
  }

  if (error !== null) {
    return (
      <div data-testid="error-state" style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 18, color: '#1E1B4B' }}>
          Check your internet connection
        </p>
        <button
          data-testid="retry-btn"
          onClick={onRefresh}
          style={{
            background: '#9333EA',
            color: 'white',
            border: 'none',
            borderRadius: 20,
            padding: '10px 24px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div data-testid="empty-state" style={{ padding: 40, textAlign: 'center' }}>
        <p
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: '#1E1B4B',
            margin: '0 0 8px',
          }}
        >
          Videos coming soon!
        </p>
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 400,
            fontSize: 15,
            color: '#6B7280',
            margin: 0,
          }}
        >
          Check back soon for new rhymes.
        </p>
      </div>
    )
  }

  return (
    <div>
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
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          padding: '16px',
        }}
      >
        {videos.map((video) => (
          <VideoCard key={video.videoId} video={video} onClick={onVideoTap} />
        ))}
      </div>
      <div style={{ padding: '8px 16px 24px', display: 'flex', justifyContent: 'center' }}>
        <button
          data-testid="refresh-btn"
          onClick={onRefresh}
          style={{
            background: 'transparent',
            border: '2px solid #9333EA',
            borderRadius: 20,
            padding: '8px 24px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: '#9333EA',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
