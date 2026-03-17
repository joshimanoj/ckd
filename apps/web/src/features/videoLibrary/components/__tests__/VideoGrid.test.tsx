import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoGrid } from '../VideoGrid'
import { makeVideo } from '../../../../test/factories/video'
import type { Category } from '@ckd/shared/types/video'

const defaultProps = {
  videos: [],
  allVideos: [],
  loading: false,
  error: null,
  onVideoTap: vi.fn(),
  selectedCategory: null as Category | null,
  onCategorySelect: vi.fn(),
  onRefresh: vi.fn(),
}

describe('VideoGrid', () => {
  it('renders SkeletonGrid when loading=true', () => {
    render(<VideoGrid {...defaultProps} loading={true} />)
    expect(screen.getByTestId('skeleton-grid')).toBeInTheDocument()
    expect(screen.queryByTestId('video-grid')).not.toBeInTheDocument()
  })

  it('renders error state when error is set', () => {
    render(<VideoGrid {...defaultProps} error="Network error" />)
    expect(screen.getByTestId('error-state')).toBeInTheDocument()
    expect(screen.queryByTestId('video-grid')).not.toBeInTheDocument()
  })

  it('retry-btn click calls onRefresh', () => {
    const onRefresh = vi.fn()
    render(<VideoGrid {...defaultProps} error="Network error" onRefresh={onRefresh} />)
    fireEvent.click(screen.getByTestId('retry-btn'))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('renders empty-state when videos=[] and not loading', () => {
    render(<VideoGrid {...defaultProps} videos={[]} loading={false} error={null} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.queryByTestId('video-grid')).not.toBeInTheDocument()
  })

  it('renders video-grid with correct card count when videos present', () => {
    const videos = [makeVideo({ videoId: 'v1' }), makeVideo({ videoId: 'v2' })]
    render(<VideoGrid {...defaultProps} videos={videos} allVideos={videos} />)
    expect(screen.getByTestId('video-grid')).toBeInTheDocument()
    expect(screen.getAllByTestId('video-card')).toHaveLength(2)
  })

  it('renders CategoryFilter with visible=false when allVideos.length < 20', () => {
    const videos = [makeVideo({ videoId: 'v1' })]
    render(<VideoGrid {...defaultProps} videos={videos} allVideos={videos} />)
    expect(screen.getByTestId('category-filter')).toHaveStyle({ display: 'none' })
  })

  it('renders CategoryFilter with visible=true when allVideos.length >= 20', () => {
    const videos = Array.from({ length: 20 }, (_, i) => makeVideo({ videoId: `v${i}` }))
    render(<VideoGrid {...defaultProps} videos={videos} allVideos={videos} />)
    expect(screen.getByTestId('category-filter')).not.toHaveStyle({ display: 'none' })
  })

  it('clicking VideoCard calls onVideoTap with videoId', () => {
    const onVideoTap = vi.fn()
    const videos = [makeVideo({ videoId: 'v1' })]
    render(<VideoGrid {...defaultProps} videos={videos} allVideos={videos} onVideoTap={onVideoTap} />)
    fireEvent.click(screen.getByTestId('video-card'))
    expect(onVideoTap).toHaveBeenCalledWith('v1')
  })

  it('refresh-btn always rendered when not loading and not error', () => {
    const videos = [makeVideo({ videoId: 'v1' })]
    render(<VideoGrid {...defaultProps} videos={videos} allVideos={videos} />)
    expect(screen.getByTestId('refresh-btn')).toBeInTheDocument()
  })

  it('refresh-btn calls onRefresh when clicked', () => {
    const onRefresh = vi.fn()
    const videos = [makeVideo({ videoId: 'v1' })]
    render(<VideoGrid {...defaultProps} videos={videos} allVideos={videos} onRefresh={onRefresh} />)
    fireEvent.click(screen.getByTestId('refresh-btn'))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
