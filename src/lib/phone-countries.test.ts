import { describe, expect, it } from "vitest";

import { joinPhone, splitPhone } from "./phone-countries";

describe("splitPhone", () => {
  it("defaults to India for empty and legacy numbers", () => {
    expect(splitPhone("")).toMatchObject({ country: "91", number: "" });
    expect(splitPhone("9876543210")).toMatchObject({
      country: "91",
      number: "9876543210",
    });
    expect(splitPhone("919876543210")).toMatchObject({
      country: "91",
      number: "9876543210",
    });
  });

  it("matches known country codes", () => {
    expect(splitPhone("+447700900123")).toMatchObject({
      country: "44",
      number: "7700900123",
    });
    expect(splitPhone("+971501234567")).toMatchObject({
      country: "971",
      number: "501234567",
    });
    expect(splitPhone("+14155552671")).toMatchObject({
      country: "1",
      number: "4155552671",
    });
  });

  it("falls back to Other for unknown codes", () => {
    expect(splitPhone("+8613800138000")).toMatchObject({
      country: "other",
      number: "8613800138000",
    });
  });
});

describe("joinPhone", () => {
  it("joins code and number", () => {
    expect(joinPhone("91", "", "98765 43210")).toBe("+919876543210");
    expect(joinPhone("44", "", "07700 900123")).toBe("+447700900123");
    expect(joinPhone("other", "+86", "138 0013 8000")).toBe("+8613800138000");
  });

  it("returns an empty value when there is no number", () => {
    expect(joinPhone("91", "", "")).toBe("");
    expect(joinPhone("91", "", "  ")).toBe("");
  });
});
