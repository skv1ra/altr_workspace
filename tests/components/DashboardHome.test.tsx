import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardHome } from "@/components/app/DashboardHome";

describe("DashboardHome", () => {
  it("shows the designed empty-account state for a brand-new account (all zeros), not the editorial rows", () => {
    render(
      <DashboardHome
        name="Max Golyba"
        plan="free"
        memoryCount={0}
        memoryLimit={250}
        draftsUsed={0}
        draftsLimit={10}
        draftsError={false}
        lastImport={null}
        lastImportError={false}
      />,
    );

    expect(screen.getByText("Hi, Max.")).toBeInTheDocument();
    expect(screen.getByText("Your Altr is just getting started.")).toBeInTheDocument();
    expect(screen.queryByText("Imports")).not.toBeInTheDocument();
    expect(screen.queryByText("Twin")).not.toBeInTheDocument();
    // 046 a11y audit: the greeting is this page's only heading (`AppShell`'s
    // own doc comment) — it was a plain styled <p>, invisible to
    // screen-reader heading navigation, until this prompt made it a real h1.
    expect(screen.getByRole("heading", { level: 1, name: "Hi, Max." })).toBeInTheDocument();
  });

  it("shows three editorial status rows with real numerals for a populated account", () => {
    render(
      <DashboardHome
        name="Max Golyba"
        plan="free"
        memoryCount={42}
        memoryLimit={250}
        draftsUsed={3}
        draftsLimit={10}
        draftsError={false}
        lastImport={{ status: "completed", platform: "telegram", createdAt: "2026-07-01T00:00:00.000Z" }}
        lastImportError={false}
      />,
    );

    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText(/telegram/)).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.queryByText("Your Altr is just getting started.")).not.toBeInTheDocument();
  });

  it("shows the no-imports-yet row copy when the account has activity but has never imported", () => {
    render(
      <DashboardHome
        name="Max"
        plan="free"
        memoryCount={5}
        memoryLimit={250}
        draftsUsed={0}
        draftsLimit={10}
        draftsError={false}
        lastImport={null}
        lastImportError={false}
      />,
    );

    expect(screen.getByText("No imports yet.")).toBeInTheDocument();
  });

  it("shows a graceful unknown ('—'), not a spinner or a misleading zero, when a row's own query failed", () => {
    render(
      <DashboardHome
        name="Max"
        plan="free"
        memoryCount={0}
        memoryLimit={250}
        draftsUsed={0}
        draftsLimit={10}
        draftsError={true}
        lastImport={null}
        lastImportError={true}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.queryByText("Your Altr is just getting started.")).not.toBeInTheDocument();
  });

  it("switches to Ukrainian copy for the greeting and empty state", () => {
    window.localStorage.setItem("altr_cookie_preferences_v1", JSON.stringify({ necessary: true, functional: true, analytics: false, marketing: false, version: "1", timestamp: "", source: "banner" }));
    window.localStorage.setItem("altr_language_v1", "UA");
    render(
      <DashboardHome
        name="Макс"
        plan="free"
        memoryCount={0}
        memoryLimit={250}
        draftsUsed={0}
        draftsLimit={10}
        draftsError={false}
        lastImport={null}
        lastImportError={false}
      />,
    );

    expect(screen.getByText("Привіт, Макс.")).toBeInTheDocument();
    expect(screen.getByText("Твій Altr щойно починається.")).toBeInTheDocument();
    window.localStorage.clear();
  });
});
