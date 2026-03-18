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
        background: '#FFFFFF',
        borderRadius: 28,
        boxShadow: '0 16px 28px rgba(76, 29, 149, 0.12)',
        cursor: 'pointer',
        overflow: 'hidden',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 100ms',
        minHeight: 214,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 106,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 55%, #EC4899 100%)',
          flex: '0 0 auto',
        }}
      >
        {imgError ? (
          <div
            data-testid="thumbnail-placeholder"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)',
            }}
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
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(17, 24, 39, 0.04) 100%)',
          }}
        />
      </div>

      <div
        style={{
          padding: '14px 16px 16px',
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          minHeight: 108,
          boxSizing: 'border-box',
        }}
      >
        <p
          data-testid="card-title"
          style={{
            margin: '0 0 6px 0',
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.08,
            color: '#1E1B4B',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 32,
          }}
        >
          {video.title}
        </p>
        <p
          data-testid="card-category-chip"
          style={{
            margin: 0,
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 11,
            color: '#9333EA',
            lineHeight: 1.1,
          }}
        >
          {video.category}
        </p>
      </div>
    </div>
  )
}
