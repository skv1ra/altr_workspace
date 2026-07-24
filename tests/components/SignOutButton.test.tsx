import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { toast } from "@/components/ui/Toast";
import { signOutAccount } from "@/lib/auth";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("@/lib/auth", () => ({
  signOutAccount: vi.fn(),
}));

const mockedSignOutAccount = vi.mocked(signOutAccount);

describe("SignOutButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("is disabled with aria-busy while the request is pending, and re-enabled once it resolves", async () => {
    let resolveSignOut: () => void = () => {};
    mockedSignOutAccount.mockReturnValue(
      new Promise((resolve) => {
        resolveSignOut = () => resolve(undefined);
      }),
    );
    render(<SignOutButton />);

    const button = screen.getByRole("button", { name: "Sign out" });
    await userEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    resolveSignOut();
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("is keyboard accessible: Enter triggers sign-out the same as a click", async () => {
    mockedSignOutAccount.mockResolvedValue(undefined);
    render(<SignOutButton />);

    screen.getByRole("button", { name: "Sign out" }).focus();
    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(mockedSignOutAccount).toHaveBeenCalledTimes(1));
  });

  it("on success: signs out, dispatches altr-auth-change so Header clears its in-memory signed-in state, shows a confirmation toast, and redirects home", async () => {
    mockedSignOutAccount.mockResolvedValue(undefined);
    const authChangeListener = vi.fn();
    window.addEventListener("altr-auth-change", authChangeListener);
    const pushSpy = vi.spyOn(toast, "push");

    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(refresh).toHaveBeenCalled();
    expect(authChangeListener).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledWith("You've been signed out.");

    window.removeEventListener("altr-auth-change", authChangeListener);
    pushSpy.mockRestore();
  });

  it("on failure: shows a calm error toast instead of navigating away or throwing", async () => {
    mockedSignOutAccount.mockRejectedValue(new Error("network down"));
    const pushSpy = vi.spyOn(toast, "push");

    render(<SignOutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(pushSpy).toHaveBeenCalledWith("Couldn't sign out — please try again."));
    expect(replace).not.toHaveBeenCalled();

    pushSpy.mockRestore();
  });
});
