import { describe, expect, it } from "vitest";
import { calculateBristolScore, calculateCountScore, calculateDailyScore } from "./stool-score";

describe("calculateBristolScore", () => {
  it("returns correct scores for each Bristol type", () => {
    expect(calculateBristolScore(1)).toBe(3);
    expect(calculateBristolScore(2)).toBe(4);
    expect(calculateBristolScore(3)).toBe(5);
    expect(calculateBristolScore(4)).toBe(5);
    expect(calculateBristolScore(5)).toBe(4);
    expect(calculateBristolScore(6)).toBe(2);
    expect(calculateBristolScore(7)).toBe(0);
  });

  it("returns 0 for invalid Bristol types", () => {
    expect(calculateBristolScore(0)).toBe(0);
    expect(calculateBristolScore(8)).toBe(0);
    expect(calculateBristolScore(-1)).toBe(0);
  });
});

describe("calculateCountScore", () => {
  it("returns correct scores for each count", () => {
    expect(calculateCountScore(1)).toBe(5);
    expect(calculateCountScore(2)).toBe(4);
    expect(calculateCountScore(3)).toBe(3);
    expect(calculateCountScore(4)).toBe(2);
    expect(calculateCountScore(5)).toBe(1);
    expect(calculateCountScore(6)).toBe(0);
    expect(calculateCountScore(7)).toBe(0);
  });

  it("returns 0 for zero or negative count", () => {
    expect(calculateCountScore(0)).toBe(0);
    expect(calculateCountScore(-1)).toBe(0);
  });
});

describe("calculateDailyScore", () => {
  it("returns 0 for empty records", () => {
    expect(calculateDailyScore([])).toBe(0);
  });

  it("calculates max score for single Bristol 4", () => {
    // Bristol 4 = 5, count 1 = 5, total = 10
    expect(calculateDailyScore([{ bristol: 4 }])).toBe(10);
  });

  it("calculates score for two records", () => {
    // Bristol 3 = 5, Bristol 4 = 5, avg = 5
    // count 2 = 4
    // total = 9
    expect(calculateDailyScore([{ bristol: 3 }, { bristol: 4 }])).toBe(9);
  });

  it("calculates score for multiple records with different Bristol types", () => {
    // Bristol 1 = 3, Bristol 7 = 0, avg = 1.5
    // count 2 = 4
    // total = 5.5
    expect(calculateDailyScore([{ bristol: 1 }, { bristol: 7 }])).toBe(5.5);
  });

  it("handles 6+ records with 0 count score", () => {
    // 6x Bristol 4 = avg 5, count 6 = 0, total = 5
    const records = Array(6).fill({ bristol: 4 });
    expect(calculateDailyScore(records)).toBe(5);
  });
});
