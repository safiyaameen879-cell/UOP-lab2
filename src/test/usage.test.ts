import { describe, expect, it } from "vitest";
import { minutesBetween, verifiedMinutes } from "@/lib/usage";

describe("usage duration rules", () => {
  it("computes minutes from actual times", () => {
    expect(minutesBetween("09:05", "10:50")).toBe(105);
  });
  it("rejects end before or equal to start", () => {
    expect(minutesBetween("11:00", "10:00")).toBeNull();
    expect(minutesBetween("10:00", "10:00")).toBeNull();
  });
  it("counts zero for unverified records even with actual times", () => {
    expect(verifiedMinutes({ status: "pending", actual_start: "09:00", actual_end: "11:00" })).toBe(0);
  });
  it("counts verified records only from actual times", () => {
    expect(verifiedMinutes({ status: "verified", actual_start: "09:00", actual_end: "11:30" })).toBe(150);
  });
});
