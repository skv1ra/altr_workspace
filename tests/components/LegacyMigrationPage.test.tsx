import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LegacyMigrationPage from "@/app/legacy-migration/page";
import { updateCurrentProfile } from "@/lib/auth";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, updateCurrentProfile: vi.fn() };
});

const mockedUpdateCurrentProfile = vi.mocked(updateCurrentProfile);

describe("LegacyMigrationPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("shows the no-old-data state and a Continue action when localStorage has no legacy keys", async () => {
    render(<LegacyMigrationPage />);

    expect(await screen.findByText("No old data found. You can continue.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/auth/legacy-migration/complete", { method: "POST" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(window.localStorage.getItem("altr_legacy_migration_completed_v1")).toBe("true");
  });

  it("lists found legacy entries and exposes export/migrate/delete instead of Continue", async () => {
    window.localStorage.setItem("altr_profile_v1", JSON.stringify({ name: "Old Name" }));
    render(<LegacyMigrationPage />);

    expect(await screen.findByText(/old local record/)).toBeInTheDocument();
    expect(screen.getByText("altr_profile_v1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export JSON" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Migrate safe profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete locally" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
  });

  it("migrating safe data sends only the allowlisted fields, clears the legacy keys, and finishes", async () => {
    window.localStorage.setItem(
      "altr_profile_v1",
      JSON.stringify({ name: "Old Name", altrName: "Old Altr", tone: "warm", password: "should-never-be-read" }),
    );
    mockedUpdateCurrentProfile.mockResolvedValue({} as never);
    render(<LegacyMigrationPage />);
    await screen.findByText(/old local record/);

    await userEvent.click(screen.getByRole("button", { name: "Migrate safe profile" }));

    await waitFor(() =>
      expect(mockedUpdateCurrentProfile).toHaveBeenCalledWith({ name: "Old Name", altrName: "Old Altr", tone: "warm" }),
    );
    expect(window.localStorage.getItem("altr_profile_v1")).toBeNull();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a role=alert error and keeps the entries if migration fails, instead of losing them", async () => {
    window.localStorage.setItem("altr_profile_v1", JSON.stringify({ name: "Old Name" }));
    mockedUpdateCurrentProfile.mockRejectedValue(new Error("network down"));
    render(<LegacyMigrationPage />);
    await screen.findByText(/old local record/);

    await userEvent.click(screen.getByRole("button", { name: "Migrate safe profile" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't migrate your profile");
    expect(replace).not.toHaveBeenCalled();
  });
});
