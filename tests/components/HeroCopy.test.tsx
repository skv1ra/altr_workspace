import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  HeroCopy,
  HERO_HEADLINE,
  HERO_SUBCOPY,
  HERO_CTA_LABEL,
  HERO_SECONDARY_LABEL,
} from "@/components/hero/HeroCopy";

// Guards against copy drift (Prompt 014's own fixed strings) — asserts the
// exact rendered text, not just that *some* heading/button exists.
describe("HeroCopy", () => {
  it("renders the exact fixed headline, subcopy, CTA, and secondary link", () => {
    render(<HeroCopy />);

    expect(screen.getByRole("heading", { level: 1, name: HERO_HEADLINE })).toBeInTheDocument();
    expect(screen.getByText(HERO_SUBCOPY)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: HERO_CTA_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: HERO_SECONDARY_LABEL })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
  });
});
