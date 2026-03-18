import { useState } from 'react'
import type { AgeRange } from '@ckd/shared/utils/ageRange'

const AGE_OPTIONS: Array<{ value: AgeRange; emoji: string; label: string; testId: string }> = [
  { value: 'under-3', emoji: '👶', label: 'Under 3', testId: 'pill-under-3' },
  { value: '3-4', emoji: '🧒', label: '3 - 4 yrs', testId: 'pill-3-4' },
  { value: '5-6', emoji: '🧑', label: '5 - 6 yrs', testId: 'pill-5-6' },
]

interface AddChildScreenProps {
  onSave?: (name: string, ageRange: AgeRange) => Promise<void>
  saving?: boolean
  error?: string | null
}

export function AddChildScreen({ onSave, saving = false, error = null }: AddChildScreenProps) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [selectedAge, setSelectedAge] = useState<AgeRange | null>(null)

  const isValid = name.trim().length > 0 && selectedAge !== null

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value.slice(0, 50))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || saving || !onSave) return
    await onSave(name.trim(), selectedAge!)
  }

  return (
    <div data-testid="child-profile-screen" className="ckd-profile-screen">
      <header className="ckd-profile-header">
        <div className="ckd-blob-large" />
        <div className="ckd-blob" style={{ top: 34, right: -32, opacity: 0.22 }} />
        <div data-testid="top-nav" />
        <div className="ckd-avatar-hero">🧒</div>
        <h1 className="ckd-screen-title">Add your child&apos;s profile</h1>
        <p className="ckd-screen-subtitle">We&apos;ll personalise the experience for them</p>
      </header>

      <div className="ckd-profile-body">
        <form onSubmit={handleSubmit}>
          <div className="ckd-input-group">
            <label className="ckd-input-label" htmlFor="child-name">
              Child&apos;s name *
            </label>
            <input
              id="child-name"
              data-testid="name-input"
              className="ckd-input"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Arjun"
            />
          </div>

          <div className="ckd-input-group">
            <label className="ckd-input-label" htmlFor="child-dob">
              Date of birth *
            </label>
            <input
              id="child-dob"
              className="ckd-input"
              type="text"
              value={dob}
              onChange={(e) => setDob(e.target.value.slice(0, 14))}
              placeholder="DD / MM / YYYY"
            />
          </div>

          <div className="ckd-input-group">
            <label className="ckd-input-label">Age group</label>
            <div className="ckd-choice-grid" role="group" aria-label="Age range">
              {AGE_OPTIONS.map((option) => {
                const selected = selectedAge === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    data-testid={option.testId}
                    aria-pressed={selected}
                    onClick={() => setSelectedAge(option.value)}
                    className={`ckd-choice-card${selected ? ' ckd-choice-card--selected' : ''}`}
                  >
                    <span className="ckd-choice-emoji">{option.emoji}</span>
                    <span className="ckd-choice-label">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error ? (
            <div
              data-testid="error-toast"
              role="alert"
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#ef4444',
                font: "600 14px 'Nunito', sans-serif",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            data-testid="start-watching-btn"
            disabled={!isValid || saving}
            aria-disabled={!isValid || saving}
            className="ckd-btn-primary"
            style={{ width: '100%', marginTop: 24, opacity: isValid && !saving ? 1 : 0.45 }}
          >
            {saving ? 'Saving...' : 'Start Watching 🎬'}
          </button>

          <button type="button" className="ckd-btn-ghost" style={{ width: '100%', marginTop: 12, color: '#6B7280' }}>
            Add another child (optional)
          </button>
        </form>
      </div>
    </div>
  )
}
