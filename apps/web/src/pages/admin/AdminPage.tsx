import { useState, useEffect } from 'react'
import { useAdmin } from '../../features/admin/hooks/useAdmin'
import { VideoList } from '../../features/admin/components/VideoList'
import { VideoForm } from '../../features/admin/components/VideoForm'
import { NotificationPanel } from '../../features/admin/components/NotificationPanel'

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

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handlePublish(input: Parameters<typeof publishVideo>[0]) {
    await publishVideo(input)
    setFormOpen(false)
    showToast('Video published successfully')
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFormOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      data-testid="admin-page"
      style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          background: '#1E1B4B',
          color: 'white',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <h1
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: 'white',
            margin: '0 0 24px 0',
          }}
        >
          Admin Panel
        </h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: '#C4B5FD', fontSize: 14, padding: '8px 12px' }}>Videos</span>
          <span style={{ color: '#C4B5FD', fontSize: 14, padding: '8px 12px' }}>Notifications</span>
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, background: '#FAFAFA', padding: 24, overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: '#1E1B4B',
              margin: 0,
            }}
          >
            Videos
          </h2>
          <button
            data-testid="btn-add-video"
            onClick={() => setFormOpen(true)}
            style={{
              height: 44,
              background: '#F43F5E',
              color: 'white',
              border: 'none',
              borderRadius: 24,
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 600,
              fontSize: 15,
              padding: '0 24px',
              cursor: 'pointer',
            }}
          >
            Add Video
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#6B7280' }}>Loading videos…</p>
        ) : (
          <VideoList videos={videos} onToggleActive={toggleVideoActive} />
        )}

        <NotificationPanel
          onSend={sendNotification}
          latestNotification={latestNotification}
          notificationLoading={notificationLoading}
        />
      </main>

      {/* VideoForm slide-over */}
      <VideoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onPublish={handlePublish}
        onError={showToast}
      />

      {/* Success toast */}
      {toast && (
        <div
          data-testid="toast-success"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#22C55E',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 24,
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            zIndex: 200,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
