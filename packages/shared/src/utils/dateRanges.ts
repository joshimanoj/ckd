export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfWeek(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  // getDay(): 0=Sun, 1=Mon…6=Sat. Monday offset = (day + 6) % 7
  const dayOffset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dayOffset)
  return d
}

export function startOfMonth(): Date {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}
