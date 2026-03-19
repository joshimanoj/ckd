import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '@ckd/shared/firebase/config'
import creatorPhoto from '../assets/creator-photo.jpg'
import { ParentPanel } from '../features/dashboard/components/ParentPanel'
import { ParentalGate } from '../features/parentalGate/components/ParentalGate'
import { VideoGrid } from '../features/videoLibrary/components/VideoGrid'
import { useVideoLibrary } from '../features/videoLibrary/hooks/useVideoLibrary'
import { useChildProfileStore } from '../shared/store/childProfileStore'
import { useParentalGate } from '../shared/hooks/useParentalGate'
import { useAuthStore } from '../shared/store/authStore'

export function LibraryPage() {
  const { isVisible, currentQuestion, showGate, hideGate, checkAnswer } = useParentalGate()
  const { videos, allVideos, loading, error, selectedCategory, selectCategory, refresh } = useVideoLibrary(db)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [panelVisible, setPanelVisible] = useState(false)
  const user = useAuthStore((s) => s.user)
  const activeProfile = useChildProfileStore((s) => s.activeProfile)
  const [shaking, setShaking] = useState(false)
  const panelMode = searchParams.get('panel')

  useEffect(() => {
    if (panelMode === 'settings') {
      setPanelVisible(true)
    }
  }, [panelMode])

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

  function handleClosePanel() {
    setPanelVisible(false)
    if (panelMode === 'settings') {
      navigate('/library', { replace: true })
    }
  }

  return (
    <div data-testid="library-screen" className="ckd-library-screen">
      <header
        data-testid="top-nav"
        className="ckd-library-header"
        style={{ background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)' }}
      >
        <div
          className="ckd-blob"
          style={{ width: 150, height: 150, top: -20, right: -30, opacity: 0.15 }}
        />

        <div className="ckd-library-header-row">
          <div className="ckd-library-brand">
            <div className="ckd-header-avatar" data-testid="creator-avatar">
              <img src={creatorPhoto} alt="Creator" />
            </div>
            <div className="ckd-brand-lockup">
              <p className="ckd-brand-title" data-testid="app-title">
                Choti Ki <span>Duniya</span>
              </p>
              <p className="ckd-brand-subtitle">{`What shall ${activeProfile?.name ?? 'Arjun'} watch today? 🌟`}</p>
            </div>
          </div>

          <button data-testid="parent-icon" className="ckd-parent-button" onClick={showGate}>
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

      {panelVisible && user && activeProfile ? (
        <ParentPanel
          db={db}
          uid={user.uid}
          childProfileId={activeProfile.id}
          onClose={handleClosePanel}
          initialTab={panelMode === 'settings' ? 'settings' : 'dashboard'}
        />
      ) : null}

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
