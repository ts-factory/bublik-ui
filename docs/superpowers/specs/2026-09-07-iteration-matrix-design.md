# Iteration Matrix — design spec

## Problem
A test can run many iterations over a parameter grid (e.g. `throughput` = 96 iterations across 5 varying params). The current list view makes it hard to see *what/how* is iterated, which combinations are covered, and where the gaps are.

## Solution
An alternative **Matrix view** of a test's iteration list, reached by a **List / Matrix toggle** at the start of the iteration filter row. Pure client-side — reuses the `RunDataResults[]` already loaded by `useGetResultsTableQuery`. No backend, no new endpoint, no new npm dependency.

## Data
Each `RunDataResults` carries `parameters: string[]` (`"name=value"`), `obtained_result.result_type`, `has_error`, `has_measurements`. Parse params into a map per iteration (`MatrixIteration`, which also keeps its source row for links).

## Components (`features/run/.../result-matrix/`)
- `matrix-analysis.ts` — pure functions + types: parse iterations, classify varying vs fixed params, cardinality, value sets, cartesian `combos`, coverage `fill`, `presenceSet` (N/A vs filtered out), `suggestLayouts()`, `summarizeCell()`.
- `result-view.hooks.ts` — `useResultView(rowId)` (URL state, see below), `resolveMatrixState()`, role helpers.
- `result-matrix.container.tsx` — owns the state, the filters and the cell selection; composes the pieces below.
- `matrix-rail.tsx` — left rail: SUGGESTED layouts (one-click, "applied" marker, Reset layout), PARAMETERS with an `R / C / F / —` role per varying param and fixed params listed for context, FACETS mode (filter / small multiples).
- `matrix-table.tsx` — the pivot table (nested axes, margins, cell modes, selection, crosshair hover), `matrix-legend.tsx`, `matrix-facet-filters.tsx`.
- `matrix-cell-drawer.tsx` — side drawer listing the iterations of the clicked cell.

## Integration
`ResultTableContainer` reads the view from the URL and renders `ResultTable` or `ResultMatrixContainer` from the same `data`. Both views share the same sticky filter row (`List | Matrix ‖ filters ‖ Reset`), which is always visible; the matrix applies the filters too (filtered-out iterations become dashed cells). The list keeps the tree indent; the matrix is flush with the run-table row and wrapped so a wide matrix scrolls inside the row instead of stretching the run table.

## Layout
```
List | Matrix ‖ Obtained Result · Result Type · Verdicts · Artifacts · Parameters ‖ Reset   (sticky)
┌ rail ───────────┬ content ─────────────────────────────────────────────────────┐
│ SUGGESTED  Reset │ test_name  rows × cols · N cells · X% filled   CELL [Coverage|Result] [ ] Margins │
│ PARAMETERS       ├──────────────────────────────────────────────────────────────┤
│ FACETS           │ facet value chips (filter mode)                              │
│                  │ matrix (full width) or small multiples                       │
│                  │ legend                                                       │
└──────────────────┴──────────────────────────────────────────────────────────────┘
```

## Cell states and colours
Vocabulary follows the filter controls ("Obtained Result", "Result Type" = Expected / Unexpected):
- **coverage** — four-step primary-blue ramp by iteration count (blue is what the app uses for neutral counts).
- **result** — expected cells use the green wash (`bg-badge-3 text-text-expected`), unexpected cells the red wash (`bg-bg-fillError text-text-unexpected`), the same tokens as the result badges. A single iteration shows its result initial; a mixed cell shows the count and the split on hover.
- **filtered out** (dashed box) — combo exists in other iterations but is excluded by the current filters / facets.
- **n/a** (hatched) — combo never occurs in any iteration (structural). Copy: "not observed" to stay honest (data-only inference).
- Hovering a cell highlights its row and column headers (crosshair) and tints the row and column.

## URL state
Per-row `resultView` query param (compressed JSON keyed by run-table row id, like `columnFilters`): view, rows / cols / facets, facet selections, facet mode, cell mode, margins. Only non-default fields are stored. Old links keep working; nothing existing is renamed.

## Auto-suggestions (from variability + coverage)
Balanced (two highest-cardinality on axes), Densest (independent pair, most filled), Expose gaps (associated pair, most missing), Nested rows (pack a low-cardinality param under the top one). Association drives the choice but is not shown as a matrix.

## Signal / "what to include"
v1: rank/flag varying params by cardinality + coverage; result-based signal optional. Throughput-metric signal is phase 2 (needs per-iteration measurement fetch; list only has `has_measurements` boolean).

## Out of scope (v1)
- Whole-run (cross-test) matrix.
- Metric heatmap by measurement value.
- Persisting the cell selection in the URL (transient).

## Scale
Cap axis cardinality for readability; when a chosen axis is very high-cardinality, warn and suggest faceting/sampling. 96 iterations is trivial; design assumes low-thousands worst case, all client-side already loaded.
