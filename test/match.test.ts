import { expect, test } from "vite-plus/test";
import { type } from "arktype";
import { compile } from "../src/index.ts";

test("classifies response latency with inline constraints and a module alias", () => {
  const document = compile(`---
schema:
  Unavailable: "'unavailable'"
  Report:
    latencyMs: number | Unavailable
input: Report
---
<$match value={latencyMs}>
  <$case type="number > 100">Slow response: {{ latencyMs }} ms.</$case>
  <$case type="number">Response within budget: {{ latencyMs }} ms.</$case>
  <$case type="Unavailable">The service did not respond.</$case>
</$match>
`);

  expect(document.render({ latencyMs: 150 })).toBe("Slow response: 150 ms.");
  expect(document.render({ latencyMs: 100 })).toBe("Response within budget: 100 ms.");
  expect(document.render({ latencyMs: "unavailable" })).toBe("The service did not respond.");
});

test("uses programmatic module exports alongside inline cases and a default", () => {
  const schema = type.module({
    Outage: { status: "'outage'", incident: "string" },
    Report: { service: "string", result: "Outage | number | null" },
  });
  const document = compile(
    `{{ service }}: <$match value={result}><$case type="Outage">incident {{ result.incident }}</$case><$case type="number > 100">slow response</$case><$case type="number">healthy</$case><$default>awaiting probe</$default></$match>.`,
    { schema, input: "Report" },
  );

  expect(document.schemas).toBe(schema);
  expect(document.input).toBe(schema.Report);
  expect(
    document.render({ service: "Search", result: { status: "outage", incident: "INC-42" } }),
  ).toBe("Search: incident INC-42.");
  expect(document.render({ service: "Search", result: 150 })).toBe("Search: slow response.");
  expect(document.render({ service: "Search", result: 80 })).toBe("Search: healthy.");
  expect(document.render({ service: "Search", result: null })).toBe("Search: awaiting probe.");
});
