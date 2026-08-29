import { render, screen } from "@testing-library/react"
import App from "./App"

describe("application shell", () => {
  it("renders the product boot state", () => {
    render(<App />)

    expect(screen.getByText("ANETRACE / SYSTEM BOOT")).toBeInTheDocument()
  })
})
