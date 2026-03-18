import type { Video } from '@ckd/shared/types/video'

interface Props {
  videos: Video[]
  onToggleActive: (videoId: string, currentIsActive: boolean) => Promise<void>
}

function statusBadge(isActive: boolean) {
  return {
    text: isActive ? 'Live' : 'Draft',
    background: isActive ? '#DCFCE7' : '#FEF9C3',
    color: isActive ? '#15803D' : '#A16207',
  }
}

export function VideoList({ videos, onToggleActive }: Props) {
  if (videos.length === 0) {
    return <div style={{ padding: '40px 16px', textAlign: 'center', color: '#6B7280', font: "400 14px 'Nunito', sans-serif" }}>No videos yet. Add your first video.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {videos.map((video) => {
        const badge = statusBadge(video.isActive)

        return (
          <div key={video.videoId} data-testid="video-row" className="ckd-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 }}>
            <div
              style={{
                width: 64,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 16,
              }}
            >
              {video.category.includes('Number') ? '🔢' : video.category.includes('Rhymes') ? '🎵' : '🌞'}
            </div>

            <div style={{ minWidth: 0 }}>
              <p data-testid="row-title" style={{ margin: 0, color: '#1E1B4B', font: "700 13px 'Nunito', sans-serif" }}>
                {video.title}
              </p>
              <p style={{ margin: '2px 0 0', color: '#9333EA', font: "600 12px 'Nunito', sans-serif" }}>{video.category}</p>
            </div>

            <span
              style={{
                marginLeft: 'auto',
                padding: '3px 10px',
                borderRadius: 10,
                background: badge.background,
                color: badge.color,
                font: "700 11px 'Nunito', sans-serif",
              }}
            >
              {badge.text}
            </span>

            <button
              data-testid={`toggle-active-${video.videoId}`}
              aria-checked={video.isActive}
              role="switch"
              aria-label={`Toggle active for ${video.title}`}
              className={`ckd-toggle ${video.isActive ? 'ckd-toggle--on' : ''}`}
              onClick={() => void onToggleActive(video.videoId, video.isActive)}
            >
              <span className="ckd-toggle-knob" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
