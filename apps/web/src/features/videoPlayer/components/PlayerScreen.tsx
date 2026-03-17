import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import type { YouTubePlayerRef } from '../hooks/useWatchSession'
import type { Video } from '@ckd/shared/types/video'

function toMMSS(seconds: number): string {
  const s = Math.floor(seconds)
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${rem.toString().padStart(2, '0')}`
}

interface PlayerScreenProps {
  youtubeVideoId: string
  videoTitle: string
  videoDuration: number
  videos: Video[]
  currentVideoId: string
  playerRef: RefObject<YouTubePlayerRef | null>
  flushSession: () => Promise<void>
  onBack: () => void
  onVideoEnd?: () => void
  onPrevVideo?: () => void
  onNextVideo?: () => void
}

export function PlayerScreen({
  youtubeVideoId,
  videoTitle,
  videoDuration,
  videos,
  currentVideoId,
  flushSession,
  onBack,
  onVideoEnd,
  onPrevVideo,
  onNextVideo,
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

        if (typeof info.currentTime === 'number') setDisplaySeconds(info.currentTime)
        if (typeof info.duration === 'number' && info.duration > 0) setYtDuration(info.duration)
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
  }, [isLoading, onVideoEnd])

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
    await flushSession()
    onBack()
  }, [flushSession, onBack])

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const seconds = Number(e.target.value)
    setDisplaySeconds(seconds)
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
      '*',
    )
  }, [])

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
    width: large ? '64px' : '48px',
    height: large ? '64px' : '48px',
    borderRadius: '50%',
    background: primary ? '#F43F5E' : 'rgba(255,255,255,0.12)',
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
    <div
      ref={containerRef}
      data-testid="player-screen"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0d0d1f',
        zIndex: 50,
        overflow: 'hidden',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Video / artwork section ── */}
      <div
        style={{
          position: 'relative',
          flex: '0 0 46%',
          background: 'linear-gradient(135deg, #F43F5E 0%, #9333EA 100%)',
          overflow: 'hidden',
        }}
      >
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
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            minWidth: '44px',
            minHeight: '44px',
            background: 'rgba(0,0,0,0.35)',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
          }}
        >
          ←
        </button>
      </div>

      {/* ── Controls panel (dark navy) ── */}
      <div
        style={{
          background: '#12122a',
          padding: '16px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Title */}
        <p
          style={{
            margin: 0,
            color: '#fff',
            fontFamily: 'Nunito',
            fontWeight: 700,
            fontSize: '17px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {videoTitle}
        </p>

        {/* Scrubber */}
        <div>
          <input
            type="range"
            min={0}
            max={ytDuration || 100}
            value={displaySeconds}
            onChange={handleScrub}
            style={{
              width: '100%',
              height: '4px',
              appearance: 'none',
              WebkitAppearance: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              background: `linear-gradient(to right, #F43F5E ${progressPct}%, rgba(255,255,255,0.25) ${progressPct}%)`,
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito', fontSize: '12px' }}>
              {toMMSS(displaySeconds)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito', fontSize: '12px' }}>
              {toMMSS(ytDuration)}
            </span>
          </div>
        </div>

        {/* Control buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <button style={btnStyle()} aria-label="Back to Library" onClick={handleBack}>←</button>
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
          <button style={btnStyle()} aria-label="Fullscreen" onClick={handleFullscreen}>
            {isFullscreen ? '⤡' : '⤢'}
          </button>
        </div>
      </div>

      {/* ── Up Next (white) ── */}
      {upNext.length > 0 && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: '#fff',
            padding: '16px 16px 24px',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              color: '#111',
              fontFamily: 'Nunito',
              fontWeight: 800,
              fontSize: '15px',
            }}
          >
            Up Next
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upNext.map((v) => (
              <div
                key={v.videoId}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  background: '#f7f7fb',
                  borderRadius: '12px',
                  padding: '10px',
                }}
              >
                <img
                  src={`https://img.youtube.com/vi/${v.youtubeVideoId}/mqdefault.jpg`}
                  alt={v.title}
                  style={{
                    width: '72px',
                    height: '48px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      color: '#111',
                      fontFamily: 'Nunito',
                      fontWeight: 700,
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {v.title}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      color: '#9333EA',
                      fontFamily: 'Nunito',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {v.category}
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
