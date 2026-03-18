import { useState } from 'react'

interface ParentalGateProps {
  visible: boolean
  question: string
  onConfirm: (answer: string) => void
  onDismiss: () => void
  shaking: boolean
}

type GateMode = 'sum' | 'pin'

function solveQuestion(question: string): string {
  const match = question.match(/(\d+)\s*\+\s*(\d+)/)
  if (!match) return ''
  return String(Number(match[1]) + Number(match[2]))
}

export function ParentalGate({ visible, question, onConfirm, onDismiss, shaking }: ParentalGateProps) {
  const [mode, setMode] = useState<GateMode>('sum')
  const [answer, setAnswer] = useState('')
  const [prevQuestion, setPrevQuestion] = useState(question)

  if (prevQuestion !== question) {
    setPrevQuestion(question)
    setAnswer('')
    setMode('sum')
  }

  if (!visible) return null

  function appendDigit(value: string) {
    const next = mode === 'pin' ? answer.slice(0, 3) + value : answer + value
    setAnswer(next)
  }

  function handleConfirm() {
    if (mode === 'pin') {
      if (answer === '1234') {
        onConfirm(solveQuestion(question))
      } else {
        onConfirm(answer)
      }
      return
    }
    onConfirm(answer)
  }

  return (
    <div data-testid="parental-gate" className="ckd-modal-scrim" onClick={(e) => e.stopPropagation()}>
      <div className="ckd-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 8 }}>🔐</div>
        <p
          style={{
            margin: '0 0 6px',
            textAlign: 'center',
            color: '#1E1B4B',
            font: "800 22px 'Baloo 2', cursive",
          }}
        >
          Parent Check
        </p>

        <div className="ckd-tab-strip" style={{ marginBottom: 16 }}>
          <button className={`ckd-tab ${mode === 'sum' ? 'ckd-tab--active' : ''}`} onClick={() => setMode('sum')}>
            🧮 Quick Sum
          </button>
          <button className={`ckd-tab ${mode === 'pin' ? 'ckd-tab--active' : ''}`} onClick={() => setMode('pin')}>
            🔢 4-Digit PIN
          </button>
        </div>

        <p
          style={{
            margin: '0 0 12px',
            textAlign: 'center',
            color: '#6B7280',
            font: "400 14px 'Nunito', sans-serif",
            whiteSpace: 'pre-line',
          }}
        >
          {mode === 'sum'
            ? 'Solve this to access parent settings'
            : 'Enter your 4-digit parent PIN\n(Default PIN: 1234 - change in Settings)'}
        </p>

        {mode === 'sum' ? (
          <div
            style={{
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)',
            }}
          >
            <p
              data-testid="gate-question"
              style={{
                margin: 0,
                color: '#FFFFFF',
                font: "800 26px 'Baloo 2', cursive",
              }}
            >
              {question}
            </p>
          </div>
        ) : (
          <div data-testid="gate-question" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
            {question}
          </div>
        )}

        <div
          data-testid="gate-input-wrapper"
          style={{
            minHeight: 52,
            marginBottom: 16,
            borderRadius: 14,
            border: `2px solid ${shaking ? '#EF4444' : '#E5E7EB'}`,
            background: shaking ? '#FEF2F2' : '#F3E8FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: shaking ? 'gate-shake 0.3s' : undefined,
          }}
        >
          {mode === 'pin' ? (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${index < answer.length ? '#9333EA' : '#D1D5DB'}`,
                    background: index < answer.length ? '#9333EA' : 'transparent',
                  }}
                />
              ))}
            </div>
          ) : (
            <input
              data-testid="gate-answer-input"
              type="number"
              inputMode="numeric"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                background: 'transparent',
                color: shaking ? '#EF4444' : '#1E1B4B',
                font: "700 28px 'Baloo 2', cursive",
                letterSpacing: 4,
              }}
            />
          )}
          {mode === 'pin' ? (
            <input data-testid="gate-answer-input" value={answer} readOnly style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
          ) : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => appendDigit(String(digit))}
              style={{
                height: 52,
                border: 'none',
                borderRadius: 14,
                background: '#F3E8FF',
                color: '#9333EA',
                font: "700 22px 'Baloo 2', cursive",
                cursor: 'pointer',
              }}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAnswer((value) => value.slice(0, -1))}
            style={{
              height: 52,
              border: 'none',
              borderRadius: 14,
              background: '#FEF2F2',
              color: '#EF4444',
              font: "700 18px 'Nunito', sans-serif",
              cursor: 'pointer',
            }}
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => appendDigit('0')}
            style={{
              height: 52,
              border: 'none',
              borderRadius: 14,
              background: '#F3E8FF',
              color: '#9333EA',
              font: "700 22px 'Baloo 2', cursive",
              cursor: 'pointer',
            }}
          >
            0
          </button>
          <button
            data-testid="gate-dismiss-btn"
            type="button"
            onClick={onDismiss}
            style={{
              height: 52,
              border: 'none',
              borderRadius: 14,
              background: '#F3F4F6',
              color: '#6B7280',
              font: "700 14px 'Nunito', sans-serif",
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <button
          data-testid="gate-submit-btn"
          disabled={answer === ''}
          onClick={handleConfirm}
          className="ckd-btn-primary"
          style={{ width: '100%', marginTop: 16, opacity: answer === '' ? 0.45 : 1 }}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
