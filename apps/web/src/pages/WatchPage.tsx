import { useParams } from 'react-router-dom'

export function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>()
  return (
    <div
      data-testid="watch-page"
      style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ color: '#fff' }}>Video Player — Story 7 (videoId: {videoId})</span>
    </div>
  )
}
