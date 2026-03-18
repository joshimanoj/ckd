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
import creatorPhoto from '../assets/creator-photo.jpg'

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
      style={{
        minHeight: '100dvh',
        background: '#FFFFFF',
        maxWidth: '100vw',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        data-testid="top-nav"
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(120deg, #CC5AAA 0%, #9333EA 48%, #EC4899 100%)',
          minHeight: 176,
          padding: '18px 20px 26px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -28,
            left: -42,
            width: 154,
            height: 154,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 26,
            right: 22,
            display: 'flex',
            gap: 6,
          }}
        >
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'block',
              }}
            />
          ))}
        </div>

        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 15,
            color: '#FFFFFF',
            margin: 0,
            position: 'relative',
          }}
        >
          9:41
        </p>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginTop: 44,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
            <img
              data-testid="creator-avatar"
              src={creatorPhoto}
              alt="Creator"
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.28)',
                boxSizing: 'border-box',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
              <p
                data-testid="app-title"
                style={{
                  fontFamily: "'Baloo 2', sans-serif",
                  fontWeight: 700,
                  fontSize: 24,
                  color: '#FFFFFF',
                  margin: 0,
                  lineHeight: 0.95,
                }}
              >
                Choti Ki Duniya
              </p>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.92)',
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                {`What shall ${activeProfile?.name ?? 'Arjun'} watch today?`}
              </p>
            </div>
          </div>
          <button
            data-testid="parent-icon"
            onClick={showGate}
            style={{
              width: 42,
              height: 42,
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: 22,
              borderRadius: '50%',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            👤
          </button>
        </div>
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
