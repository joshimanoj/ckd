import type { Firestore } from 'firebase/firestore'
import { formatSeconds } from '@ckd/shared/utils/watchTime'
import { useDashboard } from '../hooks/useDashboard'
import { WatchTimeChart } from './WatchTimeChart'

interface DashboardScreenProps {
  db: Firestore
  uid: string
  childProfileId: string
}

function ShimmerBar({ width, height }: { width: number | string; height: number }) {
  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #E5E7EB 25%, #F9FAFB 50%, #E5E7EB 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
        borderRadius: 8,
      }}
    />
  )
}

function ShimmerSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      <div data-testid="dashboard-shimmer" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ShimmerBar width={80} height={16} />
        <ShimmerBar width={120} height={36} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
          {[40, 80, 60, 80, 50, 30, 40].map((h, i) => (
            <ShimmerBar key={i} width={8} height={h} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => <ShimmerBar key={i} width={60} height={40} />)}
        </div>
        <ShimmerBar width={160} height={16} />
      </div>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: 1,
      background: '#F3E8FF',
      borderRadius: 12,
      padding: '8px 6px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
      <span style={{
        fontFamily: "'Baloo 2', sans-serif",
        fontWeight: 700,
        fontSize: 15,
        color: '#7C3AED',
        lineHeight: 1.2,
      }}>{value}</span>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 700,
        fontSize: 10,
        color: '#9CA3AF',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.4px',
        textAlign: 'center' as const,
        lineHeight: 1.2,
      }}>{label}</span>
    </div>
  )
}

export function DashboardScreen({ db, uid, childProfileId }: DashboardScreenProps) {
  const {
    todaySeconds, weekDayTotals, weekSeconds, monthSeconds,
    avgDaySeconds, videosWatched, loading, error, isEmpty, refetch,
  } = useDashboard(db, uid, childProfileId)

  const todayDayIndex = (new Date().getDay() + 6) % 7

  if (loading) return <ShimmerSkeleton />

  if (error) {
    return (
      <div
        data-testid="dashboard-error"
        style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <p style={{ fontFamily: "'Nunito', sans-serif", color: '#6B7280', textAlign: 'center' }}>
          Couldn't load data. Try again.
        </p>
        <button
          data-testid="retry-btn"
          onClick={refetch}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#7C3AED',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div
        data-testid="dashboard-empty-state"
        style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
      >
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E9D5FF' }} />
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: 15,
          color: '#6B7280',
          textAlign: 'center',
          margin: 0,
        }}>
          No watch time recorded yet. Start a video to begin tracking.
        </p>
      </div>
    )
  }

  return (
    <div
      data-testid="dashboard-screen"
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Today */}
      <div>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          color: '#6B7280',
          margin: '0 0 4px 0',
        }}>
          Today
        </p>
        <p
          data-testid="today-value"
          style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: '#9333EA',
            margin: 0,
          }}
        >
          {formatSeconds(todaySeconds)}
        </p>
      </div>

      {/* Weekly chart */}
      <WatchTimeChart weekDayTotals={weekDayTotals} todayDayIndex={todayDayIndex} />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 6 }}>
        <StatCard label="This Week" value={formatSeconds(weekSeconds)} />
        <StatCard label="This Month" value={formatSeconds(monthSeconds)} />
        <StatCard label="Avg / Day" value={formatSeconds(avgDaySeconds)} />
        <StatCard label="Videos" value={String(videosWatched)} />
      </div>

      {/* Monthly total */}
      <p
        data-testid="monthly-total"
        style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          fontSize: 15,
          color: '#1E1B4B',
          margin: 0,
        }}
      >
        This month: {formatSeconds(monthSeconds)}
      </p>
    </div>
  )
}
