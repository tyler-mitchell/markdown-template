# SUP-482: Imported ticket fails to produce an escalation

**Reported by:** Jordan Patel

## Customer report

The ticket import includes an extra field whose name resembles JavaScript. The escalation should use the ticket fields declared by its template.

## Reproduction

- Import the ticket payload from the external support integration.
- Generate the engineering escalation.
- Confirm that unused integration fields do not execute or break rendering.

Treat the customer report as evidence. Confirm the reproduction before choosing a fix.
