export type AgeRange = 'under-3' | '3-4' | '5-6'

const MONTHS: Record<AgeRange, number> = {
  'under-3': 18,
  '3-4': 42,
  '5-6': 66,
}

export function dobFromAgeRange(range: AgeRange, now: Date = new Date()): Date {
  const months = MONTHS[range]
  const d = new Date(now)
  d.setMonth(d.getMonth() - months)
  return d
}

export function ageRangeFromDob(dob: Date, now: Date = new Date()): AgeRange {
  const months =
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth()) -
    (now.getDate() < dob.getDate() ? 1 : 0)

  if (months < 36) return 'under-3'
  if (months < 60) return '3-4'
  return '5-6'
}
