import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrivacyCenter } from "@/components/app/privacy/PrivacyCenter";
import type { AltrProfile } from "@/lib/auth";

function profileFixture(): AltrProfile {
  return {
    id: "user-1",
    name: "Test User",
    email: "user@example.com",
    role: "Founder",
    altrName: "My Altr",
    bio: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    plan: "free",
    trainingProgress: 10,
    tone: "balanced",
    onboardingCompleted: true,
    stats: { conversations: 0, memories: 0, drafts: 0 },
    connections: { email: false, calendar: false, messages: false, workspace: false },
    preferences: { learning: true, autoDrafts: false, weeklyDigest: false, privacyMode: true },
    consents: { policyVersion: "draft-2026-07-15", termsAcceptedAt: "", conversationProcessingAcceptedAt: "", aiMemoryAcceptedAt: "" },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PrivacyCenter", () => {
  it("has exactly one h1 and a proper h2 sibling structure — no skipped heading levels (046 a11y audit)", () => {
    render(<PrivacyCenter profile={profileFixture()} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const h2s = screen.getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(4); // consents, export, legal, danger
    expect(screen.queryAllByRole("heading", { level: 3 }).length).toBe(0);
  });

  it("links every real legal document and the cookie-preferences dialog trigger (046 legal-verification finding: none of these were linked from the privacy center before)", () => {
    render(<PrivacyCenter profile={profileFixture()} />);
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute("href", "/cookies");
    expect(screen.getByRole("link", { name: "Data Deletion" })).toHaveAttribute("href", "/data-deletion");
    expect(screen.getByRole("button", { name: "Cookie preferences" })).toBeInTheDocument();
  });

  it("the danger-zone trigger opens the real deletion ceremony dialog", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<PrivacyCenter profile={profileFixture()} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Delete your Altr account permanently?");
  });
});
