import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"
import type { CaseBundle } from "./types"

const fixture: CaseBundle = {
  schemaVersion: 1,
  generatedAt: "2026-08-29T00:00:00Z",
  disclaimer: "仅供教学与研究，不用于临床决策。",
  cases: [{
    id: "test-case",
    sourceCaseId: 42,
    title: "测试病例",
    subtitle: "多参数趋势",
    duration: 600,
    patient: { ageBand: "40–49 岁", sex: "F", asa: "ASA 2" },
    procedure: { department: "General surgery", type: "Test procedure", approach: "Open", anesthesia: "General" },
    tracks: { hr: [[0, 70], [300, 75], [600, 72]] },
    trackSources: { hr: "Solar8000/HR" },
    events: [{ id: "start", time: 0, label: "记录开始", kind: "phase" }],
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

    expect(await screen.findByRole("heading", { name: "测试病例" })).toBeInTheDocument()
    expect(screen.getByText("1 CASES / 1 SIGNALS")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument()
    expect(screen.getByText("全身麻醉")).toBeInTheDocument()
  })

  it("opens the data and safety explanation", async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole("button", { name: "数据与安全" }))

    expect(screen.getByRole("dialog", { name: "真实信号，教学边界。" })).toBeInTheDocument()
    expect(screen.getByText(/不生成诊断/)).toBeInTheDocument()
  })

  it("shows a recoverable loading error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503 } as Response)
    render(<App />)

    await waitFor(() => expect(screen.getByRole("heading", { name: "病例数据未能加载" })).toBeInTheDocument())
    expect(screen.getByRole("button", { name: "重新加载" })).toBeInTheDocument()
  })
})
