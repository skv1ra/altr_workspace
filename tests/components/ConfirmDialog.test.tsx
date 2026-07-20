import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("gives the cancel button initial focus", async () => {
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete this memory permanently"
      />,
    );
    const cancel = await screen.findByRole("button", { name: "Cancel" });
    expect(document.activeElement).toBe(cancel);
  });

  it("without typed confirmation, confirm is enabled and calls onConfirm", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open onClose={() => {}} onConfirm={onConfirm} title="Delete this memory permanently" />,
    );
    const confirm = await screen.findByRole("button", { name: "Delete" });
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("typed confirmation gate: confirm stays disabled until the exact phrase is typed", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Delete your account permanently"
        confirmLabel="Delete account"
        typedConfirmation={{ phrase: "DELETE MY ACCOUNT" }}
      />,
    );
    const confirm = await screen.findByRole("button", { name: "Delete account" });
    const input = screen.getByLabelText('Type "DELETE MY ACCOUNT" to confirm');

    expect(confirm).toBeDisabled();

    await userEvent.type(input, "delete my account");
    expect(confirm).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, "DELETE MY ACCOUNT");
    expect(confirm).toBeEnabled();

    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not close on backdrop click", async () => {
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Delete this memory permanently" />);
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(dialog.parentElement as HTMLElement);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("warns in development when the title is a generic 'are you sure' phrase", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Are you sure?" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("generic"));
    warn.mockRestore();
  });
});
