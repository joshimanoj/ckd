export function calcCompletionPercent(
  watchedSeconds: number,
  videoDurationSeconds: number,
): number {
  if (videoDurationSeconds === 0) return 0
  return Math.min(100, Math.round((watchedSeconds / videoDurationSeconds) * 100))
}

export function formatSeconds(totalSeconds: number): string {
  if (totalSeconds < 60) return '< 1 min'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} min`
  if (hours > 0) return `${hours} hr`
  return `${minutes} min`
}
