import { describe, expect, it } from "vitest";
import { formatProvenance } from "@/components/app/twin/draftProvenance";

describe("formatProvenance", () => {
  it("both zero: the honest 'no context used' sentence, not '0 memories and 0 messages'", () => {
    expect(formatProvenance(0, 0, "EN")).toBe("No memory or message context was used for this draft.");
  });

  it("singular memory only", () => {
    expect(formatProvenance(1, 0, "EN")).toBe("Drawing on 1 memory");
  });

  it("plural memories only", () => {
    expect(formatProvenance(3, 0, "EN")).toBe("Drawing on 3 memories");
  });

  it("singular message only", () => {
    expect(formatProvenance(0, 1, "EN")).toBe("Drawing on 1 message");
  });

  it("plural messages only", () => {
    expect(formatProvenance(0, 5, "EN")).toBe("Drawing on 5 messages");
  });

  it("both present, correctly pluralized independently and joined with 'and'", () => {
    expect(formatProvenance(1, 1, "EN")).toBe("Drawing on 1 memory and 1 message");
    expect(formatProvenance(2, 5, "EN")).toBe("Drawing on 2 memories and 5 messages");
  });

  it("UA locale uses the real UA copy, not a hardcoded English fallback", () => {
    expect(formatProvenance(0, 0, "UA")).toBe("Для цієї чернетки не використано жодного спогаду чи повідомлення.");
    expect(formatProvenance(2, 1, "UA")).toBe("Спирається на 2 спогадів і 1 повідомлення");
  });
});
