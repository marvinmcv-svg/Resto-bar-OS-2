import { describe, expect, it } from "vitest";
import { attendanceFor, minutesWorked, scheduledMinutes, shiftBounds, weekStartOf, weekSummary, type ScheduleShift, type TimeEntry } from "./time";

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime(); // Oct 2026, local
const night: ScheduleShift = { id: "n", staffId: "ana", date: "2026-10-05", start: "17:00", end: "00:00" };
const morning: ScheduleShift = { id: "m", staffId: "ana", date: "2026-10-06", start: "11:00", end: "17:00" };

describe("attendance", () => {
  it("handles shifts that end after midnight", () => {
    const [a, b] = shiftBounds(night);
    expect(a).toBe(at(5, 17));
    expect(b).toBe(at(6, 0));
    expect(scheduledMinutes(night)).toBe(7 * 60);
  });

  it("counts worked minutes, including an open entry until now", () => {
    const entries: TimeEntry[] = [
      { id: "1", staffId: "ana", inAt: at(5, 17), outAt: at(5, 23, 30) },
      { id: "2", staffId: "ana", inAt: at(6, 11, 5) },
      { id: "3", staffId: "luis", inAt: at(5, 17), outAt: at(5, 18) },
    ];
    expect(minutesWorked(entries, "ana", at(5, 0), at(7, 0), at(6, 12, 5))).toBe(390 + 60);
  });

  it("tells on-time, late, absent and upcoming apart (10-minute tolerance)", () => {
    const e = (inAt: number): TimeEntry[] => [{ id: "x", staffId: "ana", inAt }];
    expect(attendanceFor(morning, e(at(6, 10, 50)), at(6, 12)).kind).toBe("on-time");
    expect(attendanceFor(morning, e(at(6, 11, 10)), at(6, 12)).kind).toBe("on-time");
    expect(attendanceFor(morning, e(at(6, 11, 25)), at(6, 12))).toMatchObject({ kind: "late", minutesLate: 25 });
    expect(attendanceFor(morning, [], at(6, 12)).kind).toBe("absent");
    expect(attendanceFor(morning, [], at(6, 10)).kind).toBe("upcoming");
  });

  it("summarizes a week per person", () => {
    const entries: TimeEntry[] = [{ id: "1", staffId: "ana", inAt: at(5, 17, 20), outAt: at(6, 0) }];
    const [row] = weekSummary(["ana"], [night, morning], entries, weekStartOf(new Date(2026, 9, 7)), at(6, 18));
    expect(row).toMatchObject({ scheduledMin: 13 * 60, workedMin: 400, shifts: 2, attended: 1, late: 1, absent: 1 });
  });

  it("weeks start on Monday", () => {
    expect(weekStartOf(new Date(2026, 9, 11)).getDate()).toBe(5); // Sunday Oct 11 -> Monday Oct 5
    expect(weekStartOf(new Date(2026, 9, 5)).getDate()).toBe(5);
  });
});
