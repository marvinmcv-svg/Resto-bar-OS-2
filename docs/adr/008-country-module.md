# ADR-008: Country-module interface

- Status: Proposed
- Decision: the core never imports Bolivian logic. It depends on:
  ```ts
  interface ComplianceProvider {
    country: string;                      // "BO"
    issueInvoice(input: InvoiceInput): Promise<InvoiceResult>;
    cancelInvoice(id: string, reason: string): Promise<CancelResult>;
    healthCheck(): Promise<ProviderHealth>; // e.g. daily code/CUFD status
  }
  ```
  v1 implementation: `BoAuthorizedProviderAdapter` (a third-party authorized provider). 2027: `BoSinDirectAdapter` (in-house, homologated). Tax rules (13% IVA, IVA Transparente presentation) live inside the BO module.
