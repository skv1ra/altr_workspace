import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Body, Display, Heading, Label, Prose } from "@/components/ui/Text";

describe("Text primitives", () => {
  it("Display renders an h1 by default with the display class", () => {
    render(<Display>Headline</Display>);
    const el = screen.getByText("Headline");
    expect(el.tagName).toBe("H1");
    expect(el).toHaveClass("text-display");
  });

  it("Display honors an `as` override", () => {
    render(<Display as="div">Headline</Display>);
    expect(screen.getByText("Headline").tagName).toBe("DIV");
  });

  it("Heading renders the tag matching its level by default", () => {
    render(<Heading level={3}>Section title</Heading>);
    const el = screen.getByText("Section title");
    expect(el.tagName).toBe("H3");
    expect(el).toHaveClass("text-h3");
  });

  it("Heading honors an `as` override while keeping level styling", () => {
    render(
      <Heading level={2} as="div">
        Visually h2
      </Heading>,
    );
    const el = screen.getByText("Visually h2");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("text-h2");
  });

  it("Body renders a p by default and supports muted styling", () => {
    render(<Body muted>Muted copy</Body>);
    const el = screen.getByText("Muted copy");
    expect(el.tagName).toBe("P");
    expect(el).toHaveClass("text-body", "text-text-muted");
  });

  it("Body honors an `as` override", () => {
    render(<Body as="span">Inline copy</Body>);
    expect(screen.getByText("Inline copy").tagName).toBe("SPAN");
  });

  it("Label renders a span, uppercase by default", () => {
    render(<Label>Metadata</Label>);
    const el = screen.getByText("Metadata");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("text-label", "uppercase");
  });

  it("Label can opt out of uppercase and override the tag", () => {
    render(
      <Label as="p" uppercase={false}>
        Not shouting
      </Label>,
    );
    const el = screen.getByText("Not shouting");
    expect(el.tagName).toBe("P");
    expect(el).not.toHaveClass("uppercase");
  });

  it("Prose renders a div wrapping its children with the prose class", () => {
    render(
      <Prose>
        <Body>Inside prose</Body>
      </Prose>,
    );
    expect(screen.getByText("Inside prose").closest(".prose")).toBeInTheDocument();
  });
});
