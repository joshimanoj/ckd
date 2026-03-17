import type { Video } from '@ckd/shared/types/video'

interface Props {
  videos: Video[]
  onToggleActive: (videoId: string, currentIsActive: boolean) => Promise<void>
}

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: "'Nunito', sans-serif",
    fontSize: 15,
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 16px',
    borderBottom: '2px solid #E5E7EB',
    color: '#6B7280',
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #E5E7EB',
    color: '#1E1B4B',
    verticalAlign: 'middle' as const,
  },
  toggle: (isActive: boolean): React.CSSProperties => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: isActive ? '#9333EA' : '#D1D5DB',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
    padding: 0,
  }),
  toggleKnob: (isActive: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: 2,
    left: isActive ? 22 : 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'left 150ms ease',
  }),
  emptyState: {
    padding: '40px 16px',
    textAlign: 'center' as const,
    color: '#6B7280',
    fontFamily: "'Nunito', sans-serif",
  },
}

export function VideoList({ videos, onToggleActive }: Props) {
  if (videos.length === 0) {
    return (
      <div style={styles.emptyState}>
        No videos yet. Add your first video.
      </div>
    )
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Title</th>
          <th style={styles.th}>Category</th>
          <th style={styles.th}>Published</th>
          <th style={styles.th}>Active</th>
        </tr>
      </thead>
      <tbody>
        {videos.map((video) => (
          <tr
            key={video.videoId}
            data-testid="video-row"
            style={{ opacity: video.isActive ? 1 : 0.5 }}
          >
            <td style={styles.td}>
              <span data-testid="row-title">{video.title}</span>
            </td>
            <td style={styles.td}>{video.category}</td>
            <td style={styles.td}>
              {video.publishedAt
                ? new Date(
                    (video.publishedAt as unknown as { seconds: number }).seconds * 1000,
                  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </td>
            <td style={styles.td}>
              <button
                data-testid={`toggle-active-${video.videoId}`}
                aria-checked={video.isActive}
                role="switch"
                aria-label={`Toggle active for ${video.title}`}
                style={styles.toggle(video.isActive)}
                onClick={() => void onToggleActive(video.videoId, video.isActive)}
              >
                <span style={styles.toggleKnob(video.isActive)} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
