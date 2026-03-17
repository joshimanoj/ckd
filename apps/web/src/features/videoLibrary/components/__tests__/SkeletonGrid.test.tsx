import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkeletonGrid } from '../SkeletonGrid'

describe('SkeletonGrid', () => {
  it('renders data-testid="skeleton-grid"', () => {
    render(<SkeletonGrid />)
    expect(screen.getByTestId('skeleton-grid')).toBeInTheDocument()
  })

  it('renders 6 skeleton cards by default', () => {
    render(<SkeletonGrid />)
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6)
  })

  it('renders N skeleton cards when count prop is provided', () => {
    render(<SkeletonGrid count={3} />)
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3)
  })

  it('renders 1 card when count=1', () => {
    render(<SkeletonGrid count={1} />)
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(1)
  })
})
