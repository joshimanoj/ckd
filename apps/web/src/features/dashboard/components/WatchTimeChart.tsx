const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MAX_BAR_HEIGHT = 120
const MIN_BAR_HEIGHT = 4

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 4px',
      }}
    >
      {weekDayTotals.map((seconds, i) => {
        const isToday = i === todayDayIndex
        const filledHeight = Math.max(MIN_BAR_HEIGHT, (seconds / maxSeconds) * MAX_BAR_HEIGHT)
        return (
          <div
            key={i}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
          >
            {/* Track */}
            <div
              style={{
                width: 8,
                height: MAX_BAR_HEIGHT,
                background: '#E9D5FF',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                overflow: 'hidden',
              }}
            >
              {/* Filled bar */}
              <div
                data-testid="chart-bar"
                data-today={isToday ? 'true' : undefined}
                style={{
                  width: '100%',
                  height: filledHeight,
                  background: isToday ? '#9333EA' : '#C4B5FD',
                  borderRadius: 4,
                }}
              />
            </div>
            {/* Day label */}
            <span
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 11,
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
