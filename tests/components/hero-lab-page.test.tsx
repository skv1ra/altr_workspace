import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeroLabPage from "@/app/(public)/hero-lab/page";
import { HERO_HEADLINE } from "@/components/hero/HeroCopy";

describe("hero-lab page production gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls notFound() when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => HeroLabPage()).toThrow();
  });

  it("renders the fixed hero headline outside production", () => {
    render(<HeroLabPage />);
    expect(screen.getByRole("heading", { name: HERO_HEADLINE })).toBeInTheDocument();
  });
});
