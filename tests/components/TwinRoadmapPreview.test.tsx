import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TwinRoadmapPreview } from "@/components/app/twin/TwinRoadmapPreview";

const previews = [
  { id: "operator", name: "Operator", status: "coming_later" },
  { id: "negotiator", name: "Negotiator", status: "coming_later" },
];

describe("TwinRoadmapPreview", () => {
  it("renders both real previews from the API's own array with the 'In development' badge and their real names", () => {
    render(<TwinRoadmapPreview previews={previews} lang="EN" />);
    expect(screen.getByText("Operator")).toBeInTheDocument();
    expect(screen.getByText("Negotiator")).toBeInTheDocument();
    expect(screen.getAllByText("In development")).toHaveLength(2);
  });

  it("is fully non-interactive — no button, link, or focusable/tabbable element anywhere in a preview card (RISKS R9: no dead affordances)", () => {
    render(<TwinRoadmapPreview previews={previews} lang="EN" />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.querySelectorAll("[tabindex], button, a[href]")).toHaveLength(0);
    }
  });

  it("an unrecognized preview id still renders honestly via the generic fallback body, rather than being silently dropped", () => {
    render(<TwinRoadmapPreview previews={[{ id: "analyst", name: "Analyst", status: "coming_later" }]} lang="EN" />);
    expect(screen.getByText("Analyst")).toBeInTheDocument();
    expect(screen.getByText("Not available yet — this preview cannot send messages or take any action.")).toBeInTheDocument();
  });

  it("renders nothing at all when the real API returns no previews, rather than an empty heading with no content", () => {
    const { container } = render(<TwinRoadmapPreview previews={[]} lang="EN" />);
    expect(container).toBeEmptyDOMElement();
  });
});
