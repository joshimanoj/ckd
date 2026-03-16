import { useState } from 'react'
import { useParentalGate } from '../shared/hooks/useParentalGate'
import { ParentalGate } from '../features/parentalGate/components/ParentalGate'

export function LibraryPage() {
  const { isVisible, currentQuestion, showGate, hideGate, checkAnswer } = useParentalGate()
  const [panelVisible, setPanelVisible] = useState(false)
  const [shaking, setShaking] = useState(false)

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
      <nav
        data-testid="top-nav"
        style={{
          background: '#fff',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <span
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 600,
            fontSize: 18,
            color: '#9333EA',
          }}
        >
          Choti Ki Duniya
        </span>
        <button
          data-testid="parent-icon-btn"
          onClick={showGate}
          style={{
            position: 'absolute',
            right: 8,
            top: 6,
            width: 44,
            height: 44,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          🔒
        </button>
      </nav>

      <div data-testid="video-grid-placeholder" style={{ flex: 1 }} />

      {panelVisible && (
        <div data-testid="parent-panel">Parent Panel (Story 8)</div>
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
