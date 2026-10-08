# Event ingestion for support-preview

Send requests to `https://events.staging.example.com/events`. Store the API token in the `API_TOKEN`
environment variable rather than in the request file.

## Request body

Save this as `event.json`:

```json
{
  "workspace": "support-preview",
  "event": "document.created",
  "metadata": {
    "source": "desktop"
  }
}
```

## Send the request

```sh
curl --fail-with-body "https://events.staging.example.com/events" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data-binary @event.json
```

## JavaScript client configuration

```js
const client = {
  baseUrl: "https://events.staging.example.com",
  timeoutMs: 5000,
  headers: {
    authorization: `Bearer ${process.env.API_TOKEN}`
  }
};
```

The shell and JavaScript snippets read the token when the client runs.
