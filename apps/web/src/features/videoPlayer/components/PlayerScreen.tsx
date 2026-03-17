import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import type { YouTubePlayerRef } from '../hooks/useWatchSession'
import type { Video } from '@ckd/shared/types/video'
import { formatSeconds } from '@ckd/shared/utils/watchTime'

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
}: PlayerScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [playerKey, setPlayerKey] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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

  // Local 1-second timer for progress display
  useEffect(() => {
    if (!isPlaying || isLoading) return
    const id = setInterval(() => setDisplaySeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isPlaying, isLoading])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
    setPlayerKey((k) => k + 1)
  }, [])

  const handlePlayPause = useCallback(() => {
    setIsPlaying((p) => !p)
  }, [])

  const handleBack = useCallback(async () => {
    await flushSession()
    onBack()
  }, [flushSession, onBack])

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

  // Up Next: videos after the current one, wrapping around
  const currentIdx = videos.findIndex((v) => v.videoId === currentVideoId)
  const upNext = [
    ...videos.slice(currentIdx + 1),
    ...videos.slice(0, currentIdx),
  ].slice(0, 4)

  const progressPct = videoDuration > 0 ? Math.min(100, (displaySeconds / videoDuration) * 100) : 0

  return (
    <div
      data-testid="player-screen"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0f0f1a',
        zIndex: 50,
        overflow: 'hidden',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Video section ── */}
      <div style={{ position: 'relative', flex: '0 0 48%', background: '#000', overflow: 'hidden' }}>
        {isLoading && (
          <div
            data-testid="player-loading"
            style={{
              position: 'absolute',
              inset: 0,
              background: '#000',
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
              background: '#000',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
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
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(147,51,234,0.35) 0%, transparent 50%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Back button */}
        <button
          data-testid="back-btn"
          aria-label="Back to Library"
          onClick={handleBack}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            minWidth: '44px',
            minHeight: '44px',
            background: 'rgba(0,0,0,0.4)',
            border: 'none',
            borderRadius: '50%',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>

        {/* Title overlay at bottom of video section */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            background: 'linear-gradient(to top, rgba(15,15,26,0.95) 0%, transparent 100%)',
          }}
        >
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
        </div>
      </div>

      {/* ── Controls panel ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px 0',
          gap: '12px',
        }}
      >
        {/* Progress bar */}
        <div>
          <div
            style={{
              height: '4px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: '#F43F5E',
                borderRadius: '2px',
                transition: 'width 1s linear',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito', fontSize: '12px' }}>
              {formatSeconds(displaySeconds)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Nunito', fontSize: '12px' }}>
              {formatSeconds(videoDuration)}
            </span>
          </div>
        </div>

        {/* Play/Pause control */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button
            data-testid="play-pause-btn"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={handlePlayPause}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#F43F5E',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(244,63,94,0.4)',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* Up Next */}
        {upNext.length > 0 && (
          <div>
            <p
              style={{
                margin: '0 0 10px',
                color: '#fff',
                fontFamily: 'Nunito',
                fontWeight: 700,
                fontSize: '15px',
              }}
            >
              Up Next
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upNext.map((v) => (
                <div
                  key={v.videoId}
                  style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${v.youtubeVideoId}/mqdefault.jpg`}
                    alt={v.title}
                    style={{
                      width: '72px',
                      height: '48px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        color: '#fff',
                        fontFamily: 'Nunito',
                        fontWeight: 600,
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
                        color: 'rgba(255,255,255,0.5)',
                        fontFamily: 'Nunito',
                        fontSize: '12px',
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
    </div>
  )
}
