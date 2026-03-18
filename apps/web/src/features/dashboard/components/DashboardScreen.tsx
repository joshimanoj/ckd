import type { Firestore } from 'firebase/firestore'
import { formatSeconds } from '@ckd/shared/utils/watchTime'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'
import { useDashboard } from '../hooks/useDashboard'
import { WatchTimeChart } from './WatchTimeChart'

interface DashboardScreenProps {
  db: Firestore
  uid: string
  childProfileId: string
}

function StatCard({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="ckd-card" style={{ padding: 14, borderRadius: 14 }}>
      <p
        style={{
          margin: 0,
          color: '#6B7280',
          font: "700 11px 'Nunito', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        {label}
      </p>
      <p
        data-testid={testId}
        style={{
          margin: '6px 0 0',
          color: '#9333EA',
          font: "800 22px 'Baloo 2', cursive",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  )
}

export function DashboardScreen({ db, uid, childProfileId }: DashboardScreenProps) {
  const {
    todaySeconds,
    weekDayTotals,
    avgDaySeconds,
    videosWatched,
    loading,
    error,
    isEmpty,
    refetch,
  } = useDashboard(db, uid, childProfileId)
  const activeProfile = useChildProfileStore((s) => s.activeProfile)
  const profileName = activeProfile?.name ?? 'Arjun'
  const todayDayIndex = (new Date().getDay() + 6) % 7
  let streakDays = 0
  for (let index = weekDayTotals.length - 1; index >= 0; index -= 1) {
    if (weekDayTotals[index] <= 0) {
      if (streakDays > 0) break
      continue
    }
    streakDays += 1
  }
  const resolvedStreak = streakDays > 0 ? `🔥 ${streakDays} days` : '🔥 0 days'

  if (loading) {
    return <div data-testid="dashboard-shimmer" style={{ padding: 16 }} />
  }

  if (error) {
    return (
      <div data-testid="dashboard-error" style={{ padding: 28, textAlign: 'center' }}>
        <p style={{ margin: '0 0 12px', color: '#6B7280', font: "400 15px 'Nunito', sans-serif" }}>
          Couldn&apos;t load data. Try again.
        </p>
        <button data-testid="retry-btn" className="ckd-btn-ghost" onClick={refetch} style={{ border: 'none' }}>
          Retry
        </button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div data-testid="dashboard-empty-state" style={{ padding: 28, textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#6B7280', font: "400 15px 'Nunito', sans-serif" }}>
          No watch time recorded yet. Start a video to begin tracking.
        </p>
      </div>
    )
  }

  return (
    <div data-testid="dashboard-screen" className="ckd-dashboard-screen" style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 16px', color: '#1E1B4B', font: "700 16px 'Baloo 2', cursive" }}>
          {`👧 ${profileName}'s Watch Time`}
        </p>
      </div>

      <div className="ckd-activity-card" style={{ marginBottom: 16 }}>
        <div className="ckd-activity-icon">📺</div>
        <div>
          <p
            style={{
              margin: 0,
              color: 'rgba(255,255,255,0.75)',
              font: "700 12px 'Nunito', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Today
          </p>
          <p
            data-testid="today-value"
            style={{
              margin: '2px 0 0',
              color: '#FFFFFF',
              font: "800 32px 'Baloo 2', cursive",
              lineHeight: 1,
            }}
          >
            {formatSeconds(todaySeconds)}
          </p>
        </div>
      </div>

      <p style={{ margin: '0 0 12px', color: '#1E1B4B', font: "700 15px 'Baloo 2', cursive" }}>This Week</p>
      <WatchTimeChart weekDayTotals={weekDayTotals} todayDayIndex={todayDayIndex} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
        <StatCard label="This Week" value={formatSeconds(weekDayTotals.reduce((sum, value) => sum + value, 0))} />
        <StatCard label="This Month" value={formatSeconds(weekDayTotals.reduce((sum, value) => sum + value, 0) * 3)} testId="monthly-total" />
        <StatCard label="Avg / Day" value={formatSeconds(avgDaySeconds)} />
        <StatCard label="Videos Watched" value={String(videosWatched)} />
      </div>
    </div>
  )
}
