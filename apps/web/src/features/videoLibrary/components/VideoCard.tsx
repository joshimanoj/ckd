import { useState } from 'react'
import type { Video } from '@ckd/shared/types/video'

interface VideoCardProps {
  video: Video
  onClick: (videoId: string) => void
}

const categoryLabel: Record<string, string> = {
  Rhymes: '🎵 Rhymes',
  Colours: '🎨 Colours',
  Numbers: '🔢 Numbers',
  Animals: '🐘 Animals',
  Stories: '⭐ Exclusive',
}

const thumbGradient: Record<string, string> = {
  Rhymes: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 100%)',
  Colours: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
  Numbers: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
  Animals: 'linear-gradient(135deg, #F43F5E 0%, #EC4899 100%)',
  Stories: 'linear-gradient(135deg, #9333EA 0%, #F43F5E 100%)',
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const [imgError, setImgError] = useState(false)
  const [pressed, setPressed] = useState(false)
  const showNewBadge = video.order === 0
  const showExclusiveBadge = video.category === 'Stories'

  return (
    <div
      data-testid="video-card"
      className={`ckd-video-card${pressed ? ' ckd-video-card--pressed' : ''}`}
      onClick={() => onClick(video.videoId)}
      onPointerDown={() => setPressed(true)}
      onPointerLeave={() => setPressed(false)}
      onPointerUp={() => setPressed(false)}
    >
      <div className="ckd-video-card__thumb" style={{ background: thumbGradient[video.category] ?? undefined }}>
        {!imgError && video.thumbnailUrl ? (
          <img
            data-testid="card-thumbnail"
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = ''
              setImgError(true)
            }}
          />
        ) : (
          <div data-testid="thumbnail-placeholder" style={{ position: 'absolute', inset: 0, background: thumbGradient[video.category] }} />
        )}
        <div className="ckd-video-card__play" aria-hidden="true">
          ▶
        </div>
        {showNewBadge ? <div className="ckd-video-card__badge">NEW</div> : null}
        {showExclusiveBadge ? <div className="ckd-video-card__exclusive">🌟 App Exclusive</div> : null}
      </div>

      <div className="ckd-video-card__info">
        <p data-testid="card-title" className="ckd-video-card__title">
          {video.title}
        </p>
        <p data-testid="card-category-chip" className="ckd-video-card__category">
          <span style={{ color: video.category === 'Stories' ? '#F43F5E' : undefined }}>
            {categoryLabel[video.category] ?? video.category}
          </span>
        </p>
      </div>
    </div>
  )
}
