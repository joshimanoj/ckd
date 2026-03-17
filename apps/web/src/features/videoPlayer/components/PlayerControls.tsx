interface PlayerControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onBack: () => void
}

export function PlayerControls({ isPlaying, onPlayPause, onBack }: PlayerControlsProps) {
  return (
    <>
      {/* Top bar — back button */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '8px',
        }}
      >
        <button
          data-testid="back-btn"
          aria-label="Back to Library"
          onClick={onBack}
          style={{
            minWidth: '44px',
            minHeight: '44px',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
      </div>

      {/* Bottom bar — play/pause button */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          data-testid="play-pause-btn"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={onPlayPause}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </>
  )
}
