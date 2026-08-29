import { describe, expect, it } from "vitest"
import bundle from "../../public/cases/cases.json"

const EXPECTED_CASE_IDS = [1, 2, 3, 5, 7, 8, 10, 12, 16, 41]
const REQUIRED_TRACKS = ["hr", "map", "spo2", "etco2", "bis"]

describe("generated VitalDB case bundle", () => {
  it("contains ten fixed, traceable cases with all required signals", () => {
    expect(bundle.cases.map((caseData) => caseData.sourceCaseId)).toEqual(EXPECTED_CASE_IDS)

    for (const caseData of bundle.cases) {
      expect(Object.keys(caseData.tracks).sort()).toEqual([...REQUIRED_TRACKS].sort())
      for (const track of REQUIRED_TRACKS) {
        expect(caseData.tracks[track as keyof typeof caseData.tracks].length).toBeGreaterThan(0)
      }
    }
  })

  it("contains English-only generated content", () => {
    expect(JSON.stringify(bundle)).not.toMatch(/[\u3400-\u9fff]/)
  })
})
