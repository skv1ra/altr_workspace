import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroFragmentsAccessibleList } from "@/components/hero/HeroFragments";
import { HERO_FRAGMENTS } from "@/components/hero/fragments";

describe("HeroFragmentsAccessibleList", () => {
  it("renders the labeled group with every fragment title", () => {
    render(<HeroFragmentsAccessibleList />);

    expect(screen.getByRole("group", { name: "Examples of remembered moments" })).toBeInTheDocument();
    for (const fragment of HERO_FRAGMENTS) {
      expect(screen.getByText(fragment.title)).toBeInTheDocument();
    }
  });
});
