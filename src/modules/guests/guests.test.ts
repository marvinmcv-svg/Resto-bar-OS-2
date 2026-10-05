import { describe, expect, it } from "vitest";
import { audience, averageTicketMinor, inSegment, normalizePhone, personalize, whatsappLink, type Guest } from "./guests";

const now = new Date(2026, 9, 5, 12).getTime();
const g = (over: Partial<Guest>): Guest => ({ id: "g", name: "Ana Rojas", tags: [], visits: 3, spentMinor: 60000, createdAt: 0, optIn: true, phone: "+591 70000001", ...over });

describe("guests", () => {
  it("segments guests", () => {
    expect(inSegment(g({ tags: ["vip"] }), "vip", now)).toBe(true);
    expect(inSegment(g({ visits: 9 }), "vip", now)).toBe(true);
    expect(inSegment(g({ birthday: "10-21" }), "cumpleanos", now)).toBe(true);
    expect(inSegment(g({ birthday: "11-02" }), "cumpleanos", now)).toBe(false);
    expect(inSegment(g({ lastVisitAt: now - 40 * 86400000 }), "inactivos", now)).toBe(true);
    expect(inSegment(g({ lastVisitAt: now - 5 * 86400000 }), "inactivos", now)).toBe(false);
    expect(inSegment(g({ visits: 1 }), "nuevos", now)).toBe(true);
  });

  it("only messages guests who opted in and have a phone", () => {
    const list = [g({ id: "a" }), g({ id: "b", optIn: false }), g({ id: "c", phone: undefined })];
    expect(audience(list, "todos", now).map((x) => x.id)).toEqual(["a"]);
  });

  it("normalizes Bolivian mobile numbers", () => {
    expect(normalizePhone("70012345")).toBe("+591 70012345");
    expect(normalizePhone("+591 7001-2345")).toBe("+591 70012345");
    expect(normalizePhone("591 61234567")).toBe("+591 61234567");
    expect(normalizePhone("3345678")).toBeNull();
  });

  it("builds WhatsApp links and personal messages", () => {
    expect(whatsappLink("+591 70012345", "Hola Ana")).toBe("https://wa.me/59170012345?text=Hola%20Ana");
    expect(personalize("Hola {nombre}, te esperamos", g({}))).toBe("Hola Ana, te esperamos");
    expect(averageTicketMinor(g({}))).toBe(20000);
    expect(averageTicketMinor(g({ visits: 0 }))).toBe(0);
  });
});
