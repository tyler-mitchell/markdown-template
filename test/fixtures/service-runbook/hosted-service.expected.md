# Support portal

Hosts the customer support inbox and attachment browser.

## Start and stop

Unit: `support-portal.service` on `support-staging`.

```sh
ssh "support-staging" 'systemctl --user start "support-portal.service"'
ssh "support-staging" 'systemctl --user status "support-portal.service"'
ssh "support-staging" 'systemctl --user stop "support-portal.service"'
```

Inspect recent logs before restarting a failing service:

```sh
ssh "support-staging" 'journalctl --user -u "support-portal.service" -n 100 --no-pager'
```

## Health checks

### Application readiness

```sh
curl --fail --silent --show-error "https://support.staging.example.com/health"
```

Expected: HTTP 200 with a ready status and a connected database.

### Attachment storage

```sh
curl --fail --silent --show-error "https://support.staging.example.com/health/storage"
```

Expected: HTTP 200 after successfully reading the storage probe.

## Escalation

Contact **Customer Platform** in **#support-platform-oncall** about Support portal.
Include the failing check, its response, and the relevant logs.
