# ColumnInfoText

Power Apps Component Framework (PCF) control that injects colored info blocks under form fields based on exact value match.

**Namespace:** `SolzetControls`  
**Constructor:** `ColumnInfoText`

## Setup

1. Bind the control to a hidden multiline **anchor** column (one per form — mount point only).
2. Provide JSON config via the **configJson** input property, or fall back to JSON in the anchor column.
3. Turn off the anchor column label in the form designer. Do **not** hide the column with `setVisible` — that stops the control from running.

## Config

See `EXAMPLE_CONFIG` at the top of [ColumnInfoText/index.ts](ColumnInfoText/index.ts) for a full multi-type copy-paste example (choice, multiselect, bool, text, number, currency, date).

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
