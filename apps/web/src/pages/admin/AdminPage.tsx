import { useEffect, useState } from 'react'
import { NotificationPanel } from '../../features/admin/components/NotificationPanel'
import { VideoForm } from '../../features/admin/components/VideoForm'
import { VideoList } from '../../features/admin/components/VideoList'
import { useAdmin } from '../../features/admin/hooks/useAdmin'

export function AdminPage() {
  const {
    videos,
    loading,
    publishVideo,
    toggleVideoActive,
    sendNotification,
    latestNotification,
    notificationLoading,
  } = useAdmin()
  const [formOpen, setFormOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  async function handlePublish(input: Parameters<typeof publishVideo>[0]) {
    await publishVideo(input)
    setFormOpen(false)
    showToast('Video published successfully')
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setFormOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const liveVideos = videos.filter((video) => video.isActive).length
  const exclusiveVideos = videos.filter((video) => video.category === 'Stories').length

  return (
    <div data-testid="admin-page" className="ckd-admin-shell" style={{ minHeight: '100svh', background: '#F1F0F8' }}>
      <header
        style={{
          background: '#1E1B4B',
          color: '#FFFFFF',
          padding: '60px 20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 28 }}>🎬</span>
          <h1 style={{ margin: 0, color: '#FFFFFF', font: "800 20px 'Baloo 2', cursive" }}>Creator Admin</h1>
        </div>
        <p style={{ margin: '6px 0 24px', color: 'rgba(255,255,255,0.6)', font: "400 13px 'Nunito', sans-serif" }}>
          Choti Ki Duniya · creator@chotikiduniya.com
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Total Videos', value: String(videos.length) },
            { label: 'App Users', value: '247' },
            { label: 'Notif Opt-ins', value: '189' },
            { label: "Today's Views", value: '83' },
          ].map((stat) => (
            <div key={stat.label} className="ckd-card" style={{ padding: 14, borderRadius: 14, boxShadow: 'none' }}>
              <p style={{ margin: 0, color: '#6B7280', font: "600 12px 'Nunito', sans-serif" }}>{stat.label}</p>
              <p style={{ margin: '2px 0 0', color: '#1E1B4B', font: "800 24px 'Baloo 2', cursive" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      </header>

      <main style={{ padding: 16, background: '#F1F0F8', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ margin: 0, color: '#1E1B4B', font: "700 16px 'Baloo 2', cursive" }}>Videos</p>
          <button
            data-testid="btn-add-video"
            className="ckd-btn-purple"
            onClick={() => setFormOpen(true)}
            style={{ padding: '0 24px' }}
          >
            + Add New Video
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#6B7280', font: "400 14px 'Nunito', sans-serif" }}>Loading videos…</p>
        ) : (
          <VideoList videos={videos} onToggleActive={toggleVideoActive} />
        )}

        <NotificationPanel
          onSend={sendNotification}
          latestNotification={latestNotification}
          notificationLoading={notificationLoading}
        />
      </main>

      <VideoForm open={formOpen} onClose={() => setFormOpen(false)} onPublish={handlePublish} onError={showToast} />

      {toast ? (
        <div
          data-testid="toast-success"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: 24,
            background: '#22C55E',
            color: '#FFFFFF',
            font: "600 15px 'Nunito', sans-serif",
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 200,
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
