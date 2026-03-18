import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardScreen } from '../DashboardScreen'

// Mock the hook — DashboardScreen consumes it
vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: vi.fn(),
}))

vi.mock('@ckd/shared/firebase/config', () => ({ db: {} }))

import { useDashboard } from '../../hooks/useDashboard'
const mockUseDashboard = vi.mocked(useDashboard)

const BASE_PROPS = { db: {} as never, uid: 'user-1', childProfileId: 'child-1' }

const BASE_MOCK = {
  todaySeconds: 0,
  weekDayTotals: [0, 0, 0, 0, 0, 0, 0],
  weekSeconds: 0,
  monthSeconds: 0,
  avgDaySeconds: 0,
  videosWatched: 0,
  loading: false,
  error: null,
  isEmpty: false,
  refetch: vi.fn(),
}

describe('DashboardScreen — FT-4: shimmer during load', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows shimmer skeleton when loading=true', () => {
    mockUseDashboard.mockReturnValue({ ...BASE_MOCK, loading: true })
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getByTestId('dashboard-shimmer')).toBeDefined()
    expect(screen.queryByTestId('today-value')).toBeNull()
  })

  it('hides shimmer when loading=false', () => {
    mockUseDashboard.mockReturnValue({
      ...BASE_MOCK,
      todaySeconds: 2700,
      weekDayTotals: [0, 0, 2700, 0, 0, 0, 0],
      weekSeconds: 2700,
      monthSeconds: 2700,
    })
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.queryByTestId('dashboard-shimmer')).toBeNull()
  })
})

describe('DashboardScreen — FT-5: error state + retry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error message and retry button when error is set', () => {
    const refetch = vi.fn()
    mockUseDashboard.mockReturnValue({ ...BASE_MOCK, error: new Error('network error'), refetch })
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getByTestId('dashboard-error')).toBeDefined()
    expect(screen.getByTestId('retry-btn')).toBeDefined()
  })

  it('calls refetch when retry button clicked', () => {
    const refetch = vi.fn()
    mockUseDashboard.mockReturnValue({ ...BASE_MOCK, error: new Error('fail'), refetch })
    render(<DashboardScreen {...BASE_PROPS} />)
    fireEvent.click(screen.getByTestId('retry-btn'))
    expect(refetch).toHaveBeenCalledOnce()
  })
})

describe('DashboardScreen — data and empty states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no sessions exist', () => {
    mockUseDashboard.mockReturnValue({ ...BASE_MOCK, isEmpty: true })
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getByTestId('dashboard-empty-state')).toBeDefined()
    expect(screen.queryByTestId('today-value')).toBeNull()
  })

  it('shows today value with formatted seconds', () => {
    mockUseDashboard.mockReturnValue({
      ...BASE_MOCK,
      todaySeconds: 2700,
      weekDayTotals: [0, 0, 2700, 0, 0, 0, 0],
      weekSeconds: 2700,
      monthSeconds: 5400,
      avgDaySeconds: 300,
      videosWatched: 3,
      isEmpty: false,
    })
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getByTestId('today-value').textContent).toBe('45 min')
  })

  it('shows monthly total with formatted seconds', () => {
    mockUseDashboard.mockReturnValue({
      ...BASE_MOCK,
      todaySeconds: 2700,
      weekDayTotals: [0, 0, 2700, 0, 0, 0, 0],
      weekSeconds: 2700,
      monthSeconds: 5400,
      avgDaySeconds: 300,
      videosWatched: 3,
      isEmpty: false,
    })
    render(<DashboardScreen {...BASE_PROPS} />)
    const monthEl = screen.getByTestId('monthly-total')
    expect(monthEl.textContent).toContain('2 hr 15 min')
  })

  it('shows stats row with week, month, avg and video count', () => {
    mockUseDashboard.mockReturnValue({
      ...BASE_MOCK,
      todaySeconds: 1800,
      weekSeconds: 9000,
      monthSeconds: 33300,
      avgDaySeconds: 1800,
      videosWatched: 15,
      weekDayTotals: [0, 1800, 0, 0, 0, 0, 0],
      isEmpty: false,
    })
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getAllByText('This Week').length).toBeGreaterThan(0)
    expect(screen.getByText('Avg / Day')).toBeDefined()
    expect(screen.getByText('Videos Watched')).toBeDefined()
    expect(screen.getByText('15')).toBeDefined()
  })
})
