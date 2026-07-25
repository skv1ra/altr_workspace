import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsentsSection } from "@/components/app/privacy/ConsentsSection";
import type { AltrProfile } from "@/lib/auth";

function profileFixture(overrides: Partial<AltrProfile["consents"]> = {}): AltrProfile {
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
    consents: {
      policyVersion: "draft-2026-07-15",
      termsAcceptedAt: "2026-01-01T00:00:00.000Z",
      conversationProcessingAcceptedAt: "",
      aiMemoryAcceptedAt: "",
      ...overrides,
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ConsentsSection", () => {
  it("renders granted/not-granted state from the real profile.consents fields, not guessed", () => {
    const profile = profileFixture({ conversationProcessingAcceptedAt: "2026-02-01T00:00:00.000Z" });
    render(<ConsentsSection profile={profile} onProfileChange={() => {}} lang="EN" />);

    expect(screen.getByText("Conversation processing").closest("div")?.parentElement).toHaveTextContent("Granted");
    expect(screen.getByText("Personal AI memory").closest("div")?.parentElement).toHaveTextContent("Not granted");
  });

  it("granting posts the real contract to /api/consents/grant and refreshes from GET /api/me on success", async () => {
    const refreshed = profileFixture({ aiMemoryAcceptedAt: "2026-03-01T00:00:00.000Z" });
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/consents/grant") return { ok: true, json: async () => ({ ok: true, policyVersion: "draft-2026-07-15" }) };
      if (url === "/api/me") return { ok: true, json: async () => ({ profile: refreshed }) };
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const onProfileChange = vi.fn();
    render(<ConsentsSection profile={profileFixture()} onProfileChange={onProfileChange} lang="EN" />);
    await userEvent.click(screen.getAllByRole("button", { name: "Enable" })[1]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/consents/grant",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ aiMemory: true, locale: "en" }) }),
    );
    await vi.waitFor(() => expect(onProfileChange).toHaveBeenCalledWith(refreshed));
  });

  it("withdrawing posts to /api/consents/withdraw for the already-granted consent", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/consents/withdraw") return { ok: true, json: async () => ({ ok: true }) };
      if (url === "/api/me") return { ok: true, json: async () => ({ profile: profileFixture() }) };
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ConsentsSection profile={profileFixture({ conversationProcessingAcceptedAt: "2026-02-01T00:00:00.000Z" })} onProfileChange={() => {}} lang="EN" />);
    await userEvent.click(screen.getAllByRole("button", { name: "Withdraw" })[0]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/consents/withdraw",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ conversationProcessing: true, locale: "en" }) }),
    );
  });

  it("a failed update shows an honest inline error and never calls onProfileChange", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({ error: "CONSENT_UPDATE_FAILED" }) })));
    const onProfileChange = vi.fn();
    render(<ConsentsSection profile={profileFixture()} onProfileChange={onProfileChange} lang="EN" />);
    await userEvent.click(screen.getAllByRole("button", { name: "Enable" })[0]);

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't update this consent");
    expect(onProfileChange).not.toHaveBeenCalled();
  });
});
