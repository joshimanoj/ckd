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
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#dc2626', wordBreak: 'break-all', padding: '0 16px' }}>
          {error}
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
    <div
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 6%, #BFE5FF 18%, #A9D8FB 100%)',
        padding: '0 0 28px',
        borderTop: '22px solid #FFFFFF',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: 'visible',
        flex: 1,
        minHeight: 'calc(100dvh - 212px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
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
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px 22px',
          padding: '24px 22px 10px',
          alignContent: 'start',
        }}
      >
        {videos.map((video) => (
          <VideoCard key={video.videoId} video={video} onClick={onVideoTap} />
        ))}
      </div>
      <div style={{ padding: '16px 16px 28px', display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
        <button
          data-testid="refresh-btn"
          onClick={onRefresh}
          style={{
            background: 'transparent',
            border: '2px solid #9333EA',
            borderRadius: 999,
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
