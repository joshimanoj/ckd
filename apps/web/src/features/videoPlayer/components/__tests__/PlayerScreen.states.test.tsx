import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { makeVideo } from '../../../../test/factories/video'

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))
vi.mock('../../services/watchSessionService', () => ({
  writeWatchSession: vi.fn().mockResolvedValue('sess-id'),
}))

describe('PlayerScreen — states', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
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

  it('scrubber can be moved to seek through the video', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          videoDuration={200}
          flushSession={vi.fn().mockResolvedValue(undefined)}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    )

    const scrubber = screen.getByTestId('player-scrubber')
    act(() => {
      fireEvent.change(scrubber, { target: { value: '75' } })
    })
    expect(scrubber).toHaveValue('75')
  })

  it('starts in playing intent state and stays in sync with YouTube playback state', async () => {
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

    const playPause = screen.getByTestId('play-pause-btn')
    expect(playPause).toHaveAttribute('aria-label', 'Pause')

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ event: 'infoDelivery', info: { playerState: 1 } }),
        }),
      )
    })
    expect(playPause).toHaveAttribute('aria-label', 'Pause')

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ event: 'infoDelivery', info: { playerState: 2 } }),
        }),
      )
    })
    expect(playPause).toHaveAttribute('aria-label', 'Play')
  })

  it('clicking the control-row back button calls onBack', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    const onBack = vi.fn()

    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="dQw4w9WgXcQ"
          flushSession={vi.fn().mockResolvedValue(undefined)}
          onBack={onBack}
        />
      </MemoryRouter>,
    )

    await act(async () => {
      fireEvent.click(screen.getByTestId('row-back-btn'))
    })

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('falls back to inline expanded mode when fullscreen api is unavailable', async () => {
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
      fireEvent.click(screen.getByTestId('expand-btn'))
    })

    expect(screen.getByTestId('player-screen')).toHaveClass('ckd-player-shell--expanded')
  })

  it('clicking an up-next card calls onSelectVideo with the tapped video id', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    const onSelectVideo = vi.fn()

    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="yt-1"
          currentVideoId="video-1"
          videos={[
            makeVideo({ videoId: 'video-1', youtubeVideoId: 'yt-1', title: 'Video One', category: 'Colours' }),
            makeVideo({ videoId: 'video-2', youtubeVideoId: 'yt-2', title: 'Video Two', category: 'Rhymes' }),
          ]}
          flushSession={vi.fn()}
          onBack={vi.fn()}
          onSelectVideo={onSelectVideo}
        />
      </MemoryRouter>,
    )

    act(() => {
      fireEvent.click(screen.getByTestId('up-next-video-2'))
    })

    expect(onSelectVideo).toHaveBeenCalledWith('video-2')
  })
})
