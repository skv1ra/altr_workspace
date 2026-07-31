import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/components/app/UserMenu";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, signOutAccount: vi.fn() };
});

describe("UserMenu", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders the server-provided name and plan text, plus the sign-out control", () => {
    render(<UserMenu name="Max Golyba" email="max@example.com" plan="personal" />);

    expect(screen.getByText("Max Golyba")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("keeps the full email in the name's title attribute for a hover/AT reveal — matches the design's own markup, which shows name+plan only, no separate email line", () => {
    const longName = "A Very Long Display Name That Would Overflow A Narrow Rail";
    const longEmail = "a.very.long.mailbox.name+tag@some-long-corporate-domain.example.com";
    render(<UserMenu name={longName} email={longEmail} plan="free" />);

    expect(screen.getByText(longName)).toHaveAttribute("title", longEmail);
  });

  it("switching language updates the plan text and re-renders in Ukrainian", async () => {
    render(<UserMenu name="Max" email="max@example.com" plan="work" />);

    expect(screen.getByText("Work")).toBeInTheDocument();
    // The language row is labeled with the *other* language (design's own
    // "shows what you'll switch to" treatment) — starts as "Українська".
    await userEvent.click(screen.getByRole("button", { name: "Українська" }));

    expect(screen.getByText("Робочий")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Вийти" })).toBeInTheDocument();
  });

  it("theme row toggles the label between the two modes", async () => {
    render(<UserMenu name="Max" email="max@example.com" plan="free" />);

    const themeRow = screen.getByRole("button", { name: "Light mode" });
    await userEvent.click(themeRow);

    expect(screen.getByRole("button", { name: "Dark mode" })).toBeInTheDocument();
  });
});
