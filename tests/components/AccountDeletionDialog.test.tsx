import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountDeletionDialog } from "@/components/app/privacy/AccountDeletionDialog";

vi.mock("@/lib/auth", () => ({ signOutAccount: vi.fn(async () => undefined) }));

function stubFetch(response: { ok: boolean; status?: number; body: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: response.ok, status: response.status ?? (response.ok ? 200 : 500), json: async () => response.body })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("AccountDeletionDialog", () => {
  it("shows the consequences step first, real content, not a generic 'are you sure'", async () => {
    render(<AccountDeletionDialog open onClose={() => {}} lang="EN" />);
    expect(await screen.findByRole("dialog")).toHaveTextContent("Delete your Altr account permanently?");
    expect(screen.getByText(/imported conversations, messages, memories/i)).toBeInTheDocument();
    expect(screen.getByText(/anonymized billing\/order records/i)).toBeInTheDocument();
  });

  it("deletion gate: confirm stays disabled until email is entered AND the exact literal phrase is typed — no partial match", async () => {
    stubFetch({ ok: true, body: { ok: true, reference: "DEL-ABC123" } });
    render(<AccountDeletionDialog open onClose={() => {}} lang="EN" />);
    await userEvent.click(await screen.findByRole("button", { name: "Continue" }));

    const confirm = screen.getByRole("button", { name: "Permanently delete my account" });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Your account email"), "user@example.com");
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Type "DELETE MY ACCOUNT" to confirm'), "delete my account");
    expect(confirm).toBeDisabled();

    await userEvent.clear(screen.getByLabelText('Type "DELETE MY ACCOUNT" to confirm'));
    await userEvent.type(screen.getByLabelText('Type "DELETE MY ACCOUNT" to confirm'), "DELETE MY ACCOUNT");
    expect(confirm).toBeEnabled();
  });

  it("submitting sends the exact real contract to DELETE /api/privacy/account and signs the user out on success", async () => {
    const { signOutAccount } = await import("@/lib/auth");
    stubFetch({ ok: true, body: { ok: true, reference: "DEL-ABC123" } });
    render(<AccountDeletionDialog open onClose={() => {}} lang="EN" />);
    await userEvent.click(await screen.findByRole("button", { name: "Continue" }));
    await userEvent.type(screen.getByLabelText("Your account email"), "user@example.com");
    await userEvent.type(screen.getByLabelText('Type "DELETE MY ACCOUNT" to confirm'), "DELETE MY ACCOUNT");
    await userEvent.click(screen.getByRole("button", { name: "Permanently delete my account" }));

    // 046 a11y audit: was a plain styled <p>, now a real heading nested
    // under the Dialog's own h2 title.
    expect(await screen.findByRole("heading", { level: 3, name: "Account deleted." })).toBeInTheDocument();
    expect(screen.getByText("DEL-ABC123")).toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "/api/privacy/account",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ email: "user@example.com", confirmation: "DELETE MY ACCOUNT", reason: undefined }),
      }),
    );
    expect(signOutAccount).toHaveBeenCalledTimes(1);
  });

  it("a stale-session 403 (the real e2e/short-lived-session case) shows the exact honest reason, never a generic failure", async () => {
    stubFetch({ ok: false, status: 403, body: { error: "Please sign in again before deleting your account." } });
    render(<AccountDeletionDialog open onClose={() => {}} lang="EN" />);
    await userEvent.click(await screen.findByRole("button", { name: "Continue" }));
    await userEvent.type(screen.getByLabelText("Your account email"), "user@example.com");
    await userEvent.type(screen.getByLabelText('Type "DELETE MY ACCOUNT" to confirm'), "DELETE MY ACCOUNT");
    await userEvent.click(screen.getByRole("button", { name: "Permanently delete my account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please sign in again before deleting your account.");
  });

  it("a 429 shows the rate-limit message, not the generic one", async () => {
    stubFetch({ ok: false, status: 429, body: { error: "Too many deletion attempts. Try again later." } });
    render(<AccountDeletionDialog open onClose={() => {}} lang="EN" />);
    await userEvent.click(await screen.findByRole("button", { name: "Continue" }));
    await userEvent.type(screen.getByLabelText("Your account email"), "user@example.com");
    await userEvent.type(screen.getByLabelText('Type "DELETE MY ACCOUNT" to confirm'), "DELETE MY ACCOUNT");
    await userEvent.click(screen.getByRole("button", { name: "Permanently delete my account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many deletion attempts. Try again later.");
  });

  it("cancel at the consequences step closes without calling the delete endpoint", async () => {
    stubFetch({ ok: true, body: { ok: true } });
    const onClose = vi.fn();
    render(<AccountDeletionDialog open onClose={onClose} lang="EN" />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
