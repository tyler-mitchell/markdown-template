# Webhook setup for support-preview

Save this as `webhook.json`:

```json
{
  "workspace": "support-preview",
  "events": ["ticket.created"],
  "delivery": {
    "retry": true
  }
}
```

Register the webhook using your environment's token:

```sh
curl --fail-with-body "https://events.staging.example.com/webhooks" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data-binary @webhook.json
```

## Verify delivery

Create a ticket in **support-preview**, then confirm that your receiver responds
with `{"accepted": true}`.
