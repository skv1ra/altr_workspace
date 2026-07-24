import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getCurrentProfile, resetPassword } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getCurrentProfile: vi.fn(),
  resetPassword: vi.fn(),
}));

const mockedGetCurrentProfile = vi.mocked(getCurrentProfile);
const mockedResetPassword = vi.mocked(resetPassword);

describe("ResetPasswordForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the designed invalid/expired-link state, with a path back to forgot-password, when no recovery session exists on load", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<ResetPasswordForm />);

    expect(await screen.findByText("This link is invalid or has expired")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute("href", "/auth/forgot-password");
    expect(screen.queryByLabelText(/^Password/)).not.toBeInTheDocument();
  });

  it("shows the password form once a valid recovery session is confirmed", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    render(<ResetPasswordForm />);

    expect(await screen.findByRole("heading", { name: "Choose a new password" })).toBeInTheDocument();
    // Both fields use "new-password" (not "current-password") — the
    // autocomplete token password managers use to recognize a two-field
    // "set a new password" form and offer to fill/generate accordingly.
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText(/^Confirm password/)).toHaveAttribute("autocomplete", "new-password");
  });

  it("rejects mismatched passwords client-side without ever calling the server", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    render(<ResetPasswordForm />);
    await screen.findByRole("heading", { name: "Choose a new password" });

    await userEvent.type(screen.getByLabelText(/^Password/), "realpassword1");
    await userEvent.type(screen.getByLabelText(/^Confirm password/), "differentpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords don't match.");
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it("shows the success state with a sign-in path after a successful reset, without a silent redirect", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    mockedResetPassword.mockResolvedValue({ ok: true });
    render(<ResetPasswordForm />);
    await screen.findByRole("heading", { name: "Choose a new password" });

    await userEvent.type(screen.getByLabelText(/^Password/), "realpassword1");
    await userEvent.type(screen.getByLabelText(/^Confirm password/), "realpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));

    await waitFor(() => expect(screen.getByText("Password updated")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Continue to your Altr" })).toHaveAttribute("href", "/dashboard");
  });

  it("falls back to the invalid-link state if the session expires between load and submit", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    mockedResetPassword.mockRejectedValue(new Error("RESET_SESSION_REQUIRED"));
    render(<ResetPasswordForm />);
    await screen.findByRole("heading", { name: "Choose a new password" });

    await userEvent.type(screen.getByLabelText(/^Password/), "realpassword1");
    await userEvent.type(screen.getByLabelText(/^Confirm password/), "realpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByText("This link is invalid or has expired")).toBeInTheDocument();
  });

  it("shows the calm rate-limited copy (not the invalid-link state) for the exact 429 string the route throws", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    mockedResetPassword.mockRejectedValue(new Error("Забагато спроб. Спробуй пізніше."));
    render(<ResetPasswordForm />);
    await screen.findByRole("heading", { name: "Choose a new password" });

    await userEvent.type(screen.getByLabelText(/^Password/), "realpassword1");
    await userEvent.type(screen.getByLabelText(/^Confirm password/), "realpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
  });

  it("shows a generic (non-enumerating) error for any other reset failure", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    mockedResetPassword.mockRejectedValue(new Error("Не вдалося оновити пароль."));
    render(<ResetPasswordForm />);
    await screen.findByRole("heading", { name: "Choose a new password" });

    await userEvent.type(screen.getByLabelText(/^Password/), "realpassword1");
    await userEvent.type(screen.getByLabelText(/^Confirm password/), "realpassword1");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't complete that");
  });

  it("a rapid double-click on save password only triggers one reset request (double-submit guard)", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    let resolveReset: () => void = () => {};
    mockedResetPassword.mockReturnValue(
      new Promise((resolve) => {
        resolveReset = () => resolve({ ok: true });
      }),
    );
    render(<ResetPasswordForm />);
    await screen.findByRole("heading", { name: "Choose a new password" });

    await userEvent.type(screen.getByLabelText(/^Password/), "realpassword1");
    await userEvent.type(screen.getByLabelText(/^Confirm password/), "realpassword1");
    const submit = screen.getByRole("button", { name: "Save password" });
    await userEvent.click(submit);
    await userEvent.click(submit);
    resolveReset();

    await waitFor(() => expect(screen.getByText("Password updated")).toBeInTheDocument());
    expect(mockedResetPassword).toHaveBeenCalledTimes(1);
  });
});
