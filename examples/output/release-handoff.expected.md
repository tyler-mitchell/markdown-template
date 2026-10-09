# Asset API 2.0.0 — Release handoff

Adds resumable uploads and clearer failure reports.

**Owner:** Mira Patel · **Migration required**

## Changes (2)

- Resume an interrupted upload without starting over.
- Include a request ID in every upload error.

## Before upgrading

Rename Helm chart setting `{{ .Values.assets.host }}` to `{{ .Values.storage.host }}` before rollout.

## Verification

Open [Asset API](https://assets.example.com), then check readiness:

```sh
curl --fail --max-time 10 "https://assets.example.com/health"
```

**Timeout:** 10 seconds.
Stop waiting for the health check after this many seconds.

## Rollback

Redeploy `1.8.3` and restore the previous Helm values.

## Support

Contact [Mira Patel](mailto:platform@example.com) about Asset API.
Include the release version, the failed verification step, and relevant logs.
