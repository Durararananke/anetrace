import type { CaseBundle, VitalCase } from "../types"

export async function loadCaseBundle(signal?: AbortSignal): Promise<CaseBundle> {
  const response = await fetch(`${import.meta.env.BASE_URL}cases/cases.json`, { signal })
  if (!response.ok) {
    throw new Error(`Case data request failed (HTTP ${response.status})`)
  }
  const value = (await response.json()) as unknown
  if (!isCaseBundle(value)) {
    throw new Error("The case bundle has an invalid format")
  }
  return value
}

function isCaseBundle(value: unknown): value is CaseBundle {
  if (!value || typeof value !== "object") return false
  const bundle = value as Partial<CaseBundle>
  return bundle.schemaVersion === 1 && Array.isArray(bundle.cases) && bundle.cases.every(isVitalCase)
}

function isVitalCase(value: unknown): value is VitalCase {
  if (!value || typeof value !== "object") return false
  const caseData = value as Partial<VitalCase>
  return (
    typeof caseData.id === "string" &&
    typeof caseData.title === "string" &&
    typeof caseData.duration === "number" &&
    caseData.duration > 0 &&
    !!caseData.tracks &&
    typeof caseData.tracks === "object" &&
    Array.isArray(caseData.checkpoints)
  )
}
