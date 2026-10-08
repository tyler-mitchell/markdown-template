# SUP-418: Attachment storage

**Reported by:** Maya Chen

## Customer report

The diagnostic pasted {ticket} and <$show if={approved}> literally. Keep that text in the case.

## Reproduce

Run `curl --max-time 5000 "https://uploads.example.com/health"`, then save the request context:

```json
{"ticket": "SUP-418", "endpoint": "https://uploads.example.com/health"}
```

### Retry the failed upload

- The first request returned HTTP 503.
- The retry reached the same storage node.
### Inspect the storage health endpoint


## Evidence

- Verified: The storage node rejected both requests.
- Pending: `curl --fail https://uploads.example.com/health`

No follow-up action has been assigned.

## Escalation note

Keep SUP-418 linked to the Attachment storage incident record.
