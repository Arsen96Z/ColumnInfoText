# ColumnInfoText

A **controller** Power Apps Component Framework (PCF) control for model-driven apps. It shows contextual, colored guidance **under native form fields** when their current value matches a rule you define in JSON — without replacing or re-hosting those fields.

**Namespace:** `SolzetControls`  
**Constructor:** `ColumnInfoText`

## What it does

- Reads a JSON config that lists one or more fields and the info text to show for each **exact** value.
- Watches field values and visibility on the form (via Xrm) and **injects** styled info blocks directly under each field’s native control in the DOM.
- Leaves choice, text, and other controls **native and editable** — only the help text is added below.
- Uses one hidden multiline column on the form as a **mount point** (the control must stay on the form to run, but the mount row is collapsed to ~0px).

Each info block supports custom background and text color, optional text wrapping, truncation with hover for full text, and optional deduplication when several selected values would show the same message.

## What it was created for

Dynamics / model-driven forms often need **inline help that depends on what the user picked** — warnings for certain statuses, instructions for a tier or threshold, reminders when a flag is set. Built-in field descriptions are static; business rules and scripts are heavy for simple “if value X, show message Y” cases.

ColumnInfoText was built to give makers a **lightweight, config-driven** way to:

- Surface **value-specific guidance** next to the field that triggered it.
- Use **color** (e.g. red for risk, green for OK) without custom HTML web resources per form.
- Cover **many fields from one control** on a form via a single JSON config.
- Avoid binding a separate PCF to every choice column.

## Supported field types

Matching is **exact value only** (no operators or ranges). Field type is detected from the attribute; config `type` is optional documentation.

| Kind | Attribute types | Config `value` format |
|------|-----------------|------------------------|
| Choice | `optionset` | Option numeric value |
| Multi-choice | `multiselectoptionset` | Option numeric value (one block per selected value, in order) |
| Yes/No | `boolean` | `1` (true) or `0` (false); unset bool = no info |
| Text | `string` | String, case-insensitive, trimmed |
| Number | `decimal`, `double` | Number, e.g. `0.5` |
| Currency | `money` | Number, e.g. `1000` |
| Date | `datetime` | `YYYY-MM-DD` (matched on **local calendar day**, not UTC instant) |

## Where it is useful

- **Compliance and risk** — e.g. show a red notice when status = “High risk” or when a bool = Yes.
- **Operational hints** — explain what happens when a specific option set value is chosen.
- **Tier / threshold messaging** — when currency or number equals a configured value, show pricing or SLA text.
- **Multi-select summaries** — different colored notes per selected multi-choice value.
- **Date milestones** — highlight go-live or review dates with a dedicated message.
- **Training and rollout** — contextual tips on complex forms without cluttering every label with long description text.

Best on **main entity forms** where users set or review key fields and need immediate, value-aware feedback. Less suited when you need rich HTML, cross-field logic, or non-exact conditions (contains, greater than, etc.) — those belong in plugins, low-code rules, or a custom page.

## Architecture (short)

```
[ Hidden anchor column + ColumnInfoText PCF ]  ← one per form, ~0px footprint
        │
        └── JSON config lists field A, B, C…
                 │
                 └── For each field: read value → inject info under native control
```

- **anchor** (bound) — mount column; can also hold JSON if `configJson` is empty.
- **configJson** (input) — primary JSON config source.

## Setup

1. Add a multiline text column to the table and place **ColumnInfoText** on it (once per form).
2. Bind the **anchor** property to that column.
3. Put your JSON in **configJson** (form property) or in the anchor column value.
4. Turn off the anchor column’s label. Do **not** hide the column with `setVisible` or business rules — that stops the control from running.

## Config

Full copy-paste example (all field kinds and optional keys): see `EXAMPLE_CONFIG` at the top of [ColumnInfoText/index.ts](ColumnInfoText/index.ts).

Minimal shape:

```json
{
  "fields": [
    {
      "field": "statuscode",
      "dedupe": true,
      "options": [
        {
          "value": 1,
          "info": "Active — standard processing applies.",
          "background": "#DFF6DD",
          "textColor": "#107C10"
        }
      ]
    }
  ]
}
```

## Build

```bash
npm install
npm run build
```

## Deploy

```bash
pac pcf push
```

Or import the solution from the `solution/` folder.
