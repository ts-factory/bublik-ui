<!--
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2024-2026 OKTET LTD
-->

# Feature files

Every route in `apps/bublik/src/app/router.tsx` has a `.feature` file here describing
its user stories in Gherkin, and every `Scenario` is backed by a real Playwright test in
`apps/bublik/e2e/**/*.spec.ts`.

## The contract

| Gherkin | Playwright |
| --- | --- |
| `Feature: <name>` | the spec file (or a `test.describe` inside it) |
| `Background:` | `test.beforeEach` |
| `Scenario: <name>` | `test('<name>', …)` — the name is used **verbatim** |
| `Scenario Outline: <name>` + `Examples` | `test.describe('<name>')` with one `test()` per row, titled with the row's **first column** |
| `Given` / `When` / `Then` / `And` / `But` | `given()` / `when()` / `then()` / `and()` / `but()` from `../support/gherkin` (thin `test.step` wrappers) |
| `@tag` on a scenario | `test('<name>', { tag: ['@tag'] }, …)` |

Rules that the checker enforces:

- Scenario names are **globally unique** across all feature files.
- Every scenario (and every `Examples` row) has a matching test title.
- Titles must be static strings — a template literal with `${…}` cannot be traced.

## Example

```gherkin
Feature: Dashboard

  @needs-nok
  Scenario: Dashboard NOK counter opens the run with unexpected rows previewed
    Given a NOK run from the fixture manifest is on the dashboard
    When I click the run's NOK counter
    Then the run page for that run is open
```

```ts
import { test } from './support/test';

import { and, given, then, when } from './support/gherkin';

test(
	'Dashboard NOK counter opens the run with unexpected rows previewed',
	{ tag: ['@needs-nok'] },
	async ({ page }) => {
		await given('a NOK run from the fixture manifest is on the dashboard', async () => {
			/* … */
		});
		await when("I click the run's NOK counter", async () => {
			/* … */
		});
		await then('the run page for that run is open', async () => {
			/* … */
		});
	}
);
```

## Writing scenarios

- **Steps describe user intent, not selectors.** "I click the run's NOK counter", not
  "I click `[data-testid=dashboard-cell-link]`". Selectors belong in `e2e/pages/*.ts`.
- **Data comes from the fixture manifest**, never from hardcoded run ids. Use
  `requireManifest()` plus the helpers in `support/sample-cases.ts`, `support/e2e-data.ts`.
- **Never `test.skip` when fixture data is missing.** Wrap the lookup in
  `requireCapability(value, reason)` (`support/capabilities.ts`) so the run fails loudly —
  a silently skipped scenario is worse than no scenario.
- **`test` comes from `support/test`, not `@playwright/test`.** That is where the
  signed-in session a scenario runs with is minted; see `support/session.ts` for why
  the one the `auth` setup project captured does not survive a full run.
- **Assertions live in the page object.** Specs that delegate every assertion keep the
  `// eslint-disable-next-line playwright/expect-expect` comment, as the older specs do.
- Capability tags in use: `@smoke`, `@admin`, `@needs-nok`, `@needs-measurements`, `@needs-report`, `@needs-log-pagination`, `@needs-long-log`.
- `@url-params` marks the scenarios that pin a page's query-string contract, so the
  parameter surface can be checked on its own (`playwright test --grep @url-params`).
  Each page's inventory of parameters lives beside its page object as a
  `*_URL_PARAMS` table (`pages/dashboard-page.ts`, `pages/runs-page.ts`, …), and the
  shared reading helpers are in `support/url-params.ts`. The compressed sidebar
  state (`_s`) is decoded by `support/sidebar-state.ts` — it is where the runs
  selection lives, so it is not readable as a plain parameter.
- Area tags name the page a scenario belongs to, so one page's suite can be run on its own
  (`playwright test --grep @dashboard`). In use: `@dashboard`, `@history`, `@runs`,
  `@run`, `@log`, `@measurements`, `@report`.

## Checking

```bash
pnpm run e2e:features:check     # every scenario has a test, no duplicate names
```

It also runs as part of `nx run bublik:e2e` and `task e2e:types:check`.
