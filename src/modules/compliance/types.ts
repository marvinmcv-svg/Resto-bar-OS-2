// Country-module interface (ADR-008). The core depends only on this file.

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface InvoiceInput {
  invoiceId: string; // our id, used as an idempotency key
  locationId: string;
  issuedAt: Date;
  customerTaxId?: string; // NIT/CI; absent = generic consumer
  customerName?: string;
  lines: InvoiceLine[];
  totalMinor: number;
  currency: string;
}

export type InvoiceResult =
  | { status: "issued"; externalId: string; raw?: unknown }
  | { status: "contingency"; reason: string }
  | { status: "failed"; error: string; retryable: boolean };

export type CancelResult = { status: "cancelled" } | { status: "failed"; error: string };

export interface ProviderHealth {
  ok: boolean;
  detail?: string;
}

export interface ComplianceProvider {
  readonly country: string;
  readonly name: string;
  issueInvoice(input: InvoiceInput): Promise<InvoiceResult>;
  cancelInvoice(externalId: string, reason: string): Promise<CancelResult>;
  healthCheck(): Promise<ProviderHealth>;
}

export function invoiceTotalMinor(lines: InvoiceLine[]): number {
  return lines.reduce((sum, l) => sum + Math.round(l.quantity * l.unitPriceMinor), 0);
}
