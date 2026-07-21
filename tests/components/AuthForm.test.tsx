import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentProfile, registerAccount, signInAccount } from "@/lib/auth";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentProfile: vi.fn(),
  registerAccount: vi.fn(),
  signInAccount: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

const mockedGetCurrentProfile = vi.mocked(getCurrentProfile);
const mockedRegisterAccount = vi.mocked(registerAccount);
const mockedSignInAccount = vi.mocked(signInAccount);

async function fillCredentials(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(/^Email/), email);
  await userEvent.type(screen.getByLabelText(/^Password/), password);
}

async function checkAllConsents() {
  await userEvent.click(screen.getByText("Privacy and processing permissions"));
  for (const checkbox of screen.getAllByRole("checkbox")) {
    await userEvent.click(checkbox);
  }
}

describe("AuthForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to register mode with the New account heading and mode-switch preserves typed input", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<AuthForm initialMode="register" next="/dashboard" />);

    expect(screen.getByRole("heading", { name: "Create your Altr" })).toBeInTheDocument();
    await fillCredentials("keep-me@example.com", "keepme123");

    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByRole("heading", { name: "Return to your Altr" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toHaveValue("keep-me@example.com");
    expect(screen.getByLabelText(/^Password/)).toHaveValue("keepme123");
  });

  it("shows a role=alert validation error for an invalid email without ever calling the server", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<AuthForm initialMode="login" next="/dashboard" />);

    await fillCredentials("not-an-email", "somepassword");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address.");
    expect(mockedSignInAccount).not.toHaveBeenCalled();
  });

  it("requires all three consent checkboxes before registering", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<AuthForm initialMode="register" next="/dashboard" />);

    await fillCredentials("real@example.com", "realpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Confirm all three permissions");
    expect(mockedRegisterAccount).not.toHaveBeenCalled();
  });

  it("disables the submit button (aria-busy) while the request is pending, preventing double submit", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    let resolveSignIn: (value: { ok: true }) => void = () => {};
    mockedSignInAccount.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    render(<AuthForm initialMode="login" next="/dashboard" />);

    await fillCredentials("real@example.com", "realpassword1");
    const submit = screen.getByRole("button", { name: "Log in" });
    await userEvent.click(submit);

    await waitFor(() => {
      expect(submit).toBeDisabled();
      expect(submit).toHaveAttribute("aria-busy", "true");
    });

    resolveSignIn({ ok: true });
    await waitFor(() => expect(submit).not.toBeDisabled());
  });

  it("shows the calm rate-limited copy for the exact 429 string both auth routes throw, not the raw generic message", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    mockedSignInAccount.mockRejectedValue(new Error("Забагато спроб. Спробуй пізніше."));
    render(<AuthForm initialMode="login" next="/dashboard" />);

    await fillCredentials("real@example.com", "realpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
  });

  it("shows a generic (non-enumerating) error for any other server failure", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    mockedSignInAccount.mockRejectedValue(new Error("Не вдалося увійти. Перевір дані й спробуй ще раз."));
    render(<AuthForm initialMode="login" next="/dashboard" />);

    await fillCredentials("real@example.com", "realpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't complete that");
  });

  it("redirects an already-authenticated visitor straight to /dashboard", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    render(<AuthForm initialMode="register" next="/dashboard" />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("navigates to the resolved next path after a successful login", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    mockedSignInAccount.mockResolvedValue({ ok: true });
    render(<AuthForm initialMode="login" next="/pricing" />);

    await fillCredentials("real@example.com", "realpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/pricing"));
  });

  it("shows the email-verification notice (role=status) and does not navigate when registration requires it", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    mockedRegisterAccount.mockResolvedValue({ ok: true, requiresEmailVerification: true });
    render(<AuthForm initialMode="register" next="/dashboard" />);

    await fillCredentials("real@example.com", "realpassword1");
    await checkAllConsents();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Check your email");
    expect(replace).not.toHaveBeenCalled();
  });

  it("the terms consent checkbox links to the real /terms and /privacy pages", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<AuthForm initialMode="register" next="/dashboard" />);

    await userEvent.click(screen.getByText("Privacy and processing permissions"));
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });
});
