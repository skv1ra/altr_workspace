import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "@/components/ui/Dialog";

function Harness({
  closeOnBackdropClick,
}: {
  closeOnBackdropClick?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Example dialog"
        description="A description"
        closeOnBackdropClick={closeOnBackdropClick}
      >
        <button type="button">First</button>
        <button type="button">Last</button>
      </Dialog>
    </div>
  );
}

describe("Dialog", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("renders with dialog role, aria-modal, and aria-labelledby wired to the title", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Example dialog");
    expect(dialog).toHaveAccessibleDescription("A description");
  });

  it("traps focus: Tab from the last element wraps to the first, Shift+Tab from the first wraps to the last", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await screen.findByRole("dialog");

    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(first);

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(last);
  });

  it("closes on Escape", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on backdrop click when closeOnBackdropClick is true (default)", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(dialog.parentElement as HTMLElement);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does NOT close on backdrop click when closeOnBackdropClick is false", async () => {
    render(<Harness closeOnBackdropClick={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(dialog.parentElement as HTMLElement);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("restores focus to the trigger element on close", async () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
  });

  it("forbids stacked dialogs — opening a second Dialog while one is open throws", async () => {
    function TwoDialogs() {
      const [openA, setOpenA] = useState(true);
      const [openB, setOpenB] = useState(true);
      return (
        <>
          <Dialog open={openA} onClose={() => setOpenA(false)} title="A">
            <p>A</p>
          </Dialog>
          <Dialog open={openB} onClose={() => setOpenB(false)} title="B">
            <p>B</p>
          </Dialog>
        </>
      );
    }
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TwoDialogs />)).toThrow(/Stacked dialogs are forbidden/);
    consoleError.mockRestore();
  });
});
