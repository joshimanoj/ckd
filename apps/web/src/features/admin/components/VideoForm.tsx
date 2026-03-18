import { useState } from 'react'
import { CATEGORIES, type Category } from '@ckd/shared/types/video'
import type { AddVideoInput } from '../services/adminService'
import { parseDuration } from '../utils/duration'

interface Props {
  open: boolean
  onClose: () => void
  onPublish: (input: Omit<AddVideoInput, 'order'>) => Promise<void>
  onError: (msg: string) => void
}

interface FormFields {
  youtubeVideoId: string
  title: string
  category: Category
  duration: string
  thumbnailUrl: string
}

interface FormErrors {
  youtubeVideoId?: string
  title?: string
  duration?: string
}

const THUMB_URL = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  fontFamily: "'Nunito', sans-serif",
  fontSize: 15,
  color: '#1E1B4B',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Nunito', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: '#6B7280',
  marginBottom: 4,
}

const errorStyle: React.CSSProperties = {
  fontFamily: "'Nunito', sans-serif",
  fontSize: 13,
  color: '#EF4444',
  marginTop: 4,
}

export function VideoForm({ open, onClose, onPublish, onError }: Props) {
  const [fields, setFields] = useState<FormFields>({
    youtubeVideoId: '',
    title: '',
    category: 'Rhymes',
    duration: '',
    thumbnailUrl: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  function validateField(name: keyof FormErrors, value: string): string | undefined {
    if (name === 'youtubeVideoId' && !value.trim()) return 'YouTube Video ID is required'
    if (name === 'title' && !value.trim()) return 'Title is required'
    if (name === 'duration') {
      if (!value.trim()) return 'Duration is required'
      if (parseDuration(value) === null) return 'Use mm:ss format (e.g. 3:45)'
    }
    return undefined
  }

  function handleBlur(name: keyof FormErrors, value: string) {
    const err = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: err }))

    if (name === 'youtubeVideoId' && value.trim()) {
      const url = THUMB_URL(value.trim())
      setFields((prev) => ({ ...prev, thumbnailUrl: url }))
    }
  }

  function validateAll(): FormErrors {
    return {
      youtubeVideoId: validateField('youtubeVideoId', fields.youtubeVideoId),
      title: validateField('title', fields.title),
      duration: validateField('duration', fields.duration),
    }
  }

  async function handlePublish() {
    const errs = validateAll()
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    const durationSeconds = parseDuration(fields.duration)!
    setSubmitting(true)
    try {
      await onPublish({
        youtubeVideoId: fields.youtubeVideoId.trim(),
        title: fields.title.trim(),
        category: fields.category,
        thumbnailUrl: fields.thumbnailUrl || THUMB_URL(fields.youtubeVideoId.trim()),
        durationSeconds,
      })
      setFields({ youtubeVideoId: '', title: '', category: 'Rhymes', duration: '', thumbnailUrl: '' })
      setErrors({})
      onClose()
    } catch {
      onError('Failed to publish video. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      data-testid="video-form-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 480,
        height: '100vh',
        background: '#FFFFFF',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2 style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 22, color: '#1E1B4B', margin: 0 }}>
          Add Video
        </h2>
        <button
          onClick={onClose}
          aria-label="Close form"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6B7280' }}
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

        {/* YouTube Video ID */}
        <div>
          <label style={labelStyle}>YouTube Video ID *</label>
          <input
            data-testid="input-youtubeVideoId"
            style={inputStyle}
            value={fields.youtubeVideoId}
            onChange={(e) => setFields((p) => ({ ...p, youtubeVideoId: e.target.value }))}
            onBlur={(e) => handleBlur('youtubeVideoId', e.target.value)}
            placeholder="e.g. dQw4w9WgXcQ"
          />
          {errors.youtubeVideoId && (
            <p data-testid="error-youtubeVideoId" style={errorStyle}>{errors.youtubeVideoId}</p>
          )}
        </div>

        {/* Thumbnail preview */}
        {fields.thumbnailUrl && (
          <img
            data-testid="thumbnail-preview"
            src={fields.thumbnailUrl}
            alt="Thumbnail preview"
            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8 }}
          />
        )}

        {/* Thumbnail URL */}
        <div>
          <label style={labelStyle}>Thumbnail URL</label>
          <input
            data-testid="input-thumbnailUrl"
            style={inputStyle}
            value={fields.thumbnailUrl}
            onChange={(e) => setFields((p) => ({ ...p, thumbnailUrl: e.target.value }))}
            placeholder="Auto-populated from YouTube ID"
          />
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            data-testid="input-title"
            style={inputStyle}
            value={fields.title}
            maxLength={80}
            onChange={(e) => setFields((p) => ({ ...p, title: e.target.value }))}
            onBlur={(e) => handleBlur('title', e.target.value)}
            placeholder="Video title"
          />
          {errors.title && (
            <p data-testid="error-title" style={errorStyle}>{errors.title}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>Category *</label>
          <select
            data-testid="input-category"
            style={{ ...inputStyle, appearance: 'auto' }}
            value={fields.category}
            onChange={(e) => setFields((p) => ({ ...p, category: e.target.value as Category }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label style={labelStyle}>Duration (mm:ss) *</label>
          <input
            data-testid="input-duration"
            style={inputStyle}
            value={fields.duration}
            onChange={(e) => setFields((p) => ({ ...p, duration: e.target.value }))}
            onBlur={(e) => handleBlur('duration', e.target.value)}
            placeholder="e.g. 3:45"
          />
          {errors.duration && (
            <p data-testid="error-duration" style={errorStyle}>{errors.duration}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
        <button
          data-testid="btn-publish"
          disabled={submitting}
          onClick={() => void handlePublish()}
          className="ckd-btn-purple"
          style={{ width: '100%', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </div>
  )
}
