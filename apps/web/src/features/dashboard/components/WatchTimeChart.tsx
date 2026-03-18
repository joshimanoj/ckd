const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_BAR_HEIGHT = 100
const MIN_BAR_HEIGHT = 20

interface WatchTimeChartProps {
  weekDayTotals: number[]
  todayDayIndex: number
}

export function WatchTimeChart({ weekDayTotals, todayDayIndex }: WatchTimeChartProps) {
  const maxSeconds = Math.max(...weekDayTotals, 1)

  return (
    <div data-testid="watch-time-chart">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, marginBottom: 8 }}>
        {weekDayTotals.map((seconds, index) => {
          const isToday = index === todayDayIndex
          const filledHeight = Math.max(MIN_BAR_HEIGHT, (seconds / maxSeconds) * MAX_BAR_HEIGHT)

          return (
            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: '100%',
                  height: filledHeight,
                  borderRadius: '6px 6px 0 0',
                  background: isToday ? 'linear-gradient(135deg, #F43F5E 0%, #9333EA 50%, #EC4899 100%)' : '#F3E8FF',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  data-testid="chart-bar"
                  data-today={isToday ? 'true' : undefined}
                  style={{ width: '100%', height: '100%', opacity: 0 }}
                />
              </div>
              <span style={{ color: '#6B7280', font: "600 11px 'Nunito', sans-serif" }}>{DAY_LABELS[index][0]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
