import { useState } from 'react'
import type { Video } from '@ckd/shared/types/video'

interface VideoCardProps {
  video: Video
  onClick: (videoId: string) => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const [imgError, setImgError] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <div
      data-testid="video-card"
      onClick={() => onClick(video.videoId)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        background: '#FAFAFA',
        borderRadius: 16,
        boxShadow: '0 4px 4px rgba(147,51,234,0.12)',
        cursor: 'pointer',
        overflow: 'hidden',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 100ms',
      }}
    >
      {/* 16:9 thumbnail area */}
      <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 16, overflow: 'hidden' }}>
        {imgError ? (
          <div
            data-testid="thumbnail-placeholder"
            style={{ position: 'absolute', inset: 0, background: '#E5E7EB' }}
          />
        ) : (
          <img
            data-testid="card-thumbnail"
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = ''
              setImgError(true)
            }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <span
          data-testid="card-category-chip"
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: '#F3E8FF',
            color: '#9333EA',
            borderRadius: 20,
            padding: '4px 10px',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {video.category}
        </span>
      </div>

      {/* Title */}
      <p
        data-testid="card-title"
        style={{
          margin: 0,
          padding: '8px 8px 10px',
          fontFamily: "'Baloo 2', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          color: '#1E1B4B',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {video.title}
      </p>
    </div>
  )
}
