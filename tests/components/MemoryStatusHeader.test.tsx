import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryStatusHeader } from "@/components/app/memory/MemoryStatusHeader";
import { updateCurrentProfile, type AltrProfile } from "@/lib/auth";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, updateCurrentProfile: vi.fn() };
});

const mockedUpdateCurrentProfile = vi.mocked(updateCurrentProfile);

const preferences: AltrProfile["preferences"] = { learning: true, autoDrafts: true, weeklyDigest: false, privacyMode: true };
const connections: AltrProfile["connections"] = { email: false, calendar: false, messages: true, workspace: false };

afterEach(() => {
  vi.resetAllMocks();
});

describe("MemoryStatusHeader", () => {
  it("shows the real active-memories count, not a fabricated number", () => {
    render(
      <MemoryStatusHeader lang="EN" activeMemoryCount={12} memoryLimit={250} learningEnabled connections={connections} preferences={preferences} />,
    );
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it("shows only the real connected sources — messages connected, everything else not, no fabricated 'Not connected' for all", () => {
    render(
      <MemoryStatusHeader lang="EN" activeMemoryCount={12} memoryLimit={250} learningEnabled connections={connections} preferences={preferences} />,
    );
    const messagesRow = screen.getByText("Messages").closest("li")!;
    expect(messagesRow).toHaveTextContent("Connected");
    const emailRow = screen.getByText("Email").closest("li")!;
    expect(emailRow).toHaveTextContent("Not connected");
  });

  it("pausing/resuming learning writes the real memory_learning_enabled-backed preference, not a fake local toggle", async () => {
    mockedUpdateCurrentProfile.mockResolvedValue({ preferences: { ...preferences, learning: false } } as AltrProfile);
    render(
      <MemoryStatusHeader lang="EN" activeMemoryCount={12} memoryLimit={250} learningEnabled connections={connections} preferences={preferences} />,
    );
    expect(screen.getByText("Learning active")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: /Pause learning/ }));

    expect(mockedUpdateCurrentProfile).toHaveBeenCalledWith({ preferences: { ...preferences, learning: false } });
    expect(await screen.findByText("Learning paused")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Resume learning/ })).toBeInTheDocument();
  });

  it("leaves the displayed state unchanged if the write fails — no misleading optimistic flip", async () => {
    mockedUpdateCurrentProfile.mockRejectedValue(new Error("PROFILE_UPDATE_FAILED"));
    render(
      <MemoryStatusHeader lang="EN" activeMemoryCount={12} memoryLimit={250} learningEnabled connections={connections} preferences={preferences} />,
    );
    await userEvent.click(screen.getByRole("switch", { name: /Pause learning/ }));
    expect(await screen.findByText("Learning active")).toBeInTheDocument();
  });
});
