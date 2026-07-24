import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSessionExpired } from "@/lib/auth";
import { toast } from "@/components/ui/Toast";

/** jsdom's `window.location.assign` isn't configurable enough for `vi.spyOn`
 *  directly — replace the whole `location` object with a spreadable stand-in
 *  (this workspace's first test to navigate via `window.location`, so no
 *  existing helper to reuse). */
let assignMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  assignMock = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, assign: assignMock },
  });
});

describe("handleSessionExpired", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("pushes a session-expired toast and redirects to /auth?mode=login&next=<explicit path>", () => {
    const pushSpy = vi.spyOn(toast, "push");

    handleSessionExpired("/pricing");

    expect(pushSpy).toHaveBeenCalledWith("Session expired — sign in again.");
    expect(assignMock).toHaveBeenCalledWith("/auth?mode=login&next=%2Fpricing");
  });

  it("falls back to the current page when no override is given, so it never loses the user's place", () => {
    handleSessionExpired();

    expect(assignMock).toHaveBeenCalledWith(expect.stringContaining("/auth?mode=login&next="));
  });

  it("rejects an off-origin override rather than trusting it, falling back to the current page instead", () => {
    handleSessionExpired("https://evil.example/phish");

    expect(assignMock).toHaveBeenCalledTimes(1);
    const [target] = assignMock.mock.calls[0] as [string];
    expect(target.startsWith("/auth?mode=login&next=%2F")).toBe(true);
    expect(target).not.toContain("evil.example");
  });
});
