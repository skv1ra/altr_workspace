import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { getCookiesContent } from "@/lib/legal/cookies-content";
import { getPrivacyContent } from "@/lib/legal/privacy-content";
import { getTermsContent } from "@/lib/legal/terms-content";

describe("LegalDocumentPage", () => {
  it("renders the privacy document's title and every section heading", () => {
    render(<LegalDocumentPage kind="privacy" />);
    const content = getPrivacyContent("EN");

    expect(screen.getByRole("heading", { level: 1, name: content.title })).toBeInTheDocument();
    for (const section of content.sections) {
      expect(screen.getByRole("heading", { level: 2, name: new RegExp(section.heading) })).toBeInTheDocument();
    }
  });

  it("renders the terms document's title and every section heading", () => {
    render(<LegalDocumentPage kind="terms" />);
    const content = getTermsContent("EN");

    expect(screen.getByRole("heading", { level: 1, name: content.title })).toBeInTheDocument();
    for (const section of content.sections) {
      expect(screen.getByRole("heading", { level: 2, name: new RegExp(section.heading) })).toBeInTheDocument();
    }
  });

  it("renders the cookies document's title and every section heading", () => {
    render(<LegalDocumentPage kind="cookies" />);
    const content = getCookiesContent("EN");

    expect(screen.getByRole("heading", { level: 1, name: content.title })).toBeInTheDocument();
    for (const section of content.sections) {
      expect(screen.getByRole("heading", { level: 2, name: new RegExp(section.heading) })).toBeInTheDocument();
    }
  });

  it("shows the development notice with missing config keys (NODE_ENV is test, not production)", () => {
    render(<LegalDocumentPage kind="privacy" />);
    expect(screen.getByText("Development notice")).toBeInTheDocument();
    expect(screen.getByText(/Missing fields/)).toBeInTheDocument();
  });

  it("renders an in-page table of contents linking to every section id", () => {
    render(<LegalDocumentPage kind="privacy" />);
    const content = getPrivacyContent("EN");
    for (const section of content.sections) {
      expect(screen.getByRole("link", { name: new RegExp(section.heading) })).toHaveAttribute(
        "href",
        `#${section.id}`,
      );
    }
  });
});
