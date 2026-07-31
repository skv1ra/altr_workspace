import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardHome } from "@/components/app/DashboardHome";

const baseProps = {
  name: "Max Golyba",
  plan: "free" as const,
  memoryCount: 0,
  memoryLimit: 250,
  draftsUsed: 0,
  draftsLimit: 10,
  draftsError: false,
  importsUsed: 0,
  importsLimit: 1,
  importsError: false,
  lastImport: null,
  lastImportError: false,
  recentMemories: [],
};

describe("DashboardHome", () => {
  it("shows the designed empty-account state for a brand-new account (all zeros), not the hero/stat cards", () => {
    render(<DashboardHome {...baseProps} />);

    expect(screen.getByText("Hi, Max.")).toBeInTheDocument();
    expect(screen.getByText("Your Altr is just getting started.")).toBeInTheDocument();
    expect(screen.queryByTestId("stat-imports")).not.toBeInTheDocument();
    expect(screen.queryByTestId("stat-drafts")).not.toBeInTheDocument();
    // 046 a11y audit: the greeting is this page's only heading (`AppShell`'s
    // own doc comment) — it was a plain styled <p>, invisible to
    // screen-reader heading navigation, until this prompt made it a real h1.
    expect(screen.getByRole("heading", { level: 1, name: "Hi, Max." })).toBeInTheDocument();
  });

  it("shows the hero card and three stat tiles with real numerals for a populated account", () => {
    render(
      <DashboardHome
        {...baseProps}
        memoryCount={42}
        draftsUsed={3}
        importsUsed={1}
        lastImport={{ status: "completed", platform: "telegram", createdAt: "2026-07-01T00:00:00.000Z" }}
      />,
    );

    expect(screen.getByTestId("stat-memories")).toHaveTextContent("42");
    expect(screen.getByTestId("stat-memories")).toHaveTextContent("250");
    expect(screen.getByTestId("stat-drafts")).toHaveTextContent("3");
    expect(screen.getByTestId("stat-drafts")).toHaveTextContent("10");
    expect(screen.getByTestId("stat-imports")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-imports")).toHaveTextContent(/telegram/);
    expect(screen.queryByText("Your Altr is just getting started.")).not.toBeInTheDocument();
  });

  it("shows the no-imports-yet copy on the imports tile when the account has activity but has never imported", () => {
    render(<DashboardHome {...baseProps} memoryCount={5} />);

    expect(screen.getByTestId("stat-imports")).toHaveTextContent("No imports yet.");
  });

  it("shows a graceful unknown ('—'), not a spinner or a misleading zero, when a tile's own query failed", () => {
    render(<DashboardHome {...baseProps} memoryCount={5} draftsError={true} importsError={true} />);

    expect(screen.getByTestId("stat-drafts")).toHaveTextContent("—");
    expect(screen.getByTestId("stat-imports")).toHaveTextContent("—");
    expect(screen.queryByText("Your Altr is just getting started.")).not.toBeInTheDocument();
  });

  it("lists recently learned memories when present, and a quiet empty note when not", () => {
    const { rerender } = render(<DashboardHome {...baseProps} memoryCount={2} />);
    expect(screen.getByText("Nothing learned yet.")).toBeInTheDocument();

    rerender(
      <DashboardHome
        {...baseProps}
        memoryCount={2}
        recentMemories={[{ id: "m1", title: "Prefers short replies", category: "preference", confidence: 0.88 }]}
      />,
    );
    expect(screen.getByText("Prefers short replies")).toBeInTheDocument();
    expect(screen.getByText("preference")).toBeInTheDocument();
    expect(screen.getByText(/88%/)).toBeInTheDocument();
  });

  it("switches to Ukrainian copy for the greeting and empty state", () => {
    window.localStorage.setItem("altr_cookie_preferences_v1", JSON.stringify({ necessary: true, functional: true, analytics: false, marketing: false, version: "1", timestamp: "", source: "banner" }));
    window.localStorage.setItem("altr_language_v1", "UA");
    render(<DashboardHome {...baseProps} name="Макс" />);

    expect(screen.getByText("Привіт, Макс.")).toBeInTheDocument();
    expect(screen.getByText("Твій Altr щойно починається.")).toBeInTheDocument();
    window.localStorage.clear();
  });
});
