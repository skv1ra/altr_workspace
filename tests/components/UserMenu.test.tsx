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

  it("renders the server-provided name, email, and plan badge, plus the sign-out control", () => {
    render(<UserMenu name="Max Golyba" email="max@example.com" plan="personal" />);

    expect(screen.getByText("Max Golyba")).toBeInTheDocument();
    expect(screen.getByText("max@example.com")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("keeps the full name/email in the title attribute for long values that CSS truncates visually", () => {
    const longName = "A Very Long Display Name That Would Overflow A Narrow Rail";
    const longEmail = "a.very.long.mailbox.name+tag@some-long-corporate-domain.example.com";
    render(<UserMenu name={longName} email={longEmail} plan="free" />);

    expect(screen.getByText(longName)).toHaveAttribute("title", longName);
    expect(screen.getByText(longEmail)).toHaveAttribute("title", longEmail);
  });

  it("switching language updates the plan badge and re-renders in Ukrainian", async () => {
    render(<UserMenu name="Max" email="max@example.com" plan="work" />);

    expect(screen.getByText("Work")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "UA" }));

    expect(screen.getByText("Робочий")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Вийти" })).toBeInTheDocument();
  });
});
