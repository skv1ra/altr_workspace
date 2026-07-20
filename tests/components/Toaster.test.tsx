import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/components/ui/Toast";
import { Toaster } from "@/components/ui/Toaster";

function clearAllToasts() {
  let current: Array<{ id: string }> = [];
  toast.subscribe((items) => {
    current = items;
  })();
  current.forEach((item) => toast.dismiss(item.id));
}

describe("Toaster", () => {
  beforeEach(() => {
    clearAllToasts();
  });

  it("renders a role=status announcement when a toast is pushed", () => {
    render(<Toaster />);
    act(() => {
      toast.push("Saved successfully");
    });
    expect(screen.getByRole("status")).toHaveTextContent("Saved successfully");
  });

  it("auto-dismisses after its duration", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast.push("Temporary", { duration: 1000 });
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("pauses auto-dismiss while hovered, then resumes on mouse leave", () => {
    vi.useFakeTimers();
    render(<Toaster />);
    act(() => {
      toast.push("Hover me", { duration: 1000 });
    });
    const card = screen.getByRole("status");

    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    fireEvent.mouseLeave(card);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("dismisses immediately via the dismiss button", async () => {
    render(<Toaster />);
    act(() => {
      toast.push("Dismiss me");
    });
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
