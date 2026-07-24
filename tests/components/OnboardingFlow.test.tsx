import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OnboardingFlow } from "@/components/app/onboarding/OnboardingFlow";
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

describe("OnboardingFlow", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows exactly one step at a time, starting with the name step, no progress dots or step counter", () => {
    render(<OnboardingFlow initialAltrName="My Altr" initialTone="balanced" />);

    expect(screen.getByRole("heading", { name: "Give your Altr a name." })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Choose a tone." })).not.toBeInTheDocument();
    expect(screen.queryByText(/step 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1\s*\/\s*3/)).not.toBeInTheDocument();
  });

  it("skip is available on the very first step and is offered with the same weight as Continue", () => {
    render(<OnboardingFlow initialAltrName="My Altr" initialTone="balanced" />);

    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
  });

  it("skipping from the first step persists onboardingCompleted and redirects to the dashboard without saving the untouched name field", async () => {
    mockedUpdateCurrentProfile.mockResolvedValue({} as never);
    render(<OnboardingFlow initialAltrName="My Altr" initialTone="balanced" />);

    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    await waitFor(() => expect(mockedUpdateCurrentProfile).toHaveBeenCalledWith({ onboardingCompleted: true }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("continuing through name and tone saves each step's own field, then the final step finishes onboarding", async () => {
    mockedUpdateCurrentProfile.mockResolvedValue({} as never);
    render(<OnboardingFlow initialAltrName="My Altr" initialTone="balanced" />);

    const nameField = screen.getByLabelText(/^Altr name/);
    await userEvent.clear(nameField);
    await userEvent.type(nameField, "Nova");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByRole("heading", { name: "Choose a tone." });
    expect(mockedUpdateCurrentProfile).toHaveBeenCalledWith({ altrName: "Nova" });

    await userEvent.selectOptions(screen.getByLabelText("Tone"), "direct");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByRole("heading", { name: "Import your first conversation." });
    expect(mockedUpdateCurrentProfile).toHaveBeenCalledWith({ tone: "direct" });

    await userEvent.click(screen.getByRole("button", { name: "Go to dashboard" }));
    await waitFor(() => expect(mockedUpdateCurrentProfile).toHaveBeenCalledWith({ onboardingCompleted: true }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("the final step has no real link to an import page that doesn't exist yet (ADR-013)", async () => {
    mockedUpdateCurrentProfile.mockResolvedValue({} as never);
    render(<OnboardingFlow initialAltrName="My Altr" initialTone="balanced" />);

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(await screen.findByRole("button", { name: "Continue" }));

    await screen.findByRole("heading", { name: "Import your first conversation." });
    expect(screen.queryByRole("link", { name: /import/i })).not.toBeInTheDocument();
  });

  it("a save failure shows a calm inline error and keeps the user on the same step", async () => {
    mockedUpdateCurrentProfile.mockRejectedValue(new Error("network down"));
    render(<OnboardingFlow initialAltrName="My Altr" initialTone="balanced" />);

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save that");
    expect(screen.getByRole("heading", { name: "Give your Altr a name." })).toBeInTheDocument();
  });
});
