# INC-204: Customer attachment uploads

**Status:** resolved

## Customer impact

New uploads intermittently failed between 09:12 and 09:41 UTC. Existing attachments remained available.

## Timeline

- **09:31 UTC** — The storage connection limit was corrected.
  - The deployed limit differed from the approved service configuration.
- **09:41 UTC** — Uploads recovered.
  - PNG and PDF uploads succeeded through the customer interface.
  - Upload error rates returned below 1%.

## Recovery

Service was restored at 09:41 UTC. Follow-up actions remain assigned below.

## Assigned actions

- [ ] **Luis:** Add deployment verification for the storage connection setting
