import type { Firestore } from 'firebase/firestore'
import { formatSeconds } from '@ckd/shared/utils/watchTime'
import { useDashboard } from '../hooks/useDashboard'
import { WatchTimeChart } from './WatchTimeChart'
import { useChildProfileStore } from '../../../shared/store/childProfileStore'

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

function StatCard({
  label,
  value,
  testId,
}: {
  label: string
  value: string
  testId?: string
}) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 22,
      padding: '12px 16px 10px',
      minHeight: 60,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: 6,
      boxShadow: '0 12px 24px rgba(147, 51, 234, 0.06)',
    }}>
      <span style={{
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        lineHeight: 1.05,
      }}>
        {label}
        {label === 'Videos Watched' && (
          <span
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            Videos
          </span>
        )}
      </span>
      <span
        data-testid={testId}
        style={{
        fontFamily: "'Baloo 2', sans-serif",
        fontWeight: 800,
        fontSize: 30,
        color: '#9333EA',
        lineHeight: 0.9,
      }}
      >
        {value}
      </span>
    </div>
  )
}

export function DashboardScreen({ db, uid, childProfileId }: DashboardScreenProps) {
  const {
    todaySeconds, weekDayTotals, weekSeconds, monthSeconds,
    avgDaySeconds, videosWatched, loading, error, isEmpty, refetch,
  } = useDashboard(db, uid, childProfileId)
  const activeProfile = useChildProfileStore((s) => s.activeProfile)

  const todayDayIndex = (new Date().getDay() + 6) % 7
  const profileName = activeProfile?.name ?? 'Your Child'

  if (loading) return <ShimmerSkeleton />

  if (error) {
    return (
      <div
        data-testid="dashboard-error"
        style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
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
        style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
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
      style={{ padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>👧</span>
          <p style={{
            fontFamily: "'Baloo 2', sans-serif",
            fontWeight: 700,
            fontSize: 19,
            color: '#27235C',
            margin: 0,
            lineHeight: 0.98,
            letterSpacing: '0.01em',
          }}>
            {`${profileName}'s Watch Time`}
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        borderRadius: 38,
        padding: '28px 24px',
        background: 'linear-gradient(90deg, #EC4899 0%, #9333EA 48%, #D946EF 100%)',
        boxShadow: '0 20px 42px rgba(147, 51, 234, 0.2)',
      }}>
        <div style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          background: 'rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 42,
          flexShrink: 0,
        }}>
          📺
        </div>
        <div>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: 15,
            color: 'rgba(255,255,255,0.92)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 4px 0',
          }}>
            Today
          </p>
          <p
            data-testid="today-value"
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontWeight: 700,
              fontSize: 42,
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 0.95,
            }}
          >
            {formatSeconds(todaySeconds)}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{
          fontFamily: "'Baloo 2', sans-serif",
          fontWeight: 700,
          fontSize: 19,
          color: '#27235C',
          margin: 0,
          lineHeight: 1,
        }}>
          Weekly Activity
        </p>
        <WatchTimeChart weekDayTotals={weekDayTotals} todayDayIndex={todayDayIndex} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 14, rowGap: 14 }}>
        <StatCard label="This Week" value={formatSeconds(weekSeconds)} />
        <StatCard label="This Month" value={formatSeconds(monthSeconds)} testId="monthly-total" />
        <StatCard label="Avg / Day" value={formatSeconds(avgDaySeconds)} />
        <StatCard label="Videos Watched" value={String(videosWatched)} />
      </div>
    </div>
  )
}
