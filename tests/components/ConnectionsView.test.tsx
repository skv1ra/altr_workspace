import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionsView } from "@/components/app/connections/ConnectionsView";

vi.mock("next/navigation", () => ({
  usePathname: () => "/connections",
}));

const providerPayload = {
  providers: [
    { provider: "telegram", connectionId: null, displayName: null, status: "disconnected", connectedAt: null, lastSyncedAt: null, imports: 1, conversations: 1, messages: 12 },
    { provider: "gmail", connectionId: null, displayName: null, status: "disconnected", connectedAt: null, lastSyncedAt: null, imports: 0, conversations: 0, messages: 0 },
  ],
};

const inboxPayload = {
  items: [{
    id: "3cb5d4dc-92db-4cc1-bc21-4531c4e74d61",
    platform: "telegram",
    title: "Anna",
    participants: ["Anna"],
    lastMessageAt: "2026-07-31T10:00:00.000Z",
    latestMessage: { id: "m1", senderType: "contact", senderLabel: "Anna", content: "Can we meet tomorrow?", sentAt: "2026-07-31T10:00:00.000Z" },
    latestDraft: null,
    state: "needs_reply",
  }],
};

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

describe("ConnectionsView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows connected sources separately from the real reply queue", async () => {
    vi.spyOn(global, "fetch").mockImplementation((input) => {
      const path = String(input);
      return path.endsWith("/api/connections") ? json(providerPayload) : json(inboxPayload);
    });

    render(<ConnectionsView />);

    expect(screen.getByRole("heading", { level: 1, name: "Connections" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 3, name: "Anna" })).toBeInTheDocument();
    expect(screen.getByText("Can we meet tomorrow?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Import more" })).toHaveAttribute("href", "/import-conversations?provider=telegram");
    expect(screen.getByText("Needs reply")).toBeInTheDocument();
  });

  it("generates a Twin draft from the selected conversation and keeps it review-only", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      const path = String(input);
      if (path.endsWith("/api/connections")) return json(providerPayload);
      if (path.endsWith("/api/connections/inbox") && !init?.method) return json(inboxPayload);
      if (path.endsWith("/api/ai/draft-reply")) {
        return json({ assistantRunId: "run-1", draft: "Так, завтра мені підходить.", status: "draft" });
      }
      return json({ error: "NOT_FOUND" }, 404);
    });

    render(<ConnectionsView />);
    await screen.findByRole("heading", { level: 3, name: "Anna" });
    await userEvent.click(screen.getByRole("button", { name: "Generate draft" }));

    expect(await screen.findByText("Так, завтра мені підходить.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy draft" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/ai/draft-reply", expect.objectContaining({ method: "POST" }));
  });

  it("persists the handled state instead of removing the conversation", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      const path = String(input);
      if (path.endsWith("/api/connections")) return json(providerPayload);
      if (path.endsWith("/api/connections/inbox") && !init?.method) return json(inboxPayload);
      if (path.includes("/api/connections/inbox/") && init?.method === "PATCH") {
        return json({ conversationId: inboxPayload.items[0].id, replyTracking: { state: "up_to_date" } });
      }
      return json({ error: "NOT_FOUND" }, 404);
    });

    render(<ConnectionsView />);
    await screen.findByRole("heading", { level: 3, name: "Anna" });
    await userEvent.click(screen.getByRole("button", { name: "Mark handled" }));

    await waitFor(() => expect(screen.getByText("Handled", { selector: "span" })).toBeInTheDocument());
    expect(screen.getByRole("heading", { level: 3, name: "Anna" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/connections/inbox/${inboxPayload.items[0].id}`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
