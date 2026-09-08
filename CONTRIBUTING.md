[SPDX-License-Identifier: Apache-2.0]::
[SPDX-FileCopyrightText: 2021-2026 OKTET Labs Ltd.]::
# Contributing to Bublik UI

Thanks for contributing! This document covers the three things every change must
satisfy before it can be merged:

1. [Every commit is signed](#signing-your-commits) and carries a verified signature.
2. [Every commit follows Conventional Commits](#commit-messages).
3. [CI passes](#ci-must-pass).

For setting up your environment, see [README.md](./README.md).
For code style, architecture, and naming, see [AGENTS.md](./AGENTS.md).

---

## Signing your commits

**All commits must have verified signatures.** GitHub shows a green **Verified**
badge next to such commits; unsigned commits are not accepted.

Follow GitHub's guide to set this up once:
<https://docs.github.com/en/authentication/managing-commit-signature-verification>

Either GPG or SSH signing works. Once your key is configured and added to your
GitHub account, turn signing on for this repository:

```bash
git config commit.gpgsign true
```

In addition to the cryptographic signature, every commit must carry a
[Developer Certificate of Origin](https://developercertificate.org/) sign-off
trailer. `git commit -s` adds it for you:

```bash
git commit -s -S -m "fix(log): retry transient JSON generation failures"
```

- `-S` produces the signature that gives you the **Verified** badge.
- `-s` appends `Signed-off-by: Your Name <your@email>` to the message.

Check your work before pushing — every commit should print `G` (good signature)
and show a `Signed-off-by:` trailer:

```bash
git log --pretty='%h %G? %s' -n 10
git log -1 --format='%(trailers:key=Signed-off-by)'
```

If you forgot either on the last commit:

```bash
git commit --amend -s -S --no-edit
```

To fix a whole branch at once, rebase it onto `main` with signing and sign-off
applied to every commit:

```bash
git rebase --exec 'git commit --amend -s -S --no-edit' main
```

---

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/). The commit
history feeds [`CHANGELOG.md`](./CHANGELOG.md) directly (via `release-it` and the
`conventionalcommits` preset), so a malformed message means a malformed release note.

> **Note:** there is no commitlint, no git hook, and no CI job checking commit
> messages. This is a convention enforced by reviewers — please get it right
> before opening a PR.

### Format

```
<type>(<scope>): [<sub-scope>] <summary>
<BLANK LINE>
<body wrapped at 72 columns>
<BLANK LINE>
<footers>
```

`(<scope>)` and `[<sub-scope>]` are optional. The body is optional for trivial
changes. Footers are optional but expected whenever an issue exists.

### Types

These are the types recognized by the changelog generator
([`.release-it.cjs`](./.release-it.cjs)):

| Type       | Changelog section            | Use for                                          |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `feat`     | 🚀 New Feature               | A new user-visible capability                     |
| `fix`      | 🐛 Bug Fix                   | A bug fix                                         |
| `style`    | 💅 Polish                    | Visual/UX polish (**not** code formatting)        |
| `refactor` | ♻ Code Refactoring           | Restructuring with no behavior change            |
| `perf`     | ⚡ Performance Improvements   | Making something measurably faster                |
| `test`     | ✅ Tests                     | Adding or fixing tests                            |
| `docs`     | 📝 Documentation             | Documentation only                                |
| `build`    | 👷 Build System              | Build config, bundler, Nx targets                 |
| `ci`       | 🔧 Continuous Integration    | GitHub Actions workflows                          |
| `chore`    | 📦 Chores                    | Dependency bumps, housekeeping, releases          |
| `revert`   | ⏪ Reverts                   | Reverting a previous commit                       |

Anything outside this list will be dropped from the changelog.

Note that `style` here means **visual polish**, matching how it is used in this
repository (`style(history): [form] make input label bolder`). Pure code
formatting belongs in `chore` or is folded into the change that caused it.

### Scopes

The scope names the area of the app you touched. It is optional, but **strongly
recommended** — nearly every commit in this repository has one, and it is what
makes the changelog readable.

Use one of the scopes already established in the history:

| Area                | Scopes                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Pages and features  | `run`, `runs`, `log`, `report`, `history`, `dashboard`, `import`, `measurements`, `projects`, `sidebar`, `settings`, `auth`, `analytics`, `faq`, `net`, `result` |
| Shared / platform   | `ui`, `api`, `router`, `types`, `hooks`, `utils`, `charts`, `icons`, `form`                                                     |
| Repository-level    | `config`, `build`, `ci`, `deps`, `docker`, `docs`, `release`, `storybook`                                                        |

Most of these map to a directory under `libs/bublik/features/`, `libs/shared/`,
`libs/services/`, or `apps/`. If your change does not fit any of them, prefer the
name of the library you edited over inventing a new word.

A few conventions worth knowing:

- **`run` and `runs` are different things** — `run` is the single-run page
  (`libs/bublik/features/run`), `runs` is the runs list (`libs/bublik/features/runs`).
  The same holds for `report` vs `reports`. These are not typos.
- Prefer the singular `config` and `log` over the `configs`/`logs` variants that
  also appear in history.
- **Multiple scopes** are joined with a comma and no space:

  ```
  style(dashboard,run): align toolbar spacing
  ```

- **Sub-scopes** go in square brackets right after the colon, to name a component
  or sub-area within the scope:

  ```
  feat(run): [table] add ability to reorder columns by dragging them
  style(history): [form] make input label bolder
  refactor(runs): [progress] use shared `ColumnsVisibility`
  ```

- Omit the scope entirely for genuinely cross-cutting changes.

### Summary line

- **Imperative mood** — "add", "fix", "remove", not "added" or "adds".
- **Lowercase** after the colon.
- **No trailing period.**
- Backticks are fine for identifiers: ``fix(ui): [pagination] respect `disabled` prop``.
- **Keep it at 72 characters or fewer.** 100 is a hard limit — if you cannot
  describe the change in 72 characters, the detail belongs in the body.

```
✅ feat(sidebar): display version information next to "Bublik" label
✅ fix(history): default to latest three months
❌ Fixed the bug where the sidebar was showing the wrong version number.
❌ feat: stuff
```

### Body

Separate the body from the summary with a blank line and **wrap it at 72
columns**.

Write **why before what**: start with the context or root cause, then describe
what the change does about it. The diff already shows what changed; the body
exists to explain what the diff cannot.

```
fix(dashboard): manual refresh not updating run statuses

The refresh button previously refetched only the undated dashboard
query, while visible tables used separate date-specific RTK Query cache
entries. This left run statuses stale until a full browser reload.

Invalidate all active dashboard queries on manual refresh and skip
unnecessary date-specific queries when no date is selected.
Add regression tests covering both behaviors.
```

A `Changes:` bullet list is an accepted alternative when a change has several
independent parts:

```
feat(sidebar): display version information next to "Bublik" label

Changes:
- Display UI version next to "Bublik" label
- Show hover card on hover with full version information (UI and API)
- Remove version info from FAQ page
- Remove version info from settings modal
```

Small, self-explanatory changes can skip the body entirely.

### Footers

Footers go last, after a blank line, one per line.

**Linking issues.** Issues live in
[`ts-factory/bublik-ui`](https://github.com/ts-factory/bublik-ui/issues), so a
bare `#123` resolves there. Which keyword you use depends on the relationship:

| Footer                  | Meaning                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `Fixes #123`            | This commit **closes** the issue. GitHub closes it automatically on merge. |
| `Issue: #123`           | This commit **relates to** the issue but does not close it.           |
| `Related: <url>`        | A cross-repository reference — e.g. the backend, `ts-factory/bublik`. |

Use `Fixes` when the issue is fully resolved, and `Issue:` when your commit is
one step of a larger issue or otherwise leaves work behind. Use a full URL for
anything outside `ts-factory/bublik-ui`:

```
Related: https://github.com/ts-factory/bublik/pull/316
```

**Sign-off** always goes last:

```
Signed-off-by: Your Name <your@email>
```

**Breaking changes.** Mark them with a `!` before the colon, a `BREAKING CHANGE:`
footer, or both:

```
feat(api)!: drop support for the v1 results endpoint

BREAKING CHANGE: clients pinned to /api/v1/results must migrate to /api/v2.
```

### A complete example

This is a real commit from the history that exercises every rule above:

```
fix(log): retry transient JSON generation failures

On-demand log JSON can be served while the log server is still writing
the file, causing response.json() to fail and leaving the selected test
in an error state until navigation retries it.

Retry transient HTTP and JSON parsing failures with bounded, abort-aware
backoff. Preserve immediate cancellation and non-retryable client
errors, and return an actionable error when generation never stabilizes.

Issue: #573
Signed-off-by: Danil Kostromin <danil.kostromin@icloud.com>
```

---

## CI must pass

Every pull request against `main` runs
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml). All five jobs must be
green before a PR can be merged. Each one has a local equivalent — run them
before you push:

| CI job                  | Command                       | Fix locally with        |
| ----------------------- | ----------------------------- | ----------------------- |
| `lint`                  | `pnpm run lint`               | `pnpm run lint`         |
| `test`                  | `pnpm run test`               | `pnpm run test`         |
| `format-check`          | `pnpm run format:check`       | `pnpm run format`       |
| `check-build`           | `pnpm run build`              | `pnpm run build`        |
| `check-json-logs-build` | `pnpm run bublik-json:build`  | `pnpm run bublik-json:build` |

### Toolchain

CI runs **Node 24** (see [`.nvmrc`](./.nvmrc)) and **pnpm 10**. Use the same
versions locally — `preinstall` runs `npx only-allow pnpm`, so `npm install` and
`yarn install` are rejected outright.

```bash
nvm use          # or: fnm use
pnpm install
```

### Notes

- **There is no separate typecheck step.** `pnpm run build` is the type-safety
  gate — a type error fails the build.
- **End-to-end tests do not run in CI.** If you touch something they cover, run
  them yourself: `pnpm run bublik:e2e` (or `pnpm run bublik:e2e-ui` for the
  Playwright UI).
- For faster iteration on a large workspace, use the `affected` targets, which
  only process projects touched by your branch:

  ```bash
  pnpm run affected:lint
  pnpm run affected:test
  pnpm run affected:build
  ```

---

## Pull requests

### Branches

Branch off `main`. The preferred naming pattern is:

```
<your-github-username>/<issue-number>-<short-slug>
```

for example `okt-limonikas/449-dimm-parameters`. If there is no issue, drop the
number: `okt-limonikas/add-agents-file`.

### Keep history linear

**This repository has no merge commits.** Bring your branch up to date by
rebasing, never by merging `main` into it:

```bash
git fetch upstream
git rebase upstream/main
```

Remember that a rebase rewrites commits, so re-sign them if your rebase dropped
the signatures (see [Signing your commits](#signing-your-commits)).

### One logical change per commit

Split unrelated work into separate commits, each with its own message and its own
issue link. A branch with five focused commits is much easier to review — and to
revert — than one with a single "fix everything" commit. Squash fixup commits
into the commit they belong to before requesting review:

```bash
git rebase -i upstream/main
```

### Before you open the PR

- [ ] Every commit is signed (`%G?` is `G`) and signed off.
- [ ] Every commit message follows the format above.
- [ ] Issues are linked with `Fixes #N` or `Issue: #N`.
- [ ] All five CI commands pass locally.
- [ ] New source files carry the SPDX header (see
      [AGENTS.md § File Headers](./AGENTS.md#file-headers)).

Open the PR against `main`. If you are reporting a problem rather than fixing
one, use the [issue templates](./.github/ISSUE_TEMPLATE/) — there is a
`🐛 Bug Report` and a `✨ Feature Request` form.

---

## Code style

[AGENTS.md](./AGENTS.md) is the full style guide: path aliases, the
Container/Component pattern, naming conventions, RTK Query usage, and Nx module
boundaries. Two things it is easy to miss:

**Every new source file needs an SPDX header**, in the exact form given in
[AGENTS.md § File Headers](./AGENTS.md#file-headers). Nothing in CI checks
this, but reviewers do.

**Formatting is Prettier's job** — tabs, single quotes, no trailing commas (see
[`.prettierrc`](./.prettierrc)). Run `pnpm run format` rather than adjusting
style by hand. Markdown is excluded from Prettier, so this file and other `.md`
files are formatted manually.

---

## License

By contributing, you agree that your contributions will be licensed under the
[Apache License 2.0](./LICENSE), and you certify the
[Developer Certificate of Origin](https://developercertificate.org/) by signing
off your commits.
