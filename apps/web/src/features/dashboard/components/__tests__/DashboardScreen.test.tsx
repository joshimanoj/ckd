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

describe('DashboardScreen — FT-4: shimmer during load', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows shimmer skeleton when loading=true', () => {
    mockUseDashboard.mockReturnValue({
      todaySeconds: 0,
      weekDayTotals: [0, 0, 0, 0, 0, 0, 0],
      monthSeconds: 0,
      loading: true,
      error: null,
      refetch: vi.fn(),
    })
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getByTestId('dashboard-shimmer')).toBeDefined()
    expect(screen.queryByTestId('today-value')).toBeNull()
  })

  it('hides shimmer when loading=false', () => {
    mockUseDashboard.mockReturnValue({
      todaySeconds: 2700,
      weekDayTotals: [0, 0, 2700, 0, 0, 0, 0],
      monthSeconds: 2700,
      loading: false,
      error: null,
      refetch: vi.fn(),
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
    mockUseDashboard.mockReturnValue({
      todaySeconds: 0,
      weekDayTotals: [0, 0, 0, 0, 0, 0, 0],
      monthSeconds: 0,
      loading: false,
      error: new Error('network error'),
      refetch,
    })
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getByTestId('dashboard-error')).toBeDefined()
    expect(screen.getByTestId('retry-btn')).toBeDefined()
  })

  it('calls refetch when retry button clicked', () => {
    const refetch = vi.fn()
    mockUseDashboard.mockReturnValue({
      todaySeconds: 0,
      weekDayTotals: [0, 0, 0, 0, 0, 0, 0],
      monthSeconds: 0,
      loading: false,
      error: new Error('fail'),
      refetch,
    })
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
    mockUseDashboard.mockReturnValue({
      todaySeconds: 0,
      weekDayTotals: [0, 0, 0, 0, 0, 0, 0],
      monthSeconds: 0,
      loading: false,
      error: null,
      refetch: vi.fn(),
      isEmpty: true,
    } as never)
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getByTestId('dashboard-empty-state')).toBeDefined()
    expect(screen.queryByTestId('today-value')).toBeNull()
  })

  it('shows today value with formatted seconds', () => {
    mockUseDashboard.mockReturnValue({
      todaySeconds: 2700,
      weekDayTotals: [0, 0, 2700, 0, 0, 0, 0],
      monthSeconds: 5400,
      loading: false,
      error: null,
      refetch: vi.fn(),
      isEmpty: false,
    } as never)
    render(<DashboardScreen {...BASE_PROPS} />)
    expect(screen.getByTestId('today-value').textContent).toBe('45 min')
  })

  it('shows monthly total with formatted seconds', () => {
    mockUseDashboard.mockReturnValue({
      todaySeconds: 2700,
      weekDayTotals: [0, 0, 2700, 0, 0, 0, 0],
      monthSeconds: 5400,
      loading: false,
      error: null,
      refetch: vi.fn(),
      isEmpty: false,
    } as never)
    render(<DashboardScreen {...BASE_PROPS} />)
    const monthEl = screen.getByTestId('monthly-total')
    expect(monthEl.textContent).toContain('1 hr 30 min')
  })
})
