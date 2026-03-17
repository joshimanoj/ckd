import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))
vi.mock('../../services/watchSessionService', () => ({
  writeWatchSession: vi.fn().mockResolvedValue('sess-id'),
}))

describe('PlayerScreen — states', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading overlay on initial render', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          flushSession={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('player-loading')).toBeInTheDocument()
  })

  it('hides loading overlay after iframe onLoad fires', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          flushSession={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    )
    const iframe = screen.getByTestId('youtube-player')
    act(() => {
      fireEvent.load(iframe)
    })
    expect(screen.queryByTestId('player-loading')).not.toBeInTheDocument()
  })

  it('shows error overlay when __simulatePlayerError is called', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          flushSession={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    )
    act(() => {
      ;(window as unknown as Record<string, () => void>)['__simulatePlayerError']?.()
    })
    expect(screen.getByTestId('player-error')).toBeInTheDocument()
    expect(screen.getByText(/Check your internet connection/i)).toBeInTheDocument()
    expect(screen.getByTestId('retry-btn')).toBeInTheDocument()
  })

  it('clicking retry hides error overlay', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          flushSession={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    )
    act(() => {
      ;(window as unknown as Record<string, () => void>)['__simulatePlayerError']?.()
    })
    expect(screen.getByTestId('player-error')).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByTestId('retry-btn'))
    })
    expect(screen.queryByTestId('player-error')).not.toBeInTheDocument()
  })
})
