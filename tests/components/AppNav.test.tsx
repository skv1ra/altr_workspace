import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppNav } from "@/components/app/AppNav";

let mockPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, signOutAccount: vi.fn() };
});

describe("AppNav", () => {
  afterEach(() => {
    mockPathname = "/dashboard";
  });

  it("marks the current destination active via aria-current=page", () => {
    render(<AppNav name="Max" email="max@example.com" plan="free" />);

    const rail = screen.getByRole("navigation", { name: "Product navigation" });
    const dashboardLink = within(rail).getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
  });

  it("does not mark Dashboard active when the current route is unrelated", () => {
    mockPathname = "/pricing";
    render(<AppNav name="Max" email="max@example.com" plan="free" />);

    const rail = screen.getByRole("navigation", { name: "Product navigation" });
    expect(within(rail).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("opens the mobile bottom sheet from the menu trigger, showing the same nav destination and the user identity area", async () => {
    render(<AppNav name="Max" email="max@example.com" plan="free" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(sheet).getByText("max@example.com")).toBeInTheDocument();
  });

  it("home wordmark links to /", () => {
    render(<AppNav name="Max" email="max@example.com" plan="free" />);
    expect(screen.getAllByRole("link", { name: "Altr" })[0]).toHaveAttribute("href", "/");
  });
});
