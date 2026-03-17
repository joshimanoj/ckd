import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayerControls } from '../PlayerControls'

describe('PlayerControls', () => {
  it('play/pause button has aria-label="Play" when not playing', () => {
    render(<PlayerControls isPlaying={false} onPlayPause={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByTestId('play-pause-btn')).toHaveAttribute('aria-label', 'Play')
  })

  it('play/pause button has aria-label="Pause" when playing', () => {
    render(<PlayerControls isPlaying={true} onPlayPause={vi.fn()} onBack={vi.fn()} />)
    expect(screen.getByTestId('play-pause-btn')).toHaveAttribute('aria-label', 'Pause')
  })

  it('clicking play/pause calls onPlayPause', () => {
    const onPlayPause = vi.fn()
    render(<PlayerControls isPlaying={false} onPlayPause={onPlayPause} onBack={vi.fn()} />)
    fireEvent.click(screen.getByTestId('play-pause-btn'))
    expect(onPlayPause).toHaveBeenCalledTimes(1)
  })

  it('back button is visible with aria-label="Back to Library"', () => {
    render(<PlayerControls isPlaying={false} onPlayPause={vi.fn()} onBack={vi.fn()} />)
    const backBtn = screen.getByTestId('back-btn')
    expect(backBtn).toBeInTheDocument()
    expect(backBtn).toHaveAttribute('aria-label', 'Back to Library')
  })

  it('clicking back calls onBack', () => {
    const onBack = vi.fn()
    render(<PlayerControls isPlaying={false} onPlayPause={vi.fn()} onBack={onBack} />)
    fireEvent.click(screen.getByTestId('back-btn'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('play/pause button has 56px width and height', () => {
    render(<PlayerControls isPlaying={false} onPlayPause={vi.fn()} onBack={vi.fn()} />)
    const btn = screen.getByTestId('play-pause-btn')
    expect(btn).toHaveStyle({ width: '56px', height: '56px' })
  })

  it('back button has minWidth 44px and minHeight 44px', () => {
    render(<PlayerControls isPlaying={false} onPlayPause={vi.fn()} onBack={vi.fn()} />)
    const btn = screen.getByTestId('back-btn')
    expect(btn).toHaveStyle({ minWidth: '44px', minHeight: '44px' })
  })
})
