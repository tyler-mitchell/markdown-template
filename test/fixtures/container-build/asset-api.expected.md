# Container build: Asset API

Add this step after source checkout in GitHub Actions:

```yaml
- name: Build Asset API
  run: docker build --tag "ghcr.io/acme/asset-api:${{ github.sha }}" .
```

GitHub Actions resolves `${{ github.sha }}` when the job runs.
