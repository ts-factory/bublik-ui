# Classification: where the UI and the API disagree

Written against `ts-factory/bublik` PR #353 (`feat/issues`, head `1f533157`).
The previous version of this note, written against `f7bca6c2`, listed
missing fields, single-value filters and missing endpoints. The server has
since fixed all of them, and the UI now uses the fixes (see "Resolved" below).
What is left: gaps the UI still works around, and API behaviour whose obvious
reading is wrong.

## Resolved since `f7bca6c2`

| Was | Now | UI |
| --- | --- | --- |
| `/issue_rules/` had no `test_name` | `test_name`, `test_path`, `issue_state`, `project_name` on every rule | Test column; the rules table no longer joins `/issues` |
| No way to name a test by id | `GET /tests/picker/?project=&search=` | Rule form searches any test with results, by path |
| `category` / `expected` compared to one raw value | `;` lists, validated (400 on unknown values) | Multi-select Category / Disposition |
| No facets | `/issues/facets/`, `/issue_rules/facets/` | Filter counts cover the whole filtered set |
| No `result_count`, rules state derived client-side | `result_count`, `rules_state` on `Issue` | Results column; header counts come from the issue |
| Run issues: `categories: {category, expected}[]` | `rules: {rule_id, category, expected, effect}[]` | Effect read from the server |
| Issue picker: `{id, title, key, category}` | `{id, title, state, bug_key, bug_url, rules}` | Picker marks closed issues |
| Classified results had no package path | `path` on every result detail | Test cell shows the package |
| A page past the end returned 404 | 200, empty page, real `count` | `clampPage` works as intended |

## 1. Still worked around

- **Rules can't be filtered by issue state.** `/issue_rules/` has no
  `issue_state` filter, and its facets don't count it. The rules table's
  Issue State facet filters and counts only the page it holds, as do Tags,
  Verdicts and Parameters, which the server can't filter by either.
- **History rows have no `effective_expected`.** `/history/` adds `issues`
  but not the suppression flag that `/results/` carries. Because `has_error`
  is already suppression-aware, a suppressed failure in history can't be
  told apart from a pass with a stamp. The history verdict can't reach
  "suppressed".
- **Management without login can't be discovered.** `manage_issues` can be
  listed in a project's `per_conf.NOT_PERMISSION_REQUIRED_ACTIONS`. No
  endpoint a signed-out user can read says so, because `/config/` is itself
  gated. The UI gates every write behind sign-in (`LoginRequired`), which
  is correct for the default config and one click too strict for a project
  that waives it.

## 2. Shapes worth knowing

Not gaps, but places where the obvious reading of the API is wrong.

- **Classify into a new issue needs `project` and `bug_key`.**
  `ClassifyRequestSerializer.validate_issue` validates the raw issue object
  with the full `IssueSerializer` before the view fills in the result's
  project. Without them it returns 400 `issue.project` / `issue.bug_key`
  "required". Send the result's project and `bug_key: null`; the server
  overwrites the project anyway. `POST /issues/` likewise requires the
  `bug_key` key to be present.
- **`result_count` counts stamps, not results.** A result that two of an
  issue's rules both match counts twice. `/runs/{id}/issues/` counts
  distinct results in the run.
- **A created issue answers with zero counts.** `rule_count`,
  `active_rule_count` and `result_count` are list/retrieve annotations.
  `POST /issues/` returns 0 for all three until the list refetches.
- **Rule PATCH rejects matcher keys even if they're unchanged.** Once a rule
  has stamps, the mere presence of `issue`, `test`, `parameters`, `verdicts`
  or `tags` in the body is a 400. The same applies to `bug_key` on an issue
  with classified results. Send only the fields that changed.
- **Reopening doesn't reactivate.** `issues/close/` deactivates every active
  rule. `issues/reopen/` leaves them off, so a reopened issue is `dormant`.
- **`ordering` is comma-separated**, DRF style. Every other multi-value
  filter uses `;`. The server always appends `-id` as a tiebreaker.
- **Facet keys differ.** Issues facets say `categories`, rules facets say
  `category`.
- **`project=abc` on the pickers is a 500**, not a 400. The list endpoints
  validate it; `/tests/picker/` and `/issues/picker/` don't.
- **The classify `matcher` takes values, not flags.** An absent key captures
  that criterion from the result, a present-but-empty one ignores it, and
  `match_*` booleans are read by nothing.
- **Classified-result listings use an envelope.**
  `/runs/{id}/issues/{issueId}/results/` and `/results/?issue=` both return
  `{ results: [...] }`. Their `obtained_result` is
  `{ result_type, verdicts }`, not a string. `issue` is a `;` list.
