# Documentation preview

Previews help-center edits locally before they are published.

## Start and stop

Run from `/work/help-center`:

```sh
cd "/work/help-center"
vp dev --host 127.0.0.1 --port 4173
```

Stop the process with Ctrl+C in the terminal that started it.

## Health checks

### Preview home page

```sh
curl --fail --silent --show-error "http://127.0.0.1:4173/"
```

Expected: HTTP 200 with the help-center home page.

## Escalation

Contact **Developer Experience** in **#docs-tooling** about Documentation preview.
Include the failing check, its response, and the relevant logs.
