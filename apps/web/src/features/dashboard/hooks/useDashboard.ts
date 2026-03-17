import { useState, useEffect, useCallback } from 'react'
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

export function useDashboard(
  db: Firestore,
  uid: string,
  childProfileId: string,
): DashboardData {
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [weekDayTotals, setWeekDayTotals] = useState<number[]>([0, 0, 0, 0, 0, 0, 0])
  const [monthSeconds, setMonthSeconds] = useState(0)
  const [isEmpty, setIsEmpty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!uid || !childProfileId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

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
        setTodaySeconds(todayTotal)

        // Week day buckets: (getDay() + 6) % 7 → Mon=0…Sun=6
        const buckets = [0, 0, 0, 0, 0, 0, 0]
        for (const s of weekSessions) {
          const dayIdx = (s.startTime.toDate().getDay() + 6) % 7
          buckets[dayIdx] += s.watchedSeconds
        }
        setWeekDayTotals(buckets)

        // Month total
        const monthTotal = monthSessions.reduce((sum, s) => sum + s.watchedSeconds, 0)
        setMonthSeconds(monthTotal)

        // isEmpty: no sessions at all across all ranges
        setIsEmpty(
          todaySessions.length === 0 &&
            weekSessions.length === 0 &&
            monthSessions.length === 0,
        )

        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      })
  }, [db, uid, childProfileId, tick])

  return { todaySeconds, weekDayTotals, monthSeconds, loading, error, isEmpty, refetch }
}
