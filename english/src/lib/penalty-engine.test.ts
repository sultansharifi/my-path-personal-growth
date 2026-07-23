import { describe, expect, it } from "vitest";
import {
  deadlineState,
  matchingRule,
  nextOccurrence,
  penaltyDueDate,
} from "./penalty-engine";

describe("penalty engine", () => {
  it("increments occurrence safely", () => {
    expect(nextOccurrence(2)).toBe(3);
    expect(() => nextOccurrence(-1)).toThrow();
  });

  it("matches only the exact rule", () => {
    const rules = [{ id: "r1", mistakeTypeId: "late", threshold: 3, title: "هشدار کتبی", deadlineDays: 5 }];
    expect(matchingRule(rules, "late", 3)?.id).toBe("r1");
    expect(matchingRule(rules, "late", 2)).toBeUndefined();
  });

  it("calculates due date and status", () => {
    const created = new Date("2026-01-01T00:00:00Z");
    expect(penaltyDueDate(created, 5).toISOString()).toContain("2026-01-06");
    expect(deadlineState(new Date("2026-01-02"), new Date("2026-01-03"))).toBe("overdue");
  });
});
