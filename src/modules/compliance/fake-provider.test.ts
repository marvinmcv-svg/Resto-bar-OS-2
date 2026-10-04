import { describe, expect, it } from "vitest";
import { FakeComplianceProvider } from "./fake-provider";
import type { InvoiceInput } from "./types";

const input = (id = "inv-1"): InvoiceInput => ({
  invoiceId: id,
  locationId: "loc",
  issuedAt: new Date(),
  lines: [{ description: "Cerveza", quantity: 2, unitPriceMinor: 2500 }],
  totalMinor: 5000,
  currency: "BOB",
});

describe("FakeComplianceProvider", () => {
  it("issues idempotently by invoiceId", async () => {
    const p = new FakeComplianceProvider();
    const a = await p.issueInvoice(input());
    const b = await p.issueInvoice(input());
    expect(a).toEqual(b);
    expect(a.status).toBe("issued");
  });

  it("returns contingency when offline", async () => {
    const p = new FakeComplianceProvider();
    p.online = false;
    expect((await p.issueInvoice(input())).status).toBe("contingency");
  });

  it("rejects totals that don't match the lines", async () => {
    const p = new FakeComplianceProvider();
    const r = await p.issueInvoice({ ...input(), totalMinor: 1 });
    expect(r).toMatchObject({ status: "failed", retryable: false });
  });
});
