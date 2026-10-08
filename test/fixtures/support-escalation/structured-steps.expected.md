# SUP-483: Attachment preview does not update after replacement

**Reported by:** Casey Nguyen

## Customer report

Replacing a PDF attachment keeps the previous thumbnail until the ticket is reopened.

## Reproduction

- Open a ticket with an existing PDF attachment.
  - Expected: The attachment thumbnail matches the currently stored PDF.
- Replace the attachment with a different PDF while keeping the ticket open.
  - Expected: The preview updates to show the replacement file.
- Close and reopen the ticket.
  - Expected: The same replacement preview remains visible.

Treat the customer report as evidence. Confirm the reproduction before choosing a fix.
