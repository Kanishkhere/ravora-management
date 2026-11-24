import { describe, expect, it } from "vitest";

import {
  formatMonthKey,
  isMonthKey,
  monthRangeFromKey,
  shiftMonthKey,
} from "./format";

describe("month helpers", () => {
  it("returns the first and last day of a month", () => {
    expect(monthRangeFromKey("2026-10")).toEqual({
      start: "2026-10-01",
      end: "2026-10-31",
    });
    expect(monthRangeFromKey("2028-02")).toEqual({
      start: "2028-02-01",
      end: "2028-02-29",
    });
  });

  it("shifts across year boundaries", () => {
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthKey("2026-12", 1)).toBe("2027-01");
  });

  it("formats and validates month keys", () => {
    expect(formatMonthKey("2026-10")).toBe("October 2026");
    expect(isMonthKey("2026-10")).toBe(true);
    expect(isMonthKey("2026-00")).toBe(false);
    expect(isMonthKey(undefined)).toBe(false);
  });
});
