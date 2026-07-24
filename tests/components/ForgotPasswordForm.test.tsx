import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { requestPasswordReset } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  requestPasswordReset: vi.fn(),
}));

const mockedRequestPasswordReset = vi.mocked(requestPasswordReset);

async function submit(email: string) {
  await userEvent.type(screen.getByLabelText(/^Email/), email);
  await userEvent.click(screen.getByRole("button", { name: "Send instructions" }));
}

describe("ForgotPasswordForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the same neutral 'check your email' confirmation whether or not the account exists", async () => {
    mockedRequestPasswordReset.mockResolvedValue({ ok: true, message: "irrelevant" });
    render(<ForgotPasswordForm />);

    await submit("real@example.com");

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("recovery link is on its way");
  });

  it("shows the exact same neutral confirmation even when the server call itself fails (non-rate-limit), never disclosing account existence", async () => {
    mockedRequestPasswordReset.mockRejectedValue(new Error("REQUEST_FAILED_500"));
    render(<ForgotPasswordForm />);

    await submit("unknown@example.com");

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
  });

  it("shows a rate-limited error instead of the neutral confirmation for the one distinguishable 429 case", async () => {
    mockedRequestPasswordReset.mockRejectedValue(new Error("REQUEST_FAILED_429"));
    render(<ForgotPasswordForm />);

    await submit("real@example.com");

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });

  it("links back to sign-in from both the form and the sent state", async () => {
    mockedRequestPasswordReset.mockResolvedValue({ ok: true, message: "irrelevant" });
    render(<ForgotPasswordForm />);

    expect(screen.getByRole("link", { name: "Return to sign in" })).toHaveAttribute("href", "/auth?mode=login");

    await submit("real@example.com");

    expect(await screen.findByRole("link", { name: "Return to sign in" })).toHaveAttribute("href", "/auth?mode=login");
  });

  it("a rapid double-click on submit only triggers one recovery request (double-submit guard)", async () => {
    let resolveRequest: () => void = () => {};
    mockedRequestPasswordReset.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve({ ok: true, message: "irrelevant" });
      }),
    );
    render(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText(/^Email/), "real@example.com");
    const button = screen.getByRole("button", { name: "Send instructions" });
    await userEvent.click(button);
    await userEvent.click(button);
    resolveRequest();

    await screen.findByText("Check your email");
    expect(mockedRequestPasswordReset).toHaveBeenCalledTimes(1);
  });
});
