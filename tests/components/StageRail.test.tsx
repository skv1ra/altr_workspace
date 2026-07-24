import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageRail } from "@/components/app/imports/StageRail";

describe("StageRail", () => {
  it("marks earlier stages done, the current stage current, and later stages pending", () => {
    const { container } = render(<StageRail currentIndex={1} lang="EN" />);
    const nodes = container.querySelectorAll("li");
    expect(nodes).toHaveLength(4);
    expect(nodes[0]).toHaveAttribute("data-state", "done");
    expect(nodes[1]).toHaveAttribute("data-state", "current");
    expect(nodes[2]).toHaveAttribute("data-state", "pending");
    expect(nodes[3]).toHaveAttribute("data-state", "pending");
  });

  it("marks the current stage as an error/paused state when the run stopped there, not as normal progress", () => {
    const { container } = render(<StageRail currentIndex={2} error lang="EN" />);
    const nodes = container.querySelectorAll("li");
    expect(nodes[2]).toHaveAttribute("data-state", "error");
    expect(nodes[0]).toHaveAttribute("data-state", "done");
  });

  it("renders the real named stages — no percentage/count text (the honest ceiling given the worker's own protocol)", () => {
    const { getByText, queryByText } = render(<StageRail currentIndex={0} lang="EN" />);
    expect(getByText("Parsing")).toBeInTheDocument();
    expect(getByText("Saving")).toBeInTheDocument();
    expect(getByText("Extracting memories")).toBeInTheDocument();
    expect(getByText("Done")).toBeInTheDocument();
    expect(queryByText(/%/)).not.toBeInTheDocument();
  });

  it("is decorative — hidden from the accessibility tree so it never duplicates the real status announcement", () => {
    const { container } = render(<StageRail currentIndex={0} lang="EN" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
