import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { LibraryPage } from '../LibraryPage'
import { makeVideo } from '../../test/factories/video'

const mockShowGate = vi.fn()
const mockHideGate = vi.fn()
const mockCheckAnswer = vi.fn()

const defaultHookReturn = {
  isVisible: false,
  currentQuestion: { question: '3 + 5 = ?', answer: 8 },
  showGate: mockShowGate,
  hideGate: mockHideGate,
  checkAnswer: mockCheckAnswer,
}

vi.mock('../../shared/hooks/useParentalGate', () => ({
  useParentalGate: vi.fn(() => defaultHookReturn),
}))

const mockVideoLibraryReturn = {
  videos: [],
  allVideos: [],
  loading: false,
  error: null,
  selectedCategory: null,
  selectCategory: vi.fn(),
  refresh: vi.fn(),
}

vi.mock('../../features/videoLibrary/hooks/useVideoLibrary', () => ({
  useVideoLibrary: vi.fn(() => mockVideoLibraryReturn),
}))

vi.mock('@ckd/shared/firebase/config', () => ({
  db: {},
  auth: {},
}))

import { useParentalGate } from '../../shared/hooks/useParentalGate'
import { useVideoLibrary } from '../../features/videoLibrary/hooks/useVideoLibrary'
const mockUseParentalGate = vi.mocked(useParentalGate)
const mockUseVideoLibrary = vi.mocked(useVideoLibrary)

function renderInRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/library" element={ui} />
        <Route path="/watch/:videoId" element={<div data-testid="watch-page" />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParentalGate.mockReturnValue(defaultHookReturn)
    mockUseVideoLibrary.mockReturnValue(mockVideoLibraryReturn)
  })

  it('renders library-screen, top-nav, parent-icon-btn', () => {
    renderInRouter(<LibraryPage />)
    expect(screen.getByTestId('library-screen')).toBeInTheDocument()
    expect(screen.getByTestId('top-nav')).toBeInTheDocument()
    expect(screen.getByTestId('parent-icon-btn')).toBeInTheDocument()
  })

  it('parent-panel is NOT visible initially', () => {
    renderInRouter(<LibraryPage />)
    expect(screen.queryByTestId('parent-panel')).not.toBeInTheDocument()
  })

  it('clicking parent-icon-btn calls showGate', () => {
    renderInRouter(<LibraryPage />)
    fireEvent.click(screen.getByTestId('parent-icon-btn'))
    expect(mockShowGate).toHaveBeenCalledTimes(1)
  })

  it('gate modal appears when isVisible=true', () => {
    mockUseParentalGate.mockReturnValue({ ...defaultHookReturn, isVisible: true })
    renderInRouter(<LibraryPage />)
    expect(screen.getByTestId('parental-gate-modal')).toBeInTheDocument()
  })

  it('correct answer: parent-panel visible, gate dismissed', () => {
    mockCheckAnswer.mockReturnValue(true)
    mockUseParentalGate.mockReturnValue({ ...defaultHookReturn, isVisible: true })
    renderInRouter(<LibraryPage />)
    fireEvent.change(screen.getByTestId('gate-answer-input'), { target: { value: '8' } })
    fireEvent.click(screen.getByTestId('gate-confirm-btn'))
    expect(mockCheckAnswer).toHaveBeenCalledWith('8')
    expect(mockHideGate).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('parent-panel')).toBeInTheDocument()
  })

  it('dismissing gate: parent-panel stays hidden', () => {
    mockUseParentalGate.mockReturnValue({ ...defaultHookReturn, isVisible: true })
    renderInRouter(<LibraryPage />)
    fireEvent.click(screen.getByTestId('gate-dismiss-btn'))
    expect(mockHideGate).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('parent-panel')).not.toBeInTheDocument()
  })

  it('renders creator-avatar and app-title in header', () => {
    renderInRouter(<LibraryPage />)
    expect(screen.getByTestId('creator-avatar')).toBeInTheDocument()
    expect(screen.getByTestId('app-title')).toHaveTextContent('Choti Ki Duniya')
  })

  it('header has gradient background', () => {
    renderInRouter(<LibraryPage />)
    const header = screen.getByTestId('top-nav')
    expect(header.getAttribute('style')).toContain('linear-gradient')
  })

  it('renders VideoGrid when useVideoLibrary returns videos', () => {
    const videos = [makeVideo({ videoId: 'v1' })]
    mockUseVideoLibrary.mockReturnValue({ ...mockVideoLibraryReturn, videos, allVideos: videos })
    renderInRouter(<LibraryPage />)
    expect(screen.getByTestId('video-grid')).toBeInTheDocument()
  })

  it('navigates to /watch/:videoId when VideoGrid calls onVideoTap', () => {
    const videos = [makeVideo({ videoId: 'vid-abc' })]
    mockUseVideoLibrary.mockReturnValue({ ...mockVideoLibraryReturn, videos, allVideos: videos })
    renderInRouter(<LibraryPage />)
    fireEvent.click(screen.getByTestId('video-card'))
    expect(screen.getByTestId('watch-page')).toBeInTheDocument()
  })

  it('passes loading=true to VideoGrid when hook is loading', () => {
    mockUseVideoLibrary.mockReturnValue({ ...mockVideoLibraryReturn, loading: true })
    renderInRouter(<LibraryPage />)
    expect(screen.getByTestId('skeleton-grid')).toBeInTheDocument()
  })

  it('passes error to VideoGrid when hook returns error', () => {
    mockUseVideoLibrary.mockReturnValue({ ...mockVideoLibraryReturn, error: 'Network error' })
    renderInRouter(<LibraryPage />)
    expect(screen.getByTestId('error-state')).toBeInTheDocument()
  })
})

describe('LibraryPage routing smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useParentalGate).mockReturnValue(defaultHookReturn)
    vi.mocked(useVideoLibrary).mockReturnValue(mockVideoLibraryReturn)
  })

  it('renders library-screen at /library route (no placeholder text)', () => {
    render(
      <MemoryRouter initialEntries={['/library']}>
        <Routes>
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByTestId('library-screen')).toBeInTheDocument()
    expect(screen.queryByText('Library (Story 5)')).not.toBeInTheDocument()
  })
})
