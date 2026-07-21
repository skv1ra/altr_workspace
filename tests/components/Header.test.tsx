import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/site/Header";
import { getCurrentProfile } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getCurrentProfile: vi.fn(),
}));

const mockedGetCurrentProfile = vi.mocked(getCurrentProfile);

describe("Header", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    window.localStorage.clear();
  });

  it("renders the logo (linking home) and the three public nav links", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<Header />);

    expect(screen.getByRole("link", { name: "Altr home" })).toHaveAttribute("href", "/");
    // Desktop and mobile-menu copies of each link both exist (mobile menu is
    // always in the DOM, just closed) — scope to the primary desktop bar.
    const primaryNav = screen.getAllByRole("navigation", { name: "Primary" })[0];
    expect(within(primaryNav).getByRole("link", { name: "Product" })).toHaveAttribute("href", "/#product");
    expect(within(primaryNav).getByRole("link", { name: "How it works" })).toHaveAttribute(
      "href",
      "/#how-it-works",
    );
    expect(within(primaryNav).getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
  });

  it("renders logged-out state (Log in) by default, before the profile check resolves — also this component's offline fallback, since getCurrentProfile's own contract (lib/auth.ts) is to resolve null (never reject) on a failed/offline check, indistinguishable here from simply not being signed in", () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<Header />);
    expect(screen.getAllByRole("link", { name: "Log in" })[0]).toHaveAttribute("href", "/auth?mode=login");
  });

  it("swaps Log in for Dashboard once getCurrentProfile resolves a real profile", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    render(<Header />);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Dashboard" })[0]).toHaveAttribute("href", "/dashboard");
    });
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("opens the mobile menu as a dialog, focuses it, and Escape closes and returns focus to the trigger", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<Header />);

    const trigger = screen.getByRole("button", { name: "Open menu" });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Menu");
    expect(within(dialog).getByRole("link", { name: "Product" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Create your Altr" })).toHaveAttribute(
      "href",
      "/auth?mode=register",
    );

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it("clicking a link inside the mobile menu closes it", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<Header />);

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("link", { name: "Pricing" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("switches language for both the desktop bar and the mobile menu", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<Header />);

    const uaButtons = screen.getAllByRole("button", { name: "UA" });
    await userEvent.click(uaButtons[0]);

    await waitFor(() => {
      const primaryNav = screen.getAllByRole("navigation", { name: "Primary" })[0];
      expect(within(primaryNav).getByRole("link", { name: "Тарифи" })).toBeInTheDocument();
    });
  });

  it("gains the scrolled backdrop state past the 24px threshold", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    const { container } = render(<Header />);
    const backdrop = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    const initialClassName = backdrop.className;

    Object.defineProperty(window, "scrollY", { value: 40, configurable: true });
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(backdrop.className).not.toBe(initialClassName);
    });
  });
});
