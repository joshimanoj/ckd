export function parseDuration(mmss: string): number | null {
  const match = /^(\d+):([0-5]\d)$/.exec(mmss.trim())
  if (!match) return null
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
}
