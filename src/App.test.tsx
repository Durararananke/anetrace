import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"
import type { CaseBundle } from "./types"

const fixture: CaseBundle = {
  schemaVersion: 1,
  generatedAt: "2026-08-29T00:00:00Z",
  disclaimer: "For education and research only. Not for clinical decisions.",
  cases: [{
    id: "test-case",
    sourceCaseId: 42,
    title: "Test case",
    subtitle: "Multi-parameter trend",
    duration: 600,
    patient: { ageBand: "40-49 years", sex: "Female", asa: "ASA 2" },
    procedure: { department: "General surgery", type: "Test procedure", approach: "Open", anesthesia: "General" },
    tracks: { hr: [[0, 70], [300, 75], [600, 72]] },
    trackSources: { hr: "Solar8000/HR" },
    events: [{ id: "start", time: 0, label: "Record start", kind: "phase" }],
    checkpoints: [],
    provenance: {
      dataset: "VitalDB v1.0.0",
      license: "CC BY 4.0",
      url: "https://physionet.org/content/vitaldb/1.0.0/",
      samplingSeconds: 10,
    },
  }],
}

describe("application shell", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fixture,
    }))
  })

  afterEach(() => vi.unstubAllGlobals())

  it("loads a case and exposes the replay controls", async () => {
    render(<App />)

    expect(await screen.findByRole("heading", { name: "Test case" })).toBeInTheDocument()
    expect(screen.getByText("1 CASES / 1 SIGNALS")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument()
    expect(screen.getByText("General anesthesia")).toBeInTheDocument()
  })

  it("opens the data and safety explanation", async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole("button", { name: "Data & safety" }))

    expect(screen.getByRole("dialog", { name: "Real signals. Clear teaching boundaries." })).toBeInTheDocument()
    expect(screen.getByText(/does not generate diagnoses/)).toBeInTheDocument()
  })

  it("shows a recoverable loading error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503 } as Response)
    render(<App />)

    await waitFor(() => expect(screen.getByRole("heading", { name: "Case data could not be loaded" })).toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument()
  })

  it("switches theme and persists the preference", async () => {
    render(<App />)
    const toggle = await screen.findByRole("button", { name: "Switch to light theme" })

    fireEvent.click(toggle)

    expect(document.documentElement.dataset.theme).toBe("light")
    expect(document.body.dataset.theme).toBe("light")
    expect(localStorage.getItem("anetrace.theme.v1")).toBe("light")
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument()
  })
})
