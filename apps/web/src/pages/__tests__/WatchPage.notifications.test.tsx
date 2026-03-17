import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('../../features/notifications/hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    notificationsEnabled: false,
    optIn: vi.fn().mockResolvedValue(undefined),
    optOut: vi.fn(),
  })),
}))

vi.mock('../../features/videoPlayer/hooks/useWatchSession', () => ({
  useWatchSession: vi.fn(() => ({ flushSession: vi.fn().mockResolvedValue(undefined) })),
}))

vi.mock('../../shared/store/videoStore', () => ({
  useVideoStore: vi.fn((selector) =>
    selector({
      videos: [
        {
          videoId: 'vid-1',
          youtubeVideoId: 'abc123',
          title: 'Test Video',
          durationSeconds: 120,
          category: 'Rhymes',
          thumbnailUrl: '',
          isActive: true,
          order: 1,
          publishedAt: null,
        },
      ],
    }),
  ),
}))

vi.mock('../../shared/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({ user: { uid: 'test-uid' } })),
}))

vi.mock('../../shared/store/childProfileStore', () => ({
  useChildProfileStore: vi.fn(() => ({
    activeProfile: { id: 'child-1', name: 'Test Child' },
  })),
}))

vi.mock('../../shared/store/watchSessionStore', () => ({
  useWatchSessionStore: {
    getState: vi.fn(() => ({
      updateCurrentYTTime: vi.fn(),
      updateYTDuration: vi.fn(),
    })),
  },
}))

vi.mock('../../features/videoPlayer/components/PlayerScreen', () => ({
  PlayerScreen: ({ onVideoEnd }: { onVideoEnd?: () => void }) => (
    <div data-testid="player-screen">
      <button data-testid="sim-video-end" onClick={onVideoEnd}>
        Simulate end
      </button>
    </div>
  ),
}))

import { WatchPage } from '../WatchPage'
import { useNotifications } from '../../features/notifications/hooks/useNotifications'

// Simple localStorage mock — jsdom in Vitest v4 may not expose Storage methods
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true })

// ── Tests ──────────────────────────────────────────────────────────────────
function renderWatchPage() {
  return render(
    <MemoryRouter initialEntries={['/watch/vid-1']}>
      <Routes>
        <Route path="/watch/:videoId" element={<WatchPage />} />
        <Route path="/library" element={<div data-testid="library-page" />} />
        <Route path="/watch/:videoId" element={<div />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('WatchPage — notification opt-in sheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    vi.mocked(useNotifications).mockReturnValue({
      notificationsEnabled: false,
      optIn: vi.fn().mockResolvedValue(undefined),
      optOut: vi.fn(),
    })
  })

  it('should show opt-in sheet after first video end when not prompted before', async () => {
    renderWatchPage()
    expect(screen.queryByTestId('notif-optin-sheet')).not.toBeInTheDocument()

    await act(async () => {
      screen.getByTestId('sim-video-end').click()
    })

    expect(screen.getByTestId('notif-optin-sheet')).toBeInTheDocument()
  })

  it('should NOT show opt-in sheet when ckd_notif_prompted is already set', async () => {
    localStorageMock.setItem('ckd_notif_prompted', '1')
    renderWatchPage()

    await act(async () => {
      screen.getByTestId('sim-video-end').click()
    })

    expect(screen.queryByTestId('notif-optin-sheet')).not.toBeInTheDocument()
  })

  it('should NOT show opt-in sheet when notificationsEnabled is already true', async () => {
    vi.mocked(useNotifications).mockReturnValue({
      notificationsEnabled: true,
      optIn: vi.fn(),
      optOut: vi.fn(),
    })
    renderWatchPage()

    await act(async () => {
      screen.getByTestId('sim-video-end').click()
    })

    expect(screen.queryByTestId('notif-optin-sheet')).not.toBeInTheDocument()
  })
})
