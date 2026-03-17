import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryFilter } from '../CategoryFilter'
import type { Category } from '@ckd/shared/types/video'

const CATEGORIES: Category[] = ['Rhymes', 'Colours', 'Numbers']

describe('CategoryFilter', () => {
  it('does not render (display:none) when visible=false', () => {
    render(<CategoryFilter categories={CATEGORIES} selected={null} onSelect={vi.fn()} visible={false} />)
    const root = screen.getByTestId('category-filter')
    expect(root).toHaveStyle({ display: 'none' })
  })

  it('renders when visible=true', () => {
    render(<CategoryFilter categories={CATEGORIES} selected={null} onSelect={vi.fn()} visible={true} />)
    const root = screen.getByTestId('category-filter')
    expect(root).toBeInTheDocument()
    expect(root).not.toHaveStyle({ display: 'none' })
  })

  it("renders 'All' chip + one chip per category", () => {
    render(<CategoryFilter categories={CATEGORIES} selected={null} onSelect={vi.fn()} visible={true} />)
    expect(screen.getByTestId('category-chip-All')).toBeInTheDocument()
    expect(screen.getByTestId('category-chip-Rhymes')).toBeInTheDocument()
    expect(screen.getByTestId('category-chip-Colours')).toBeInTheDocument()
    expect(screen.getByTestId('category-chip-Numbers')).toBeInTheDocument()
  })

  it("'All' chip selected when selected=null", () => {
    render(<CategoryFilter categories={CATEGORIES} selected={null} onSelect={vi.fn()} visible={true} />)
    const allChip = screen.getByTestId('category-chip-All')
    expect(allChip).toHaveStyle({ background: '#9333EA' })
  })

  it('selected chip has purple background', () => {
    render(<CategoryFilter categories={CATEGORIES} selected="Rhymes" onSelect={vi.fn()} visible={true} />)
    expect(screen.getByTestId('category-chip-Rhymes')).toHaveStyle({ background: '#9333EA' })
    expect(screen.getByTestId('category-chip-All')).toHaveStyle({ background: '#F3E8FF' })
  })

  it('clicking a category chip calls onSelect with that category', () => {
    const onSelect = vi.fn()
    render(<CategoryFilter categories={CATEGORIES} selected={null} onSelect={onSelect} visible={true} />)
    fireEvent.click(screen.getByTestId('category-chip-Colours'))
    expect(onSelect).toHaveBeenCalledWith('Colours')
  })

  it("clicking 'All' chip calls onSelect with null", () => {
    const onSelect = vi.fn()
    render(<CategoryFilter categories={CATEGORIES} selected="Rhymes" onSelect={onSelect} visible={true} />)
    fireEvent.click(screen.getByTestId('category-chip-All'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('renders only All chip when categories=[]', () => {
    render(<CategoryFilter categories={[]} selected={null} onSelect={vi.fn()} visible={true} />)
    expect(screen.getByTestId('category-chip-All')).toBeInTheDocument()
    expect(screen.queryAllByTestId(/^category-chip-(?!All)/)).toHaveLength(0)
  })
})
