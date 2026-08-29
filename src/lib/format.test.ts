import { describe, expect, it } from "vitest"
import { formatTime, nearestValue } from "./format"

describe("formatTime", () => {
  it("formats minute and hour timecodes", () => {
    expect(formatTime(65)).toBe("01:05")
    expect(formatTime(3661)).toBe("01:01:01")
    expect(formatTime(-5)).toBe("00:00")
  })
})

describe("nearestValue", () => {
  const points: [number, number][] = [[0, 60], [100, 70], [200, 80]]

  it("finds the closest sample", () => {
    expect(nearestValue(points, 80)).toBe(70)
    expect(nearestValue(points, 160)).toBe(80)
  })

  it("returns null outside the freshness window", () => {
    expect(nearestValue(points, 400)).toBeNull()
    expect(nearestValue(undefined, 0)).toBeNull()
  })
})
