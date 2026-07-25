import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeletionRequestForm } from "@/components/app/privacy/DeletionRequestForm";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DeletionRequestForm", () => {
  it("requires the confirmation checkbox before submitting — never calls the endpoint without it", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<DeletionRequestForm lang="EN" />);
    await userEvent.type(screen.getByLabelText(/^Email/), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Confirm this request concerns your own data.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits the exact real POST /api/privacy/deletion-requests contract — { email, scope, reason, confirmed: true }", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 202, json: async () => ({ ok: true, reference: "DEL-XYZ789" }) }));
    vi.stubGlobal("fetch", fetchMock);
    render(<DeletionRequestForm lang="EN" />);

    await userEvent.type(screen.getByLabelText(/^Email/), "user@example.com");
    await userEvent.selectOptions(screen.getByLabelText("What to delete"), "memory");
    await userEvent.click(screen.getByLabelText("I confirm this request concerns my own data."));
    await userEvent.click(screen.getByRole("button", { name: "Submit request" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/privacy/deletion-requests",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", scope: "memory", reason: undefined, confirmed: true }),
      }),
    );
    // 046 a11y audit: was a plain styled <p>, invisible to screen-reader
    // heading navigation, until this prompt made it a real heading.
    expect(await screen.findByRole("heading", { name: "Request recorded." })).toBeInTheDocument();
    expect(screen.getByText("DEL-XYZ789")).toBeInTheDocument();
  });

  it("a 429 shows the rate-limit message, not the generic one", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 429, json: async () => ({ error: "RATE_LIMITED" }) })));
    render(<DeletionRequestForm lang="EN" />);
    await userEvent.type(screen.getByLabelText(/^Email/), "user@example.com");
    await userEvent.click(screen.getByLabelText("I confirm this request concerns my own data."));
    await userEvent.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests. Try again later.");
  });
});
