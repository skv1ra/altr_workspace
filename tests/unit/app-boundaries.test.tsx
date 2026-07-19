import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import ErrorBoundary from "@/app/error";
import NotFound from "@/app/not-found";

describe("app boundaries", () => {
  it("renders the not-found headline and a link home", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /this page doesn.t exist/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });

  it("renders the error boundary headline and retries on click", async () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={Object.assign(new Error("boom"), { digest: "abc123" })} reset={reset} />);

    expect(screen.getByRole("heading", { name: /this page hit a snag/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
