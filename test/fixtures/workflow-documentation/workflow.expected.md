# Artifact processor deployment

Save this workflow in `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on: workflow_dispatch
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
        env:
          RELEASE_SHA: ${{ github.sha }}
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}

```

The following directive renders a notice with the supplied service:

```mdt
<$include src="notice.mdt" with={{service: service}} />
```

## Notice source

```mdt
---
schema:
  Notice:
    service: string
input: Notice
---
{{ service }} deploys from the reviewed commit.

```

## Rendered notice

Artifact processor deploys from the reviewed commit.

A normal include in a code example remains literal:

```mdt
<$include src="not-loaded.mdt" with={{label: "raw > output"}} />
```
