import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/site/Footer";
import { getCurrentProfile } from "@/lib/auth";
import { openCookiePreferences } from "@/lib/legal/cookie-store";

vi.mock("@/lib/auth", () => ({
  getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/legal/cookie-store", () => ({
  openCookiePreferences: vi.fn(),
}));

const mockedGetCurrentProfile = vi.mocked(getCurrentProfile);

describe("Footer", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_X_URL;
    delete process.env.NEXT_PUBLIC_GITHUB_URL;
  });

  it("renders a link inventory of Product, Legal, and language columns with no column exceeding 5 links", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<Footer />);

    const productNav = screen.getByRole("navigation", { name: "Product" });
    expect(within(productNav).getByRole("link", { name: "Product" })).toHaveAttribute("href", "/#product");
    expect(within(productNav).getByRole("link", { name: "How it works" })).toHaveAttribute("href", "/#how-it-works");
    expect(within(productNav).getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
    expect(within(productNav).getAllByRole("link")).toHaveLength(3);

    const legalNav = screen.getByRole("navigation", { name: "Legal" });
    expect(within(legalNav).getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(within(legalNav).getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(within(legalNav).getByRole("link", { name: "Cookies" })).toHaveAttribute("href", "/cookies");
    expect(within(legalNav).getByRole("button", { name: "Cookie preferences" })).toBeInTheDocument();
    expect(within(legalNav).getAllByRole("link")).toHaveLength(3);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Log in" })[0]).toHaveAttribute("href", "/auth?mode=login");
    });
  });

  it("swaps Log in / Create your Altr for Dashboard once signed in", async () => {
    mockedGetCurrentProfile.mockResolvedValue({ id: "u1" } as never);
    render(<Footer />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    });
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create your Altr" })).not.toBeInTheDocument();
  });

  it("calls openCookiePreferences when the cookie preferences control is used", async () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<Footer />);

    await userEvent.click(screen.getByRole("button", { name: "Cookie preferences" }));
    expect(openCookiePreferences).toHaveBeenCalledTimes(1);
  });

  it("omits social links entirely when their env vars are unset (no dead # hrefs)", () => {
    mockedGetCurrentProfile.mockResolvedValue(null);
    render(<Footer />);
    expect(screen.queryByRole("link", { name: "X" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
  });
});
