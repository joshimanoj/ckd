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

  if (prevQuestion !== question) {
    setPrevQuestion(question)
    setAnswer('')
  }

  if (!visible) return null

  function appendDigit(value: string) {
    setAnswer(answer + value)
  }

  function handleConfirm() {
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
        <p
          style={{
            margin: '0 0 12px',
            textAlign: 'center',
            color: '#6B7280',
            font: "400 14px 'Nunito', sans-serif",
          }}
        >
          Solve this to access parent settings
        </p>

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
