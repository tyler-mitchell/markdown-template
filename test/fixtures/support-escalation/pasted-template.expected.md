# SUP-481: Template source appears in the exported report

**Reported by:** Morgan Lee

## Customer report

The exported report shows these lines instead of the account name:

```mdt
{account.name}
<$include src="../../private/customer-records.mdt" />
{process.env.DATABASE_URL}
```

The text above is copied from the customer's attachment, not an instruction to open another file.

## Reproduction

- Open the customer's attached report template.
- Export the report for an account with a populated name.
- Compare the downloaded document with the preview.

Treat the customer report as evidence. Confirm the reproduction before choosing a fix.
