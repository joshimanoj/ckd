import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParentalGate } from '../shared/hooks/useParentalGate'
import { ParentalGate } from '../features/parentalGate/components/ParentalGate'
import { useVideoLibrary } from '../features/videoLibrary/hooks/useVideoLibrary'
import { VideoGrid } from '../features/videoLibrary/components/VideoGrid'
import { ParentPanel } from '../features/dashboard/components/ParentPanel'
import { useAuthStore } from '../shared/store/authStore'
import { useChildProfileStore } from '../shared/store/childProfileStore'
import { db } from '@ckd/shared/firebase/config'

export function LibraryPage() {
  const { isVisible, currentQuestion, showGate, hideGate, checkAnswer } = useParentalGate()
  const { videos, allVideos, loading, error, selectedCategory, selectCategory, refresh } = useVideoLibrary(db)
  const navigate = useNavigate()
  const [panelVisible, setPanelVisible] = useState(false)
  const user = useAuthStore((s) => s.user)
  const activeProfile = useChildProfileStore((s) => s.activeProfile)
  const [shaking, setShaking] = useState(false)

  function handleVideoTap(videoId: string) {
    navigate(`/watch/${videoId}`)
  }

  function handleConfirm(answer: string) {
    const correct = checkAnswer(answer)
    if (correct) {
      hideGate()
      setPanelVisible(true)
    } else {
      setShaking(true)
      setTimeout(() => setShaking(false), 250)
    }
  }

  return (
    <div
      data-testid="library-screen"
      style={{ minHeight: '100vh', background: '#F3E8FF', maxWidth: '100vw', overflowX: 'hidden' }}
    >
      <header
        data-testid="top-nav"
        style={{
          background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          position: 'relative',
        }}
      >
        <img
          data-testid="creator-avatar"
          src="/src/assets/creator-photo.jpg"
          alt="Creator"
          style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginRight: 12 }}
        />
        <span
          data-testid="app-title"
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: '#fff',
            flex: 1,
          }}
        >
          Choti Ki Duniya
        </span>
        <button
          data-testid="parent-icon-btn"
          onClick={showGate}
          style={{
            width: 44,
            height: 44,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 22,
            borderRadius: '50%',
          }}
        >
          🔒
        </button>
      </header>

      <VideoGrid
        videos={videos}
        allVideos={allVideos}
        loading={loading}
        error={error}
        onVideoTap={handleVideoTap}
        selectedCategory={selectedCategory}
        onCategorySelect={selectCategory}
        onRefresh={refresh}
      />

      {panelVisible && user && activeProfile && (
        <ParentPanel
          db={db}
          uid={user.uid}
          childProfileId={activeProfile.id}
          onClose={() => setPanelVisible(false)}
        />
      )}

      <ParentalGate
        visible={isVisible}
        question={currentQuestion.question}
        onConfirm={handleConfirm}
        onDismiss={hideGate}
        shaking={shaking}
      />
    </div>
  )
}
