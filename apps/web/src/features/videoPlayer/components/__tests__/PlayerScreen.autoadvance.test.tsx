import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))
vi.mock('../../services/watchSessionService', () => ({
  writeWatchSession: vi.fn().mockResolvedValue('sess-id'),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('PlayerScreen — auto-advance', () => {
  const mockRef = { current: { getCurrentTime: vi.fn(() => 0) } }
  const videos = [
    { videoId: 'v1', youtubeVideoId: 'yt1' },
    { videoId: 'v2', youtubeVideoId: 'yt2' },
    { videoId: 'v3', youtubeVideoId: 'yt3' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates to /watch/v2 when v1 ends', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="yt1"
          playerRef={mockRef as never}
          flushSession={vi.fn().mockResolvedValue(undefined)}
          onBack={vi.fn()}
          onVideoEnd={() => {
            const currentIdx = videos.findIndex((v) => v.youtubeVideoId === 'yt1')
            const nextIdx = (currentIdx + 1) % videos.length
            mockNavigate(`/watch/${videos[nextIdx].videoId}`)
          }}
        />
      </MemoryRouter>,
    )

    act(() => {
      ;(window as unknown as Record<string, () => void>)['__simulateVideoEnd']?.()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/watch/v2')
  })

  it('wraps to /watch/v1 when last video (v3) ends', async () => {
    const { PlayerScreen } = await import('../PlayerScreen')
    render(
      <MemoryRouter>
        <PlayerScreen
          youtubeVideoId="yt3"
          playerRef={mockRef as never}
          flushSession={vi.fn().mockResolvedValue(undefined)}
          onBack={vi.fn()}
          onVideoEnd={() => {
            const currentIdx = videos.findIndex((v) => v.youtubeVideoId === 'yt3')
            const nextIdx = (currentIdx + 1) % videos.length
            mockNavigate(`/watch/${videos[nextIdx].videoId}`)
          }}
        />
      </MemoryRouter>,
    )

    act(() => {
      ;(window as unknown as Record<string, () => void>)['__simulateVideoEnd']?.()
    })

    expect(mockNavigate).toHaveBeenCalledWith('/watch/v1')
  })
})
