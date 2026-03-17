import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoCard } from '../VideoCard'
import { makeVideo } from '../../../../test/factories/video'

describe('VideoCard', () => {
  const video = makeVideo({ videoId: 'v1', title: 'Test Rhyme', category: 'Rhymes', thumbnailUrl: 'https://img.youtube.com/vi/abc/0.jpg' })

  it('renders thumbnail with correct src and alt', () => {
    render(<VideoCard video={video} onClick={vi.fn()} />)
    const img = screen.getByTestId('card-thumbnail') as HTMLImageElement
    expect(img.src).toContain('https://img.youtube.com/vi/abc/0.jpg')
    expect(img.alt).toBe('Test Rhyme')
  })

  it('renders title text', () => {
    render(<VideoCard video={video} onClick={vi.fn()} />)
    expect(screen.getByTestId('card-title')).toHaveTextContent('Test Rhyme')
  })

  it('renders category chip with category text', () => {
    render(<VideoCard video={video} onClick={vi.fn()} />)
    expect(screen.getByTestId('card-category-chip')).toHaveTextContent('Rhymes')
  })

  it('calls onClick with videoId when clicked', () => {
    const onClick = vi.fn()
    render(<VideoCard video={video} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('video-card'))
    expect(onClick).toHaveBeenCalledWith('v1')
  })

  it('thumbnail has loading="lazy" attribute', () => {
    render(<VideoCard video={video} onClick={vi.fn()} />)
    const img = screen.getByTestId('card-thumbnail')
    expect(img.getAttribute('loading')).toBe('lazy')
  })

  it('on img error: shows grey placeholder instead of broken image', () => {
    render(<VideoCard video={video} onClick={vi.fn()} />)
    const img = screen.getByTestId('card-thumbnail')
    fireEvent.error(img)
    expect(screen.queryByTestId('card-thumbnail')).not.toBeInTheDocument()
    expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument()
  })
})
