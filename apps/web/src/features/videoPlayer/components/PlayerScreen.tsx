import { useState, useEffect, useCallback, useRef, type ChangeEvent, type CSSProperties, type ReactNode } from 'react'
import type { Video } from '@ckd/shared/types/video'

function toMMSS(seconds: number): string {
  const s = Math.floor(seconds)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}`
}

function isMobileSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)
}

function isMobileChrome(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Android|iPhone|iPad|iPod/i.test(ua) && /CriOS|Chrome/i.test(ua) && !/EdgiOS|FxiOS/i.test(ua)
}

interface PlayerScreenProps {
  youtubeVideoId: string
  videoTitle?: string
  videoDuration?: number
  videos?: Video[]
  currentVideoId?: string
  flushSession: () => Promise<void>
  onBack: () => void
  onVideoEnd?: () => void
  onPrevVideo?: () => void
  onNextVideo?: () => void
  onSelectVideo?: (videoId: string) => void
  onTimeUpdate?: (currentTime: number) => void
  onDurationUpdate?: (duration: number) => void
}

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

type FullscreenCapableDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
}

function ControlIcon({
  children,
  label,
  isFilled = false,
}: {
  children: ReactNode
  label: string
  isFilled?: boolean
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      data-icon-label={label}
    >
      {children}
    </svg>
  )
}

function PlayIcon() {
  return (
    <ControlIcon label="Play" isFilled>
      <polygon points="8,6 19,12 8,18" stroke="none" />
    </ControlIcon>
  )
}

function PauseIcon() {
  return (
    <ControlIcon label="Pause" isFilled>
      <rect x="7" y="6" width="3.5" height="12" rx="1" stroke="none" />
      <rect x="13.5" y="6" width="3.5" height="12" rx="1" stroke="none" />
    </ControlIcon>
  )
}

function PreviousIcon() {
  return (
    <ControlIcon label="Previous" isFilled>
      <rect x="5" y="6" width="2.5" height="12" rx="1" stroke="none" />
      <polygon points="17,6 8.5,12 17,18" stroke="none" />
    </ControlIcon>
  )
}

function NextIcon() {
  return (
    <ControlIcon label="Next" isFilled>
      <rect x="16.5" y="6" width="2.5" height="12" rx="1" stroke="none" />
      <polygon points="7,6 15.5,12 7,18" stroke="none" />
    </ControlIcon>
  )
}

function ExpandIcon({ isFullscreen }: { isFullscreen: boolean }) {
  return isFullscreen ? (
    <ControlIcon label="Collapse">
      <polyline points="10,14 10,10 14,10" />
      <line x1="10" y1="10" x2="16" y2="4" />
      <polyline points="14,10 14,14 10,14" />
      <polyline points="14,10 18,10 18,6" />
      <polyline points="14,14 10,14 10,18" />
      <line x1="14" y1="14" x2="8" y2="20" />
    </ControlIcon>
  ) : (
    <ControlIcon label="Expand">
      <polyline points="9,3 3,3 3,9" />
      <line x1="3" y1="3" x2="10" y2="10" />
      <polyline points="15,21 21,21 21,15" />
      <line x1="14" y1="14" x2="21" y2="21" />
      <polyline points="15,3 21,3 21,9" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <polyline points="9,21 3,21 3,15" />
      <line x1="10" y1="14" x2="3" y2="21" />
    </ControlIcon>
  )
}

export function PlayerScreen({
  youtubeVideoId,
  videoTitle = '',
  videoDuration = 0,
  videos = [],
  currentVideoId = '',
  flushSession,
  onBack,
  onVideoEnd,
  onPrevVideo,
  onNextVideo,
  onSelectVideo,
  onTimeUpdate,
  onDurationUpdate,
}: PlayerScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [playerKey, setPlayerKey] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const [ytDuration, setYtDuration] = useState(videoDuration)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInlineExpanded, setIsInlineExpanded] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoEndedRef = useRef(false)
  const isPlayingRef = useRef(true)
  const desiredPlayingRef = useRef(true)
  const autoplayDeadlineRef = useRef(Date.now() + 4000)
  const mobileSafariRef = useRef(isMobileSafari())
  const mobileChromeRef = useRef(isMobileChrome())

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  const sendPlayerCommand = useCallback((func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args,
      }),
      '*',
    )
  }, [])

  const requestPlayback = useCallback(() => {
    desiredPlayingRef.current = true
    autoplayDeadlineRef.current = Date.now() + 4000
    setAutoplayBlocked(false)
    setIsPlaying(true)
    setIsBuffering(false)
    sendPlayerCommand('playVideo')
  }, [sendPlayerCommand])

  // Subscribe to YouTube events and keep UI in sync with actual playback state
  useEffect(() => {
    if (isLoading) return

    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*')
    sendPlayerCommand('addEventListener', ['onStateChange'])
    sendPlayerCommand('addEventListener', ['onReady'])

    const handleYTMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'onReady') {
          requestPlayback()
          return
        }
        if (data?.event === 'onAutoplayBlocked') {
          setAutoplayBlocked(true)
          setIsPlaying(false)
          return
        }
        if (data?.event !== 'infoDelivery' || !data.info) return
        const info = data.info as Record<string, unknown>

        if (typeof info.currentTime === 'number') {
          setDisplaySeconds(info.currentTime)
          onTimeUpdate?.(info.currentTime)
        }
        if (typeof info.duration === 'number' && info.duration > 0) {
          setYtDuration(info.duration)
          onDurationUpdate?.(info.duration)
        }
        if (typeof info.playerState === 'number') {
          setIsBuffering(info.playerState === 3)
          if (info.playerState === 1) {
            setIsPlaying(true)
            desiredPlayingRef.current = true
            setAutoplayBlocked(false)
          } else if (info.playerState === 0 || info.playerState === 2 || info.playerState === 5 || info.playerState === -1) {
            setIsPlaying(false)
          }
          if (
            desiredPlayingRef.current &&
            info.playerState !== 1 &&
            info.playerState !== 3 &&
            Date.now() < autoplayDeadlineRef.current
          ) {
            window.setTimeout(() => sendPlayerCommand('playVideo'), 80)
          }
          if (info.playerState === 0 && !videoEndedRef.current) {
            videoEndedRef.current = true
            onVideoEnd?.()
          }
        }
      } catch {
        // ignore non-YouTube messages
      }
    }

    window.addEventListener('message', handleYTMessage)
    return () => window.removeEventListener('message', handleYTMessage)
  }, [isLoading, onDurationUpdate, onTimeUpdate, onVideoEnd, requestPlayback, sendPlayerCommand])

  // Retry autoplay after the iframe loads so navigation between videos works reliably on mobile browsers.
  useEffect(() => {
    if (isLoading) return

    let attempts = 0
    let timeoutId: number | undefined

    const tryPlay = () => {
      requestPlayback()
      attempts += 1
      if (!isPlayingRef.current && attempts < 4) {
        timeoutId = window.setTimeout(tryPlay, 350)
      }
    }

    tryPlay()
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [isLoading, playerKey, requestPlayback, youtubeVideoId])

  useEffect(() => {
    if (isLoading || isPlaying || isBuffering || !desiredPlayingRef.current) return

    const timeoutId = window.setTimeout(() => {
      if (!isPlayingRef.current && desiredPlayingRef.current && mobileSafariRef.current) {
        setAutoplayBlocked(true)
      }
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [isBuffering, isLoading, isPlaying])

  // Sync fullscreen state when user presses Esc
  useEffect(() => {
    const fullDoc = document as FullscreenCapableDocument
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement || fullDoc.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler as EventListener)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler as EventListener)
    }
  }, [])

  const handleLoad = useCallback(() => {
    setHasError(false)
    autoplayDeadlineRef.current = Date.now() + 4000
    desiredPlayingRef.current = true
    setAutoplayBlocked(false)
    setIsPlaying(true)
    setIsLoading(false)
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
    setIsPlaying(true)
    setIsBuffering(false)
    setAutoplayBlocked(false)
    desiredPlayingRef.current = true
    autoplayDeadlineRef.current = Date.now() + 4000
    setPlayerKey((k) => k + 1)
  }, [])

  const handlePlayPause = useCallback(() => {
    const shouldPlay = !isPlayingRef.current
    setIsPlaying(shouldPlay)
    setIsBuffering(false)
    desiredPlayingRef.current = shouldPlay
    autoplayDeadlineRef.current = shouldPlay ? Date.now() + 2000 : 0
    setAutoplayBlocked(false)
    sendPlayerCommand(shouldPlay ? 'playVideo' : 'pauseVideo')
  }, [sendPlayerCommand])

  const handleBack = useCallback(async () => {
    try { await flushSession() } catch { /* best-effort flush */ }
    onBack()
  }, [flushSession, onBack])

  const handleFullscreen = useCallback(async () => {
    const fullDoc = document as FullscreenCapableDocument
    const fullscreenTarget = mobileChromeRef.current
      ? (containerRef.current as FullscreenCapableElement | null) ?? (iframeRef.current as unknown as FullscreenCapableElement | null)
      : (iframeRef.current as unknown as FullscreenCapableElement | null) ?? (containerRef.current as FullscreenCapableElement | null)

    if (isInlineExpanded && !document.fullscreenElement && !fullDoc.webkitFullscreenElement) {
      setIsInlineExpanded(false)
      return
    }

    if (document.fullscreenElement || fullDoc.webkitFullscreenElement) {
      document.exitFullscreen?.()
      fullDoc.webkitExitFullscreen?.()
      return
    }

    try {
      if (fullscreenTarget?.requestFullscreen) {
        await fullscreenTarget.requestFullscreen()
        return
      }
      if (fullscreenTarget?.webkitRequestFullscreen) {
        await fullscreenTarget.webkitRequestFullscreen()
        return
      }
    } catch {
      // Fall back to in-app expanded mode below
    }

    setIsInlineExpanded(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [isInlineExpanded])

  const handleScrub = (e: ChangeEvent<HTMLInputElement>) => {
    const seconds = Number(e.target.value)
    setDisplaySeconds(seconds)
    sendPlayerCommand('seekTo', [seconds, true])
  }

  // Expose test hooks
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>)['__simulatePlayerError'] = () => {
      setHasError(true)
      setIsLoading(false)
    }
    ;(window as unknown as Record<string, unknown>)['__simulateVideoEnd'] = () => {
      onVideoEnd?.()
    }
    return () => {
      delete (window as unknown as Record<string, unknown>)['__simulatePlayerError']
      delete (window as unknown as Record<string, unknown>)['__simulateVideoEnd']
    }
  }, [onVideoEnd])

  const originParam =
    typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : ''
  const iframeSrc = `https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&controls=0&autoplay=1&enablejsapi=1&playsinline=1&fs=1${originParam}`

  // Up Next: videos after current, wrapping around
  const currentIdx = videos.findIndex((v) => v.videoId === currentVideoId)
  const upNext = [...videos.slice(currentIdx + 1), ...videos.slice(0, currentIdx)].slice(0, 4)

  // Reset when video changes — wrap in setTimeout to avoid setState-during-render lint error
  useEffect(() => {
    const t = setTimeout(() => {
      videoEndedRef.current = false
      setDisplaySeconds(0)
      setYtDuration(videoDuration)
      setIsPlaying(true)
      setIsBuffering(false)
      setIsInlineExpanded(false)
      setAutoplayBlocked(false)
      desiredPlayingRef.current = true
      autoplayDeadlineRef.current = Date.now() + 4000
    }, 0)
    return () => clearTimeout(t)
  }, [youtubeVideoId, videoDuration])

  const progressPct = ytDuration > 0 ? Math.min(100, (displaySeconds / ytDuration) * 100) : 0
  const isExpanded = isFullscreen || isInlineExpanded
  const useRotatedLandscape = isInlineExpanded && mobileSafariRef.current

  const btnStyle = (large = false, primary = false): CSSProperties => ({
    width: large ? '68px' : '52px',
    height: large ? '68px' : '52px',
    borderRadius: '50%',
    background: primary ? '#F43F5E' : 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    fontSize: large ? '24px' : '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: primary ? '0 4px 20px rgba(244,63,94,0.45)' : 'none',
    padding: 0,
  })

  return (
    <div
      ref={containerRef}
      data-testid="player-screen"
      className={`ckd-player-shell${isExpanded ? ' ckd-player-shell--expanded' : ''}${useRotatedLandscape ? ' ckd-player-shell--rotated' : ''}`}
    >
      <div className={`ckd-player-video${isExpanded ? ' ckd-player-video--expanded' : ''}${useRotatedLandscape ? ' ckd-player-video--rotated' : ''}`}>
        {isLoading && (
          <div
            data-testid="player-loading"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div className="player-spinner" />
          </div>
        )}

        {autoplayBlocked && (
          <button
            type="button"
            data-testid="tap-to-play-btn"
            aria-label="Tap to play"
            onClick={requestPlayback}
            style={{
              position: 'absolute',
              inset: 'auto 16px 16px',
              zIndex: 21,
              minHeight: 48,
              borderRadius: 999,
              border: 'none',
              background: 'rgba(0, 0, 0, 0.72)',
              color: '#fff',
              font: "700 14px 'Nunito', sans-serif",
              padding: '0 18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            Tap to play
          </button>
        )}

        {hasError ? (
          <div
            data-testid="player-error"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              zIndex: 20,
            }}
          >
            <p style={{ color: '#fff', fontFamily: 'Nunito', fontSize: '16px', margin: 0 }}>
              Oops! Check your internet connection.
            </p>
            <button
              data-testid="retry-btn"
              aria-label="Try again"
              onClick={handleRetry}
              style={{
                background: 'transparent',
                border: '2px solid #fff',
                borderRadius: '24px',
                color: '#fff',
                padding: '8px 24px',
                fontFamily: 'Nunito',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={playerKey}
            data-testid="youtube-player"
            src={iframeSrc}
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={handleLoad}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              opacity: isLoading ? 0 : 1,
            }}
          />
        )}

        {/* Back button */}
        <button
          data-testid="back-btn"
          aria-label="Back to Library"
          onClick={handleBack}
          style={{ position: 'absolute', top: 12, left: 12, zIndex: 5 }}
          className="ckd-back-button"
        >
          ←
        </button>
      </div>

      <div className={`ckd-player-controls${isExpanded ? ' ckd-player-controls--expanded' : ''}${useRotatedLandscape ? ' ckd-player-controls--rotated' : ''}`}>
        <p
          style={{
            margin: 0,
            color: '#fff',
            font: "700 16px 'Baloo 2', cursive",
            marginBottom: 12,
          }}
        >
          {videoTitle}
        </p>

        <div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{ height: 4, borderRadius: 2, background: '#374151' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, borderRadius: 2, background: '#F43F5E' }} />
            </div>
            <input
              data-testid="player-scrubber"
              type="range"
              min={0}
              max={ytDuration || 100}
              value={displaySeconds}
              onChange={handleScrub}
              aria-label="Seek video"
              style={{
                position: 'absolute',
                inset: '-8px 0',
                width: '100%',
                height: 20,
                margin: 0,
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', font: "12px 'Nunito', sans-serif" }}>
              {toMMSS(displaySeconds)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.55)', font: "12px 'Nunito', sans-serif" }}>
              {toMMSS(ytDuration)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button type="button" data-testid="row-back-btn" style={btnStyle()} aria-label="Back to Library" onClick={handleBack}>
            ←
          </button>
          <button type="button" style={btnStyle()} aria-label="Previous video" onClick={onPrevVideo}>
            <PreviousIcon />
          </button>
          <button
            type="button"
            data-testid="play-pause-btn"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={handlePlayPause}
            style={btnStyle(true, true)}
          >
            {isBuffering ? <span className="player-spinner" style={{ width: 20, height: 20 }} /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button type="button" style={btnStyle()} aria-label="Next video" onClick={onNextVideo}>
            <NextIcon />
          </button>
          <button
            type="button"
            data-testid="expand-btn"
            style={btnStyle()}
            aria-label={isExpanded ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={handleFullscreen}
          >
            <ExpandIcon isFullscreen={isExpanded} />
          </button>
        </div>
      </div>

      {upNext.length > 0 && !isExpanded && (
        <div className="ckd-player-body">
          <p
            style={{
              margin: '0 0 12px',
              color: '#1E1B4B',
              font: "700 16px 'Baloo 2', cursive",
            }}
          >
            Up Next
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upNext.map((v) => (
              <button
                key={v.videoId}
                type="button"
                className="ckd-mini-card"
                data-testid={`up-next-${v.videoId}`}
                onClick={() => onSelectVideo?.(v.videoId)}
                style={{ border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="ckd-mini-thumb" style={{ overflow: 'hidden' }}>
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span aria-hidden="true">▶</span>
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      color: '#1E1B4B',
                      font: "600 13px 'Baloo 2', cursive",
                    }}
                  >
                    {v.title}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      color: '#9333EA',
                      font: "600 12px 'Nunito', sans-serif",
                    }}
                  >
                    {v.category === 'Colours'
                      ? '🎨 Colours'
                      : v.category === 'Numbers'
                        ? '🔢 Numbers'
                        : v.category === 'Rhymes'
                          ? '🎵 Rhymes'
                          : v.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
