import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Menu } from "@/components/ui/Menu";

const items = [
  { id: "a", label: "Alpha", onSelect: vi.fn() },
  { id: "b", label: "Beta", onSelect: vi.fn() },
  { id: "c", label: "Gamma", onSelect: vi.fn() },
];

describe("Menu", () => {
  it("opens on click and shows a role=menu panel", async () => {
    render(<Menu label="Actions" items={items} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu", { name: "Actions" })).toBeInTheDocument();
  });

  it("closes on outside click", async () => {
    render(
      <div>
        <Menu label="Actions" items={items} />
        <button type="button">Outside</button>
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    render(<Menu label="Actions" items={items} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("ArrowDown moves focus through items", async () => {
    render(<Menu label="Actions" items={items} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Alpha" }));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Beta" }));
  });

  it("selecting an item calls onSelect, closes the menu, and refocuses the trigger", async () => {
    const onSelect = vi.fn();
    const localItems = [{ id: "x", label: "Do it", onSelect }];
    render(<Menu label="Actions" items={localItems} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Do it" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});
