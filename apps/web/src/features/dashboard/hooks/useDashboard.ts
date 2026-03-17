import { useReducer, useEffect, useCallback } from 'react'
import type { Firestore } from 'firebase/firestore'
import { startOfToday, startOfWeek, startOfMonth } from '@ckd/shared/utils/dateRanges'
import { fetchSessionsSince } from '../services/dashboardService'

export interface DashboardData {
  todaySeconds: number
  weekDayTotals: number[] // [Mon, Tue, Wed, Thu, Fri, Sat, Sun] — length 7
  monthSeconds: number
  loading: boolean
  error: Error | null
  isEmpty: boolean
  refetch: () => void
}

interface State {
  todaySeconds: number
  weekDayTotals: number[]
  monthSeconds: number
  loading: boolean
  error: Error | null
  isEmpty: boolean
}

type Action =
  | { type: 'FETCH_START' }
  | {
      type: 'FETCH_SUCCESS'
      todaySeconds: number
      weekDayTotals: number[]
      monthSeconds: number
      isEmpty: boolean
    }
  | { type: 'FETCH_ERROR'; error: Error }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        todaySeconds: action.todaySeconds,
        weekDayTotals: action.weekDayTotals,
        monthSeconds: action.monthSeconds,
        isEmpty: action.isEmpty,
      }
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error }
  }
}

const initialState: State = {
  todaySeconds: 0,
  weekDayTotals: [0, 0, 0, 0, 0, 0, 0],
  monthSeconds: 0,
  loading: false,
  error: null,
  isEmpty: false,
}

export function useDashboard(
  db: Firestore,
  uid: string,
  childProfileId: string,
): DashboardData {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => ({
    ...init,
    loading: Boolean(uid && childProfileId),
  }))
  const [tick, setTick] = useReducer((t: number) => t + 1, 0)

  const refetch = useCallback(() => setTick(), [])

  useEffect(() => {
    if (!uid || !childProfileId) {
      return
    }

    dispatch({ type: 'FETCH_START' })

    const today = startOfToday()
    const weekStart = startOfWeek()
    const monthStart = startOfMonth()

    Promise.all([
      fetchSessionsSince(db, uid, childProfileId, today),
      fetchSessionsSince(db, uid, childProfileId, weekStart),
      fetchSessionsSince(db, uid, childProfileId, monthStart),
    ])
      .then(([todaySessions, weekSessions, monthSessions]) => {
        // Today total
        const todayTotal = todaySessions.reduce((sum, s) => sum + s.watchedSeconds, 0)

        // Week day buckets: (getDay() + 6) % 7 → Mon=0…Sun=6
        const buckets = [0, 0, 0, 0, 0, 0, 0]
        for (const s of weekSessions) {
          const dayIdx = (s.startTime.toDate().getDay() + 6) % 7
          buckets[dayIdx] += s.watchedSeconds
        }

        // Month total
        const monthTotal = monthSessions.reduce((sum, s) => sum + s.watchedSeconds, 0)

        dispatch({
          type: 'FETCH_SUCCESS',
          todaySeconds: todayTotal,
          weekDayTotals: buckets,
          monthSeconds: monthTotal,
          isEmpty:
            todaySessions.length === 0 &&
            weekSessions.length === 0 &&
            monthSessions.length === 0,
        })
      })
      .catch((err: unknown) => {
        dispatch({
          type: 'FETCH_ERROR',
          error: err instanceof Error ? err : new Error(String(err)),
        })
      })
  }, [db, uid, childProfileId, tick])

  return { ...state, refetch }
}
