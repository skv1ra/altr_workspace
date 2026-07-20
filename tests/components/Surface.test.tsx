import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hairline, Surface } from "@/components/ui/Surface";

describe("Surface", () => {
  it("renders the page variant with the surface-page class", () => {
    render(<Surface variant="page">Content</Surface>);
    expect(screen.getByText("Content")).toHaveClass("surface-page");
  });

  it("renders the inverse variant with the surface-inverse class", () => {
    render(<Surface variant="inverse">Content</Surface>);
    expect(screen.getByText("Content")).toHaveClass("surface-inverse");
  });

  it("renders the fog variant with the surface-fog class", () => {
    render(<Surface variant="fog" data-testid="fog" />);
    expect(screen.getByTestId("fog")).toHaveClass("surface-fog");
  });

  it("honors an `as` override", () => {
    render(
      <Surface variant="page" as="section">
        Content
      </Surface>,
    );
    expect(screen.getByText("Content").tagName).toBe("SECTION");
  });
});

describe("Hairline", () => {
  it.each(["top", "bottom", "left", "right"] as const)("renders the %s divider class", (side) => {
    render(<Hairline side={side} data-testid={`hairline-${side}`} />);
    expect(screen.getByTestId(`hairline-${side}`)).toHaveClass(`hairline-${side}`);
  });
});
