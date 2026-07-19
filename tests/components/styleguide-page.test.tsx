import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StyleguidePage from "@/app/(public)/styleguide/page";

describe("styleguide page production gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls notFound() when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => StyleguidePage()).toThrow();
  });

  it("renders the display headline outside production", () => {
    render(<StyleguidePage />);
    expect(screen.getByRole("heading", { name: /your past learns to remain/i })).toBeInTheDocument();
  });
});
