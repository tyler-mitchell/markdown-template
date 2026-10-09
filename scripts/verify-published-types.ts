import { compile, type } from "markdown-template";

const request = type({ values: { "[string]": "unknown" } });
request.assert({ values: { version: "2.0", changes: [] } });

const notice = compile("Request timeout: {{ timeoutMs }} ms.", {
  schema: type.module({
    Settings: {
      timeoutMs: [
        "number > 0",
        "@",
        { default: 5000, description: "Maximum request duration in milliseconds." },
      ],
    },
  }),
  input: "Settings",
});

notice.render();
notice.render({ timeoutMs: 2000 });
notice.renderValidated({ timeoutMs: 2000 });

// @ts-expect-error Raw values must match the native schema.
notice.render({ timeoutMs: "2000" });
// @ts-expect-error Validated values must include the resolved default.
notice.renderValidated({});
