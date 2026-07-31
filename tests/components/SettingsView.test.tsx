import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/app/settings/SettingsView";
import { updateCurrentProfile, type AltrProfile } from "@/lib/auth";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, updateCurrentProfile: vi.fn() };
});

const mockedUpdateCurrentProfile = vi.mocked(updateCurrentProfile);

const profile: AltrProfile = {
  id: "u1",
  name: "Max Golyba",
  email: "max@example.com",
  role: "Founder",
  altrName: "Max Altr",
  bio: "Learns from approved imports only.",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  plan: "free",
  trainingProgress: 12,
  tone: "balanced",
  onboardingCompleted: true,
  stats: { conversations: 2, memories: 1, drafts: 3 },
  connections: { email: false, calendar: false, messages: false, workspace: false },
  preferences: { learning: true, autoDrafts: false, weeklyDigest: false, privacyMode: true },
  consents: { policyVersion: "1", termsAcceptedAt: "", conversationProcessingAcceptedAt: "", aiMemoryAcceptedAt: "" },
};

describe("SettingsView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("has a real h1 (046 a11y audit — was a plain styled <p>, invisible to screen-reader heading navigation)", () => {
    render(<SettingsView profile={profile} />);
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
  });

  it("renders the identity form prefilled from the server profile payload", () => {
    render(<SettingsView profile={profile} />);

    expect(screen.getByLabelText(/^Your name/)).toHaveValue("Max Golyba");
    expect(screen.getByLabelText(/^Altr name/)).toHaveValue("Max Altr");
    expect(screen.getByLabelText(/^Role/)).toHaveValue("Founder");
    expect(screen.getByLabelText("About you")).toHaveValue("Learns from approved imports only.");
    expect(screen.getByLabelText("Tone")).toHaveValue("balanced");
  });

  it("renders preference switches reflecting the server profile's own values", () => {
    render(<SettingsView profile={profile} />);

    expect(screen.getByRole("switch", { name: /learn from imported conversations/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: /generate draft replies automatically/i })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: /privacy mode/i })).toHaveAttribute("aria-checked", "true");
  });

  it("disables Save until something is actually dirty", async () => {
    render(<SettingsView profile={profile} />);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await userEvent.type(screen.getByLabelText("About you"), "!");
    expect(screen.getByRole("button", { name: "Save changes" })).not.toBeDisabled();
  });

  it("save sends only the one changed field, not the whole profile", async () => {
    mockedUpdateCurrentProfile.mockResolvedValue({ ...profile, bio: "Updated bio." });
    render(<SettingsView profile={profile} />);

    const bioField = screen.getByLabelText("About you");
    await userEvent.clear(bioField);
    await userEvent.type(bioField, "Updated bio.");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockedUpdateCurrentProfile).toHaveBeenCalledTimes(1));
    expect(mockedUpdateCurrentProfile).toHaveBeenCalledWith({ bio: "Updated bio." });
  });

  it("save sends only the one changed preference sub-field, nested under preferences", async () => {
    mockedUpdateCurrentProfile.mockResolvedValue({
      ...profile,
      preferences: { ...profile.preferences, autoDrafts: true },
    });
    render(<SettingsView profile={profile} />);

    await userEvent.click(screen.getByRole("switch", { name: /generate draft replies automatically/i }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockedUpdateCurrentProfile).toHaveBeenCalledTimes(1));
    expect(mockedUpdateCurrentProfile).toHaveBeenCalledWith({ preferences: { autoDrafts: true } });
  });

  it("the dirty-state guard intercepts in-app navigation anywhere on the page, not just inside the form itself", async () => {
    render(
      <>
        <a href="/dashboard">Elsewhere on the page</a>
        <SettingsView profile={profile} />
      </>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Elsewhere on the page" }));
    expect(push).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/^Role/), "!");
    await userEvent.click(screen.getByRole("link", { name: "Elsewhere on the page" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("Leave without saving your changes?");
    expect(push).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Leave without saving" }));
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("choosing to keep editing closes the guard dialog without navigating", async () => {
    render(
      <>
        <a href="/dashboard">Elsewhere on the page</a>
        <SettingsView profile={profile} />
      </>,
    );

    await userEvent.type(screen.getByLabelText(/^Role/), "!");
    await userEvent.click(screen.getByRole("link", { name: "Elsewhere on the page" }));
    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
