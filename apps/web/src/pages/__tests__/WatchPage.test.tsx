import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useVideoStore } from '../../shared/store/videoStore'
import { useAuthStore } from '../../shared/store/authStore'
import { useChildProfileStore } from '../../shared/store/childProfileStore'
import { makeVideo } from '../../test/factories/video'
import { Timestamp } from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))
vi.mock('../../features/videoPlayer/services/watchSessionService', () => ({
  writeWatchSession: vi.fn().mockResolvedValue('sess-id'),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderWatchPage(videoId: string) {
  return render(
    <MemoryRouter initialEntries={[`/watch/${videoId}`]}>
      <Routes>
        <Route path="/watch/:videoId" element={<WatchPageImport />} />
        <Route path="/library" element={<div data-testid="library-page" />} />
        <Route path="/" element={<div data-testid="home-page" />} />
      </Routes>
    </MemoryRouter>,
  )
}

let WatchPageImport: React.ComponentType

describe('WatchPage', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../WatchPage')
    WatchPageImport = mod.WatchPage
    useVideoStore.setState({
      videos: [makeVideo({ videoId: 'test-video-1', youtubeVideoId: 'dQw4w9WgXcQ' })],
      loading: false,
      error: null,
      hydrated: true,
    })
    useAuthStore.setState({
      user: { uid: 'user-1', email: 'test@example.com' } as FirebaseUser,
      loading: false,
      routeTo: 'library',
    })
    useChildProfileStore.setState({
      activeProfile: {
        id: 'child-1',
        name: 'Arjun',
        dateOfBirth: Timestamp.now(),
        createdAt: Timestamp.now(),
      },
    })
  })

  it('renders player-screen with matching video', async () => {
    renderWatchPage('test-video-1')
    expect(screen.getByTestId('player-screen')).toBeInTheDocument()
  })

  it('navigates to /library when video not found in store', async () => {
    renderWatchPage('unknown-video-id')
    expect(mockNavigate).toHaveBeenCalledWith('/library', { replace: true })
  })

  it('navigates to / when user is not authenticated', async () => {
    useAuthStore.setState({ user: null, loading: false, routeTo: 'sign-in' })
    renderWatchPage('test-video-1')
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})
