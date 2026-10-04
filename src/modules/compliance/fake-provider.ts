// In-memory provider for development and tests until the authorized BO provider is chosen
// (docs/sin-spec-notes.md). Simulates outages so the offline/contingency path can be exercised.
import { invoiceTotalMinor, type ComplianceProvider, type InvoiceInput, type InvoiceResult } from "./types";

export class FakeComplianceProvider implements ComplianceProvider {
  readonly country = "BO";
  readonly name = "fake";
  online = true;
  private issued = new Map<string, string>(); // invoiceId -> externalId

  async issueInvoice(input: InvoiceInput): Promise<InvoiceResult> {
    if (invoiceTotalMinor(input.lines) !== input.totalMinor) {
      return { status: "failed", error: "total does not match lines", retryable: false };
    }
    if (!this.online) return { status: "contingency", reason: "provider unreachable" };
    const existing = this.issued.get(input.invoiceId);
    if (existing) return { status: "issued", externalId: existing };
    const externalId = `FAKE-${this.issued.size + 1}`;
    this.issued.set(input.invoiceId, externalId);
    return { status: "issued", externalId };
  }

  async cancelInvoice(externalId: string) {
    const known = [...this.issued.values()].includes(externalId);
    return known ? { status: "cancelled" as const } : { status: "failed" as const, error: "unknown invoice" };
  }

  async healthCheck() {
    return { ok: this.online };
  }
}
