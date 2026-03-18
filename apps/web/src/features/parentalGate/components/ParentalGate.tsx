import { useState } from 'react'

interface ParentalGateProps {
  visible: boolean
  question: string
  onConfirm: (answer: string) => void
  onDismiss: () => void
  shaking: boolean
}

export function ParentalGate({ visible, question, onConfirm, onDismiss, shaking }: ParentalGateProps) {
  const [answer, setAnswer] = useState('')
  const [prevQuestion, setPrevQuestion] = useState(question)

  // Reset answer field when question changes (render-time derived state, avoids effect)
  if (prevQuestion !== question) {
    setPrevQuestion(question)
    setAnswer('')
  }

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes gate-shake {
          0%,100% { transform: translateX(0) }
          20%,60% { transform: translateX(-8px) }
          40%,80% { transform: translateX(8px) }
        }
      `}</style>
      <div
        data-testid="parental-gate"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#FAFAFA',
            borderRadius: 20,
            padding: 24,
            width: 'min(480px, calc(100vw - 32px))',
            position: 'relative',
          }}
        >
          <button
            data-testid="gate-dismiss-btn"
            onClick={onDismiss}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 44,
              height: 44,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            ×
          </button>

          <p
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: '#1E1B4B',
              margin: '0 0 8px 0',
            }}
          >
            Parent access
          </p>

          <p
            data-testid="gate-question"
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 600,
              fontSize: 28,
              color: '#9333EA',
              textAlign: 'center',
              margin: '0 0 16px 0',
            }}
          >
            {question}
          </p>

          <div
            data-testid="gate-input-wrapper"
            style={{
              animation: shaking ? 'gate-shake 200ms ease-in-out' : undefined,
              marginBottom: 16,
            }}
          >
            <input
              data-testid="gate-answer-input"
              type="number"
              inputMode="numeric"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 24,
                textAlign: 'center',
                minHeight: 48,
                borderRadius: 16,
                width: '100%',
                border: '2px solid #9333EA',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            data-testid="gate-submit-btn"
            disabled={answer === ''}
            onClick={() => onConfirm(answer)}
            style={{
              background: answer === '' ? '#D1D5DB' : '#7C3AED',
              color: answer === '' ? '#9CA3AF' : '#fff',
              borderRadius: 24,
              height: 48,
              width: '100%',
              border: 'none',
              cursor: answer === '' ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  )
}
