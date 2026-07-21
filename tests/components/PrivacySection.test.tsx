import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { PrivacySection } from "@/components/site/PrivacySection";
import { privacySectionCopy } from "@/lib/i18n/home-copy";

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

describe("PrivacySection", () => {
  it("renders the #privacy section with all four verified guarantees and a link to /privacy", () => {
    render(<PrivacySection />);

    expect(document.getElementById("privacy")).toBeInTheDocument();
    for (const guarantee of privacySectionCopy.EN.guarantees) {
      expect(screen.getByText(guarantee.title)).toBeInTheDocument();
      expect(screen.getByText(guarantee.body)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: privacySectionCopy.EN.privacyLink })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("does not claim anything about AI training on user data (unverifiable in this codebase, deliberately omitted)", () => {
    render(<PrivacySection />);
    expect(screen.queryByText(/train/i)).not.toBeInTheDocument();
  });
});
