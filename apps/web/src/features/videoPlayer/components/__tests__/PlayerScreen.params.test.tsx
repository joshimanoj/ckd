import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))
vi.mock('../../services/watchSessionService', () => ({
  writeWatchSession: vi.fn().mockResolvedValue('sess-id'),
}))

describe('PlayerScreen — embed params', () => {
  it('renders player-screen container', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    const mockRef = { current: { getCurrentTime: vi.fn(() => 0) } }
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          playerRef={mockRef as never}
          flushSession={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('player-screen')).toBeInTheDocument()
  })

  it('iframe src contains required YouTube params', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    const mockRef = { current: { getCurrentTime: vi.fn(() => 0) } }
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          playerRef={mockRef as never}
          flushSession={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    )
    const iframe = screen.getByTestId('youtube-player') as HTMLIFrameElement
    expect(iframe.src).toContain('rel=0')
    expect(iframe.src).toContain('modestbranding=1')
    expect(iframe.src).toContain('controls=0')
    expect(iframe.src).toContain('autoplay=1')
    expect(iframe.src).toContain('dQw4w9WgXcQ')
  })

  it('no bottom nav rendered inside PlayerScreen', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    const mockRef = { current: { getCurrentTime: vi.fn(() => 0) } }
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          playerRef={mockRef as never}
          flushSession={vi.fn()}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
  })
})
