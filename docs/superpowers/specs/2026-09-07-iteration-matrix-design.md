# Iteration Matrix — design spec

## Problem
A test can run many iterations over a parameter grid (e.g. `throughput` = 96 iterations across 5 varying params). The current list view makes it hard to see *what/how* is iterated, which combinations are covered, and where the gaps are.

## Solution
An alternative **Matrix view** of a test's iteration list, reached by a **List / Matrix view toggle** in the expanded test's result panel. Pure client-side — reuses the `RunDataResults[]` already loaded by `useGetResultsTableQuery`. No backend, no new endpoint, no new npm dependency (`@dnd-kit` is already present).

## Data
Each `RunDataResults` carries `parameters: string[]` (`"name=value"`), `obtained_result.result_type`, `has_error`, `has_measurements`. Parse params into a map per iteration.

## Components (new lib `features/run/.../result-matrix/`)
- `matrix-analysis.ts` — pure functions + types: parse iterations, classify varying vs fixed params, cardinality, value sets, cartesian `combos`, coverage `fill`, `globalHas` (N/A vs untested), `suggestions()`.
- `matrix-shelves.tsx` — Rows / Columns / Facets / Unused shelves via `@dnd-kit` (matches run-table drag pattern).
- `result-matrix.component.tsx` — renders the pivot table (supports nested axes), small-multiples (trellis), margins, cell modes (coverage / result), N/A vs untested cells, suggestion apply-buttons.
- `index.ts`.

## Integration
`ResultTableContainer` gains a `view` state (`list | matrix`) and a small header toggle; renders `ResultTable` or `ResultMatrix` from the same `data`.

## Cell states
- filled — coverage ramp (count) or result colour (pass/skip/NOK via `has_error`/`result_type`).
- untested (`·`) — combo exists elsewhere in the data but is filtered out by current facets.
- N/A (hatched) — combo never occurs in any iteration (structural). Copy: "not observed" to stay honest (data-only inference).

## Auto-suggestions (from variability + coverage)
Balanced (two highest-cardinality on axes), Densest (independent pair, most filled), Expose gaps (associated pair, most missing), Nested rows (pack a low-cardinality param under the top one). Association drives the choice but is not shown as a matrix.

## Signal / "what to include"
v1: rank/flag varying params by cardinality + coverage; result-based signal optional. Throughput-metric signal is phase 2 (needs per-iteration measurement fetch; list only has `has_measurements` boolean).

## Out of scope (v1)
- Whole-run (cross-test) matrix.
- Metric heatmap by measurement value.
- Persisting the view/layout in the URL (component state for now).

## Scale
Cap axis cardinality for readability; when a chosen axis is very high-cardinality, warn and suggest faceting/sampling. 96 iterations is trivial; design assumes low-thousands worst case, all client-side already loaded.
