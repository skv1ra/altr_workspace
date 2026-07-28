import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { TwinDemo } from "@/components/site/TwinDemo";
import { twinDemoCopy } from "@/lib/i18n/home-copy";

beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IntersectionObserver = IntersectionObserverStub;
});

describe("TwinDemo", () => {
  it("renders the #twin section with the incoming message, the draft, and its required literal label", () => {
    render(<TwinDemo />);

    expect(document.getElementById("twin")).toBeInTheDocument();
    expect(screen.getByText(twinDemoCopy.EN.incomingMessage)).toBeInTheDocument();
    expect(screen.getByText("Draft — you decide what sends")).toBeInTheDocument();
    expect(screen.getByText(twinDemoCopy.EN.draftMessage)).toBeInTheDocument();
    expect(screen.getByText(twinDemoCopy.EN.provenance)).toBeInTheDocument();
  });

  it("is a labeled figure, not a fake live conversation, and has no send button — only a non-destructive replay control", () => {
    render(<TwinDemo />);

    const figure = screen.getByRole("figure", { name: twinDemoCopy.EN.figureLabel });
    expect(figure).toBeInTheDocument();
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent(twinDemoCopy.EN.replay);
    expect(buttons.some((button) => /send/i.test(button.textContent ?? ""))).toBe(false);
  });
});
