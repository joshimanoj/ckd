import { useState, useEffect, useCallback, type RefObject } from 'react'
import { PlayerControls } from './PlayerControls'
import type { YouTubePlayerRef } from '../hooks/useWatchSession'

interface PlayerScreenProps {
  youtubeVideoId: string
  playerRef: RefObject<YouTubePlayerRef | null>
  flushSession: () => Promise<void>
  onBack: () => void
  onVideoEnd?: () => void
}

export function PlayerScreen({
  youtubeVideoId,
  flushSession,
  onBack,
  onVideoEnd,
}: PlayerScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [playerKey, setPlayerKey] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

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

  return (
    <div
      data-testid="player-screen"
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 50,
        overflow: 'hidden',
        maxWidth: '100vw',
      }}
    >
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

      {hasError && (
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
            zIndex: 20,
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
      )}

      {!hasError && (
        <>
          <iframe
            key={playerKey}
            data-testid="youtube-player"
            src={iframeSrc}
            allow="autoplay; fullscreen"
            onLoad={handleLoad}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
          <PlayerControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onBack={handleBack}
          />
        </>
      )}
    </div>
  )
}
