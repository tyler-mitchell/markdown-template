# INC-204: Customer attachment uploads

**Status:** investigating

## Customer impact

Customers can read existing attachments, but new uploads have returned errors since 09:12 UTC.

## Timeline

- **09:12 UTC** — The upload error alert fired.
  - The error rate increased from below 1% to 38%.
  - Existing attachment downloads continue to return HTTP 200.
- **09:18 UTC** — The on-call engineer reproduced the failure.
  - A 120 KB PNG upload returned HTTP 503.
  - The matching server log reports a storage request timeout.

## Current handoff

The cause is not confirmed. Continue from the recorded evidence and report
new findings before changing the recovery plan.

## Assigned actions

- [ ] **Priya:** Check storage latency and connection limits without deleting queued uploads
- [ ] **Maya:** Post a customer-facing status update and collect affected request IDs
