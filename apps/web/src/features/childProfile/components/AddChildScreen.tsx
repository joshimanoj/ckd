import { useState } from 'react'
import creatorPhoto from '../../../assets/creator-photo.jpg'
import type { AgeRange } from '@ckd/shared/utils/ageRange'

const AGE_PILLS: Array<{ value: AgeRange; label: string; testId: string }> = [
  { value: 'under-3', label: 'Under 3', testId: 'pill-under-3' },
  { value: '3-4', label: '3–4 years', testId: 'pill-3-4' },
  { value: '5-6', label: '5–6 years', testId: 'pill-5-6' },
]

interface AddChildScreenProps {
  onSave?: (name: string, ageRange: AgeRange) => Promise<void>
  saving?: boolean
  error?: string | null
}

export function AddChildScreen({
  onSave,
  saving = false,
  error = null,
}: AddChildScreenProps) {
  const [name, setName] = useState('')
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
    <div
      data-testid="child-profile-screen"
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3E8FF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}
    >
      {/* Top nav */}
      <nav
        data-testid="top-nav"
        style={{
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontWeight: 600,
            fontSize: '18px',
            color: '#9333EA',
          }}
        >
          Choti Ki Duniya
        </span>
      </nav>

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '24px 16px 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px',
          }}
        >
          <img
            src={creatorPhoto}
            alt="Creator"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <h1
            style={{
              fontFamily: '"Baloo 2", cursive',
              fontWeight: 700,
              fontSize: '22px',
              color: '#1E1B4B',
              margin: 0,
            }}
          >
            Add your child&apos;s profile
          </h1>
        </div>
        <p
          style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '14px',
            color: '#6B7280',
            margin: '0 0 32px 0',
          }}
        >
          We&apos;ll personalise the experience for them
        </p>

        <form onSubmit={handleSubmit}>
          {/* Name input */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="child-name"
              style={{
                display: 'block',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                color: '#1E1B4B',
                marginBottom: '8px',
              }}
            >
              Child&apos;s name *
            </label>
            <input
              id="child-name"
              data-testid="name-input"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Arjun"
              style={{
                width: '100%',
                minHeight: '48px',
                borderRadius: '16px',
                border: '1px solid #D1D5DB',
                padding: '12px 16px',
                fontFamily: 'Nunito, sans-serif',
                fontSize: '17px',
                color: '#1E1B4B',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid #9333EA'
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid #D1D5DB'
              }}
            />
          </div>

          {/* Age range pills */}
          <div style={{ marginBottom: '32px' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                color: '#1E1B4B',
                marginBottom: '12px',
              }}
            >
              Age range
            </label>
            <div role="group" aria-label="Age range" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {AGE_PILLS.map(({ value, label, testId }) => {
                const selected = selectedAge === value
                return (
                  <button
                    key={value}
                    type="button"
                    data-testid={testId}
                    aria-pressed={selected}
                    data-selected={selected}
                    onClick={() => setSelectedAge(value)}
                    style={{
                      minHeight: '48px',
                      padding: '12px 20px',
                      borderRadius: '20px',
                      border: selected ? 'none' : '1px solid #9333EA',
                      backgroundColor: selected ? '#9333EA' : '#F3E8FF',
                      color: selected ? '#FFFFFF' : '#9333EA',
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 600,
                      fontSize: '15px',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error toast */}
          {error && (
            <div
              data-testid="error-toast"
              role="alert"
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#EF4444',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* CTA button */}
          <button
            type="submit"
            data-testid="start-watching-btn"
            disabled={!isValid || saving}
            aria-disabled={!isValid || saving}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: isValid && !saving ? '#F43F5E' : '#D1D5DB',
              color: isValid && !saving ? '#FFFFFF' : '#9CA3AF',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 600,
              fontSize: '17px',
              cursor: isValid && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving ? 'Saving...' : 'Start Watching'}
          </button>
        </form>
      </div>
    </div>
  )
}
