import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WatchTimeChart } from '../WatchTimeChart'

describe('WatchTimeChart — FT-6', () => {
  it('renders exactly 7 bars', () => {
    render(
      <WatchTimeChart
        weekDayTotals={[0, 0, 0, 0, 0, 0, 0]}
        todayDayIndex={0}
      />,
    )
    const bars = screen.getAllByTestId('chart-bar')
    expect(bars).toHaveLength(7)
  })

  it('marks today bar with data-today=true', () => {
    render(
      <WatchTimeChart
        weekDayTotals={[0, 3600, 0, 0, 0, 0, 0]}
        todayDayIndex={1}
      />,
    )
    const bars = screen.getAllByTestId('chart-bar')
    expect(bars[1].getAttribute('data-today')).toBe('true')
    expect(bars[0].getAttribute('data-today')).not.toBe('true')
    expect(bars[2].getAttribute('data-today')).not.toBe('true')
  })

  it('gives all-zero bars a minimum height of 4px', () => {
    render(
      <WatchTimeChart
        weekDayTotals={[0, 0, 0, 0, 0, 0, 0]}
        todayDayIndex={0}
      />,
    )
    const bars = screen.getAllByTestId('chart-bar')
    bars.forEach((bar) => {
      const height = parseInt(bar.style.height ?? '0')
      expect(height).toBeGreaterThanOrEqual(4)
    })
  })

  it('scales bars proportionally — larger value gets taller bar', () => {
    render(
      <WatchTimeChart
        weekDayTotals={[0, 0, 3600, 0, 1800, 0, 0]}
        todayDayIndex={2}
      />,
    )
    const bars = screen.getAllByTestId('chart-bar')
    const height2 = parseInt(bars[2].style.height ?? '0')
    const height4 = parseInt(bars[4].style.height ?? '0')
    expect(height2).toBeGreaterThan(height4)
  })

  it('renders chart container with data-testid="watch-time-chart"', () => {
    render(
      <WatchTimeChart
        weekDayTotals={[0, 0, 0, 0, 0, 0, 0]}
        todayDayIndex={0}
      />,
    )
    expect(screen.getByTestId('watch-time-chart')).toBeDefined()
  })

  it('renders day labels M T W T F S S', () => {
    render(
      <WatchTimeChart
        weekDayTotals={[0, 0, 0, 0, 0, 0, 0]}
        todayDayIndex={0}
      />,
    )
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    labels.forEach((label) => {
      const found = screen.getAllByText(label)
      expect(found.length).toBeGreaterThanOrEqual(1)
    })
  })
})
