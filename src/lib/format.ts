export function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":")
  }

  return [minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":")
}

export function nearestValue(points: [number, number][] | undefined, time: number): number | null {
  if (!points?.length) return null

  let low = 0
  let high = points.length - 1
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (points[middle][0] < time) low = middle + 1
    else high = middle
  }

  const candidates = [points[low], points[Math.max(0, low - 1)]].filter(Boolean)
  const nearest = candidates.reduce((best, point) =>
    Math.abs(point[0] - time) < Math.abs(best[0] - time) ? point : best,
  )
  return Math.abs(nearest[0] - time) <= 90 ? nearest[1] : null
}
