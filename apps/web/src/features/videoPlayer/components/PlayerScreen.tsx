import { useState, useEffect, useCallback, useRef } from 'react'
import type { Video } from '@ckd/shared/types/video'

function toMMSS(seconds: number): string {
  const s = Math.floor(seconds)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}`
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
  onTimeUpdate?: (currentTime: number) => void
  onDurationUpdate?: (duration: number) => void
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
  onTimeUpdate,
  onDurationUpdate,
}: PlayerScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [playerKey, setPlayerKey] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)   // user intent only
  const [isBuffering, setIsBuffering] = useState(false) // YouTube buffering state
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const [ytDuration, setYtDuration] = useState(videoDuration)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoEndedRef = useRef(false)

  // Send play/pause command to YouTube iframe via postMessage
  useEffect(() => {
    if (isLoading) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func: isPlaying ? 'playVideo' : 'pauseVideo',
        args: [],
      }),
      '*',
    )
  }, [isPlaying, isLoading])

  // Subscribe to YouTube infoDelivery events — drives scrubber, buffering pause, and auto-advance
  useEffect(() => {
    if (isLoading) return
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return

    // Ask YouTube to start sending infoDelivery messages
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
      '*',
    )
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
      '*',
    )

    const handleYTMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
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
          // 3 = buffering (show spinner but don't touch isPlaying — that's user intent)
          setIsBuffering(info.playerState === 3)
          // 0 = ended
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
  }, [isLoading, onVideoEnd, onTimeUpdate, onDurationUpdate])

  // Sync fullscreen state when user presses Esc
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleLoad = useCallback(() => setIsLoading(false), [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
    setPlayerKey((k) => k + 1)
  }, [])

  const handlePlayPause = useCallback(() => setIsPlaying((p) => !p), [])

  const handleBack = useCallback(async () => {
    try { await flushSession() } catch { /* best-effort flush */ }
    onBack()
  }, [flushSession, onBack])

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seconds = Number(e.target.value)
    setDisplaySeconds(seconds)
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
      '*',
    )
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

  const iframeSrc = `https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&controls=0&autoplay=1&enablejsapi=1`

  // Up Next: videos after current, wrapping around
  const currentIdx = videos.findIndex((v) => v.videoId === currentVideoId)
  const upNext = [...videos.slice(currentIdx + 1), ...videos.slice(0, currentIdx)].slice(0, 4)

  // Reset when video changes — wrap in setTimeout to avoid setState-during-render lint error
  useEffect(() => {
    const t = setTimeout(() => {
      videoEndedRef.current = false
      setDisplaySeconds(0)
      setYtDuration(videoDuration)
    }, 0)
    return () => clearTimeout(t)
  }, [youtubeVideoId, videoDuration])

  const progressPct = ytDuration > 0 ? Math.min(100, (displaySeconds / ytDuration) * 100) : 0

  const btnStyle = (large = false, primary = false): React.CSSProperties => ({
    width: large ? '56px' : '44px',
    height: large ? '56px' : '44px',
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
  })

  return (
    <div ref={containerRef} data-testid="player-screen" className="ckd-player-shell">
      <div className="ckd-player-video">
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

      <div className="ckd-player-controls">
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <button style={btnStyle()} aria-label="Previous video" onClick={onPrevVideo}>⏮</button>
          <button
            data-testid="play-pause-btn"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={handlePlayPause}
            style={btnStyle(true, true)}
          >
            {isBuffering ? <span className="player-spinner" style={{ width: 20, height: 20 }} /> : isPlaying ? '⏸' : '▶'}
          </button>
          <button style={btnStyle()} aria-label="Next video" onClick={onNextVideo}>⏭</button>
          <button style={btnStyle()} aria-label="Fullscreen" onClick={handleFullscreen}>{isFullscreen ? '⤡' : '⤢'}</button>
        </div>
      </div>

      {upNext.length > 0 && (
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
              <div key={v.videoId} className="ckd-mini-card">
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
