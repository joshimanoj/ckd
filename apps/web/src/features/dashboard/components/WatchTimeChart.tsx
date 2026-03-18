const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MAX_BAR_HEIGHT = 138
const MIN_BAR_HEIGHT = 18

interface WatchTimeChartProps {
  weekDayTotals: number[] // [Mon…Sun], length 7
  todayDayIndex: number   // 0=Mon…6=Sun
}

export function WatchTimeChart({ weekDayTotals, todayDayIndex }: WatchTimeChartProps) {
  const maxSeconds = Math.max(...weekDayTotals, 1)

  return (
    <div
      data-testid="watch-time-chart"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 10,
      }}
    >
      {weekDayTotals.map((seconds, i) => {
        const isToday = i === todayDayIndex
        const filledHeight = Math.max(MIN_BAR_HEIGHT, (seconds / maxSeconds) * MAX_BAR_HEIGHT)
        return (
          <div
            key={i}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}
          >
            <div
              style={{
                width: '100%',
                height: MAX_BAR_HEIGHT,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  width: 42,
                  maxWidth: '100%',
                  height: filledHeight,
                  background: isToday ? 'linear-gradient(180deg, #9333EA 0%, #7C3AED 100%)' : '#E9D5FF',
                  borderRadius: 14,
                  boxShadow: isToday ? '0 10px 18px rgba(147, 51, 234, 0.18)' : 'none',
                }}
              >
                <div
                  data-testid="chart-bar"
                  data-today={isToday ? 'true' : undefined}
                  style={{
                    width: '100%',
                    height: filledHeight,
                    borderRadius: 14,
                    opacity: 0,
                  }}
                />
              </div>
            </div>
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: '#6B7280',
                lineHeight: 1,
              }}
            >
              {DAY_LABELS[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
