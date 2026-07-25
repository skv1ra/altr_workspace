import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { COOKIE_PREFERENCES_KEY } from "@/lib/legal/cookie-store";

describe("CookieConsent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it("shows the banner on a fresh profile with no stored preference — decline-by-default until a real choice is saved", async () => {
    render(<CookieConsent />);
    expect(await screen.findByText("Your privacy controls")).toBeInTheDocument();
    // Nothing saved yet — the security requirement this test exists for.
    expect(window.localStorage.getItem(COOKIE_PREFERENCES_KEY)).toBeNull();
  });

  it("never shows the banner when a preference is already stored", () => {
    window.localStorage.setItem(
      COOKIE_PREFERENCES_KEY,
      JSON.stringify({ necessary: true, functional: true, analytics: false, marketing: false, version: "1", timestamp: new Date().toISOString(), source: "banner" }),
    );
    render(<CookieConsent />);
    expect(screen.queryByText("Your privacy controls")).not.toBeInTheDocument();
  });

  it("accept and reject are equal-weight controls (same button variant, neither styled as more prominent) — no dark pattern", async () => {
    render(<CookieConsent />);
    const accept = await screen.findByRole("button", { name: "Accept functional" });
    const reject = screen.getByRole("button", { name: "Reject non-essential" });
    expect(accept.className).toBe(reject.className);
  });

  it("accepting saves functional:true and dismisses the banner", async () => {
    render(<CookieConsent />);
    const accept = await screen.findByRole("button", { name: "Accept functional" });
    await userEvent.click(accept);

    expect(screen.queryByText("Your privacy controls")).not.toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem(COOKIE_PREFERENCES_KEY) ?? "null");
    expect(saved).toMatchObject({ necessary: true, functional: true, analytics: false, marketing: false });
  });

  it("rejecting saves functional:false and dismisses the banner — non-essential storage never turns on by default", async () => {
    render(<CookieConsent />);
    const reject = await screen.findByRole("button", { name: "Reject non-essential" });
    await userEvent.click(reject);

    const saved = JSON.parse(window.localStorage.getItem(COOKIE_PREFERENCES_KEY) ?? "null");
    expect(saved).toMatchObject({ functional: false, analytics: false, marketing: false });
  });

  it("customize opens a dialog listing all four categories, with analytics/marketing shown as genuinely unavailable, not toggleable", async () => {
    render(<CookieConsent />);
    const customize = await screen.findByRole("button", { name: "Customize" });
    await userEvent.click(customize);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Cookie & storage preferences");
    expect(screen.getByText("Strictly necessary")).toBeInTheDocument();
    expect(screen.getByText("Functional")).toBeInTheDocument();
    expect(screen.getAllByText("Not in use").length).toBe(2);
    // Necessary always on, never a switch (no way to turn off required storage).
    expect(screen.queryByRole("switch", { name: "Strictly necessary" })).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Functional" })).toBeInTheDocument();
  });

  it("saving from the customize dialog persists the toggled functional choice", async () => {
    render(<CookieConsent />);
    await userEvent.click(await screen.findByRole("button", { name: "Customize" }));
    await userEvent.click(await screen.findByRole("switch", { name: "Functional" }));
    await userEvent.click(screen.getByRole("button", { name: "Save preferences" }));

    const saved = JSON.parse(window.localStorage.getItem(COOKIE_PREFERENCES_KEY) ?? "null");
    expect(saved).toMatchObject({ functional: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("re-opening preferences via the altr-open-cookie-preferences event (Footer's real button) opens the dialog even with the banner already dismissed", async () => {
    window.localStorage.setItem(
      COOKIE_PREFERENCES_KEY,
      JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, version: "1", timestamp: new Date().toISOString(), source: "banner" }),
    );
    render(<CookieConsent />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    window.dispatchEvent(new Event("altr-open-cookie-preferences"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
