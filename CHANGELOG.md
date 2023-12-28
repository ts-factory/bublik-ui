[SPDX-License-Identifier: Apache-2.0]::
[SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd.]::

### [0.37.2](#) (2023-12-28)

### 🐛 Bug Fix

* **auth:** display field errors for reset password view ([ce6eb52](#))

### [0.37.1](#) (2023-12-26)


### 🐛 Bug Fix

* **preferences:** allow current password less than 8 chars ([ec94866](#))

## [0.37.0](#) (2023-12-26)


### 🐛 Bug Fix

* **auth:** double ref ([be37aad](#))
* **auth:** not displaying error for some forms ([4402d31](#))


### 🚀 New Feature

* **admin:** add toast to notify admin when sent email message ([c7e3980]())

## [0.36.0](#) (2023-12-26)


### 🚀 New Feature

* **auth:** add errors to reset password/change password ([f13770c](#))

### [0.35.1](#) (2023-12-26)


### ♻ Code Refactoring

* **ui:** [toaster] move to sonner toaster ([62054bb](#))


### 🐛 Bug Fix

* **dashboard:** date-picker cut on overflow in some modes ([ae58964](#))
* **history:** resetting filters resets date ([aec6a76](#))
* **run:** old config for toast ([0d8376b](#))


### 📦 Chores

* **build:** upgrade lockfile ([474feb0](#))

## [0.35.0](#) (2023-12-25)


### 🐛 Bug Fix

* **history:** resetting filters reset test name ([3583a23](#))
* **history:** resetting filters resets date ([bd84bb0](#))


### 💅 Polish

* **history:** add border to run details ([ef3c5cf](#))


### 📦 Chores

* **admin,runs:** add empty and error states for queries ([199cf9b](#))
* **admin,runs:** cleanup ([65ba623](#))
* **admin:** add toast for successfully updating user ([9956060](#))
* **admin:** sort users table by default ([a9b7854](#))


### 🚀 New Feature

* **preferences:** add ability to edit profile ([ba46992](#))

### [0.34.1](#) (2023-12-22)


### 📦 Chores

* **history:** fix typo in placeholder ([9d9b4bf](#))


### 🐛 Bug Fix

* **admin:** fix some errors now showing for form ([b07eac6](#))

## [0.34.0](#) (2023-12-22)


### 💅 Polish

* **import:** improve log scrollbars ([aa35386](#))


### ♻ Code Refactoring

* **runs,history:** add `tag_expr` to forms ([f14c6e2](#))
* **users:** remove ability to change user role ([cc9f8b5](#))
* **users:** rename "email verified" to isActive flag ([11aae23](#))


### 🚀 New Feature

* **history:** add multiple expression params to form ([4f4cf34](#))


### 🐛 Bug Fix

* **auth:** change status code for retrying to 403 ([fdab344](#))
* **auth:** display error for update user form ([63286ba](#))
* **auth:** display server errors for create-user/change-password forms ([682f2a5](#))
* **history:** move inputs to respective zones of global search form ([fdada14](#))


### ✅ Tests

* **auth:** update snapshot tests ([c89ec34](#))


### 📦 Chores

* **auth:** remove old register endpoint ([dcd8b12](#))

### [0.33.1](#) (2023-12-19)


### 👷‍ Build System

* **ci:** upgrade actions to latest versions ([563e5cb](#))

## [0.33.0](#) (2023-12-18)


### 👷‍ Build System

* **ci:** add ci on pull request ([161696f](#))


### 🚀 New Feature

* **history:** add run details for point in modal ([#476](#)) ([02f5956](#))

### [0.32.3](#) (2023-12-15)


### 🐛 Bug Fix

* **dashboard:** [table] provide default date in case fetching fails ([d046e75](#))


### 📦 Chores

* **history:** sync filter state with global search form ([9635cea](#))

### [0.32.2](#) (2023-12-13)


### 👷‍ Build System

* **config:** fix disable sourcemaps ([a7d8d85](#))

### [0.32.1](#) (2023-12-13)


### 👷‍ Build System

* **config:** disable sourcemaps ([546f283](#))


### 💅 Polish

* **import:** change text color for import logs ([c65cf37](#))
* **import:** make table take whole width ([e4f4fa9](#))


### ✅ Tests

* **import:** update snapshots ([f860501](#))
* **user-preferences:** remove broken test ([3767917](#))

## [0.32.0](#) (2023-12-13)


### ♻ Code Refactoring

* **runs:** [stats] extract click logic on charts into functions ([60ebe6c](#))


### 🚀 New Feature

* **import:** add import log viewer modal ([69360f1](#))


### ✅ Tests

* **import:** upgrade snapshot tests ([de463ff](#))


### 💅 Polish

* **ui:** fix renamed class not working ([cc286d4](#))

## [0.31.0](#) (2023-12-06)


### ♻ Code Refactoring

* **charts:** reduce bundle size ([2cfcb65](#))


### 💅 Polish

* **dashboard:** [notes] break overflowing words ([b16780a](#))


### 🚀 New Feature

* **runs:** [stats] add bar chart with tests by day ([ab0eca9](#))
* **runs:** add chart page ([#475](#)) ([5bcc183](#))

## [0.30.0](#) (2023-11-29)


### ♻ Code Refactoring

* **dashboard:** full dashboard refactor ([#474](#)) ([7ca9627](#))


### 📦 Chores

* **dashboard:** extract subrow component ([16b3224](#))
* **help:** upgrade react-flow ([908ecd4](#))
* **ui:** cleanup ([4d9a0cc](#))
* **ui:** upgrade cva ([d26651b](#))


### ✅ Tests

* **dashboard:** add tests for search bar and mode picker ([a28341c](#))
* **history:** fix snapshot test ([f4a301e](#))
* **ui:** update snapshots for new app shell ([a9a87d7](#))


### 💅 Polish

* **404:** fix go to dashboard styles ([a2c1754](#))
* **changelog:** fix missing styles/fonts ([b77e421](#))
* **config:** extend height ([88dbe8b](#))
* **dashboard:** [table] fix border color ([aedcbe6](#))
* **dashboard:** [table] fix border-radius for row ([50ef904](#))
* **dashboard:** fix arrow direction of sort ([0e0b2ab](#))
* **history:** [aggregation] add underline to links on hover ([300bc77](#))
* **layout:** change overflow styles for app shell ([7f2fdb2](#))
* **runs:** add underline to run links ([2b8d492](#))


### 🐛 Bug Fix

* **dashboard:** [table] displaying old date ([770d947](#))
* **dashboard:** date changing when no today present ([11976f9](#))
* **dashboard:** display column with multiple values ([2a3de5b](#))
* **dashboard:** infinite loading on error ([1ec84b6](#))
* **dashboard:** not invalidating dashboard by day ([098723e](#))
* **dashboard:** showing loading indicator when mode and query failed ([f019999](#))
* **import:** broken select fields on `all` value ([f9c6bc7](#))
* **log:** cva using old API ([cc156a8](#))


### 🚀 New Feature

* **dashboard:** [table] add link to bug url ([a09f85c](#))
* **dashboard:** [table] ask for confirmation before removing note ([f4acc8b](#))
* **dashboard:** add error and empty state handling ([e7e339b](#))
* **dashboard:** add prefetching next/previous day ([cd92863](#))
* **dashboard:** prefetch nok for expand button on hover ([800e423](#))

## [0.29.0](#) (2023-11-22)


### 🚀 New Feature

* **deploy:** add new bublik instance for base path `/private/bublik` ([ef0bbad](#))

## [0.28.0](#) (2023-11-22)


### 🚀 New Feature

* **auth:** add ability for user to change password ([b0a843b](#))
* **auth:** add new api endpoints for changing password and import token ([2fae3af](#))
* **import:** add ability to generate import token ([35a3877](#))


### 💅 Polish

* **auth:** change login/logout to sign in/sign out ([f1074b9](#))
* **ui:** [button] add hover styles for destructive button ([3fa1ea3](#))
* **ui:** [select] add checkbox indicator to select ([ee8e13c](#))


### ✅ Tests

* **auth:** fix tests for login form ([2157380](#))

### [0.27.1](#) (2023-11-15)

## [0.27.0](#) (2023-11-13)


### 🚀 New Feature

* **log:** add all pages button to paginated log ([3ed7b2e](#))


### 💅 Polish

* **admin:** add close button to user edit/create modals ([81abf57](#))
* **error:** fix centering of error ([800b182](#))
* **settings:** change settings.layout.tsx ([2028e37](#))


### ✅ Tests

* **auth:** fix snapshot tests for login forms ([802b1a6](#))
* **e2e:** upgrade playwright ([3196482](#))


### 📦 Chores

* **admin:** remove onClose callback ([cb937cd](#))
* **auth:** fix schemas ([2e4a7ae](#))


### 🐛 Bug Fix

* **api:** check if trailing slash disabled when search params present ([f03c4b6](#))
* **app:** missing loader ([6715ce9](#))
* **history:** refresh page on reset filters click ([aba4c68](#))
* **log:** wrong url building for json log ([9d0b743](#))

## [0.27.0-beta.3](#) (2023-11-10)


### 🐛 Bug Fix

* **auth:** disable caching for user query ([b6ae8dc](#))


### 🚀 New Feature

* **auth:** add ability to reset passwords ([2bbdb28](#))


### ✅ Tests

* **auth:** fix snapshot for change password form ([3d32d8f](#))

## [0.27.0-beta.2](#) (2023-11-02)


### 🐛 Bug Fix

* **log:** remove trailing slash from json log URL ([5d57200](#))


### ⏪ Reverts

* Revert chore(auth): add logs to auth ([dbad9f3](#))


### ♻ Code Refactoring

* **auth:** change logic for determining if user is logged in ([729a071](#))


### 📦 Chores

* **auth:** remove auth slice ([fb75a6c](#))
* **profile:** fix typo ([36fe3f1](#))

## [0.27.0-beta.1](#) (2023-11-01)


### 📦 Chores

* **auth:** add logs to auth ([37597a9](#))

## [0.27.0-beta.0](#) (2023-11-01)


### ♻ Code Refactoring

* **router:** upgrade router to latest version and use data router ([6d4cbc9](#))


### 🚀 New Feature

* **admin:** add CRUD users table for admins ([#471](#)) ([0b1918f](#))
* **ui:** [error-boundary] improve error handling ([#470](#)) ([a3ec687](#))


### 🐛 Bug Fix

* **auth:** user profile header casing ([157dfb8](#))
* **ui:** make error prop option for 404 page ([4a1e14a](#))

## [0.26.0](#) (2023-10-20)


### 💅 Polish

* **dashboard:** fix border-radius not being consistent in header ([9711d95](#))


### ♻ Code Refactoring

* **router:** remove all lazy loaded components ([52987d3](#))


### 🚀 New Feature

* **router:** start loading whole app with spinner ([f1e2a79](#))
* **ui:** [form-alert]: add form alert component ([27ef388](#))


### 📦 Chores

* **changelog:** [confetti] remove changelog modal ([9899025](#))


### 🐛 Bug Fix

* **auth:** [login-form] display error when invalid credentials provided ([c24a570](#))
* **run:** [page] not prefetching tree in log page ([9994167](#))

### [0.25.1](#) (2023-10-18)


### 📦 Chores

* **import:** add 4 default rows for import ([a9190bd](#))
* **sidebar:** remove tests link from sidebar ([d188ea7](#))


### 💅 Polish

* **log:** fix floating button overlaying toolbar popovers ([f9415ad](#))
* **run:** add styles for sorted columns ([5bfb90d](#))

## [0.25.0](#) (2023-10-13)


### 🚀 New Feature

* **ui:** [sidebar] improve scrollbar behaviour for sidebar ([310035e](#))


### 🐛 Bug Fix

* **types:** remove runs config type from router ([4ba6852](#))


### 📦 Chores

* **nx:** migrate to latest nx ([7556574](#))
* **ui:** fix some react keys logic ([14432d5](#))

### [0.24.1](#) (2023-10-12)


### 🐛 Bug Fix

* **diff:** improve error message when no ids selected ([9da9af9](#))

## [0.24.0](#) (2023-10-11)


### ♻ Code Refactoring

* **log:** expand log to level 1 by default ([adaa0d2](#))
* **log:** extract pagination logic into hooks ([518eccc](#))
* **log:** improve error messages for JSON logs ([14adf94](#))
* **log:** re-arrange log levels via weight parameter ([1a9fca0](#))


### 📦 Chores

* cleanup old todos ([c9ddc48](#))
* **log:** change title of log level ([6991c01](#))


### 🐛 Bug Fix

* **import:** base query not adding prefix in queryFn ([b4a3adc](#))
* **log:** animation not working for highlighting row ([d1220bf](#))
* **log:** properly handle errors from JSON api ([4d3e73a](#))


### 🚀 New Feature

* **log:** add floating toolbar ([5cf1c4a](#))


### 💅 Polish

* **log:** add partially expanded row color ([09a0dc8](#))
* **log:** emphasize floating toolbar button styles ([75a24c0](#))
* **log:** fix styling for wrapped file block ([ff187ca](#))
* **log:** improve line breaking for pre-formatted elements ([06bfba5](#))
* **log:** improve word breaking ([8edd8ab](#))
* **log:** move log bgs to css variables ([4ef5d27](#))
* **ui:** [button] missing border in disabled state ([e3f31b5](#))
* **vars:** change all colors to hsl and allow opacity change ([15b9f1e](#))
* **vars:** fixs overlay opacity ([c9e1824](#))


### ✅ Tests

* **ui:** update snapshot tests for new css vars ([4d5a9bb](#))

### [0.23.3](#) (2023-10-03)


### 🐛 Bug Fix

* **import:** double slash in pathname ([028ea4a](#))

### [0.23.2](#) (2023-10-02)


### 🐛 Bug Fix

* **api:** wrong root url building ([ee32781](#))

### [0.23.1](#) (2023-10-02)


### 🐛 Bug Fix

* **api:** missing trailing slash for base url ([a0bc8c5](#))

## [0.23.0](#) (2023-10-02)


### 📦 Chores

* upgrade nx to latest version ([46d8d20](#))


### 🚀 New Feature

* **dashboard:** add project name to tab title ([b4f3066](#))

## [0.22.0](#) (2023-10-01)


### 🚀 New Feature

* **auth:** add initial auth logic  ([#464](#)) ([97da705](#))


### 🐛 Bug Fix

* **import:** wrong parsing of URL ([96e82e0](#))


### 📦 Chores

* **log:** cleanup type imports ([7874b50](#))

### [0.21.1](#) (2023-09-18)


### 🐛 Bug Fix

* **runs:** not reading dates from URL ([8c7ad1c](#))
* **ui:** [badge-box] preventing delete chart in inputs ([4b171c2](#))

## [0.21.0](#) (2023-09-13)


### ♻ Code Refactoring

* **import:** upgrade form to support all import features ([#462](#)) ([2a92935](#))


### 🚀 New Feature

* **auth:** add initial login forms/pages ([#460](#)) ([8722379](#))
* **history:** add hover card with links to actions column ([#463](#)) ([7b7d418](#))


### 🐛 Bug Fix

* **history:** export to form value type ([e0552d8](#))
* **log:** incorrect color for error, warn levels ([0860697](#))

### [0.20.1](#) (2023-09-06)


### 💅 Polish

* **log:** improve row colors ([535c92b](#))


### ♻ Code Refactoring

* **history:** [form] add tags expression input ([a62bdd0](#))
* **history:** extract expressions into separate input ([#461](#)) ([221397a](#))

## [0.20.0](#) (2023-08-16)


### 💅 Polish

* **sidebar:** add hover effect for logo button ([a11349a](#))
* **ui:** [button] fix disabled text color ([e9df017](#))


### 🐛 Bug Fix

* **measurements, history:** limit max results ids by 6000 ([024bbb1](#))
* **run:** [table] disable expand/preview buttons when no NOK present ([461f0b3](#))
* **ui:** [form] remove old type ([ac9d5f7](#))


### 🚀 New Feature

* **measurements:** add separate screen for combined charts ([afa3680](#))
* **ui:** allow creating custom errors ([fae27e1](#))


### 📦 Chores

* **measurements:** remove old chart modes ([8656714](#))
* **test:** update history-error snapshots ([303a55a](#))

## [0.19.0](#) (2023-08-02)


### 🚀 New Feature

* **log:** add timestamp delta with anchor ([616b73c](#))

## [0.19.0-beta.0](#) (2023-07-24)


### 🐛 Bug Fix

* **log:** time delta not working correctly with timestamps ([e6ef2c4](#))
* **ui:** [tags-box-input] removing selected items ([ed6f41e](#))


### ♻ Code Refactoring

* **ui:** [chart] replace chart toolbar with updated ([c3a6a30](#))


### 💅 Polish

* **history:** [plot-list] add shadow to header when sticky ([0a4403f](#))
* **history:** [refresh] fix animation origin ([23c81da](#))
* **measurements:** improve measurements chart layout ([36d7ae9](#))
* **ui:** [button] don't allow click when loading ([4cc0967](#))
* **ui:** [chart] add more space in fullscreen mode ([faac01e](#))
* **ui:** [export-button] fix icon and styles ([28d2cb3](#))
* **ui:** [link] missing animation when loading ([5e6c55a](#))


### 📦 Chores

* **log:** add timestamp mock ([b926195](#))
* **measurements:** [chart] remove plot with series ([012d1e4](#))
* **ui:** [chart] adjust icon sizes ([392a963](#))
* **ui:** [chart] improve voice over labels ([cc97fc2](#))


### 🚀 New Feature

* **history, measuremensts:** add fullscreen chart ([fda3f68](#))
* **history:** [chart] add ability to view charts with multiple Y axises ([#456](#)) ([5aa8ad0](#))
* **ui:** [toolbar] add toolbar component ([aa142d5](#))


### ✅ Tests

* **history, import:** update snapshot tests ([0fbda34](#))

## [0.18.0](#) (2023-07-07)


### ♻ Code Refactoring

* **ui:** [button] replace all buttons with updated one ([6f31418](#))


### 🚀 New Feature

* **log:** add ability to display timestamp delta ([#446](#)) ([1391225](#))
* **log:** add command to generate log schema ([6fc71c5](#))
* **measurements:** add toggle to show/hide sliders ([#445](#)) ([1262867](#))
* **runs:** add new badge input ([#444](#)) ([901ba60](#))


### 📦 Chores

* **history:** remove stacked mode from history ([ce02b08](#))
* **run:** add storybook handlers ([33c71b7](#))


### 💅 Polish

* **history:** improve chart layout on smaller screens ([8c3993e](#))
* **measurements:** add right space to chart ([9c786da](#))


### 🐛 Bug Fix

* **log:** change default test id to tin ([#447](#)) ([679858d](#))
* **runs:** duplicate run data badges with same key ([ac15c5e](#))

### [0.17.2](#) (2023-06-14)


### 💅 Polish

* **runs:** return shadow sticky scroll ([be58ed0](#))


### 🐛 Bug Fix

* **changelog:** adapt to new deploy info JSON ([4a4bf34](#))

### [0.17.1](#) (2023-06-09)


### 🐛 Bug Fix

* **dashboard, runs:** clicking on NOK with ctrl pressed not expanding results on linux ([e4ea7cd](#))
* **log:** pagination for first page is not fetching correct data ([c3a7b9b](#))


### 💅 Polish

* **log:** add pagination at the top of the table ([6cb7937](#))

## [0.17.0](#) (2023-06-09)


### 📦 Chores

* **dev:** add node version ([a33ede7](#))
* **log:** add storybook story for log tree ([d81fbd0](#))


### 💅 Polish

* **log:** adjust styles for log meta header ([33b3efd](#))
* **log:** adjust table styles ([6d3e3fb](#))
* **log:** fix unexpected icon size ([e0461c6](#))


### 🐛 Bug Fix

* **storybok:** fix old icon stories ([76e6dad](#))


### ♻ Code Refactoring

* **changelog:** add full changelog ([544e319](#))
* **log:** rework filtering UI and parameters table ([#443](#)) ([460357f](#))


### 🔧 Continuous Integration | CI

* **pnpm:** add auto-install-peers flag ([bce8369](#))
* **release:** don't ignore prerelease tags ([455b479](#))

## [0.17.0-beta.0](#) (2023-05-25)


### 📝 Documentation

* **config:** adjust docs to new build pipeline ([216af6a](#))


### 👷‍ Build System

* **size:** extract echarts chunk manulally to reduce size ([ba312fe](#))
* **vite:** add ability to specify remote JSON logs storage ([6f915d4](#))


### 🔧 Continuous Integration | CI

* **build:** fix failing to parse passed args ([af3151e](#))
* **build:** skip changelog for beta releases ([72801ed](#))


### ♻ Code Refactoring

* **icon:** convert all icons to `.svg` ([#439](#)) ([d056f89](#))
* **run:** change displayed run columns ([1896f7e](#))
* **ui:** replace all skeletons with component ([96b32ba](#))


### 🐛 Bug Fix

* **history:** lazy loading modules ([5f9e6ed](#))
* **log:** [frame] not saving line number on subsequent navigations ([4e185aa](#))
* **runs:** date range picker no label warning ([4b9f05f](#))
* **runs:** importing from lazy loaded module ([4c8fe1a](#))


### 💅 Polish

* **animation:** [dialog] add animation to dialog content ([cf17bf6](#))
* **changelog:** add confetti explosion on new release ([645202e](#))
* **history:** add animation to context menu ([3c7242e](#))
* **history:** align reset buttons with close button ([4957228](#))
* **import:** fix overflow scrollbars ([16ffa15](#))
* **import:** make modal title bigger ([bb84145](#))
* **run:** [table] add group columns with border ([af37d1e](#))
* **run:** add background on row hover ([ed74c97](#))
* **run:** uppercase table columns ([abcf61b](#))
* **tooltip:** change shadow ([46e3238](#))


### 🚀 New Feature

* **ci:** add changelog to the ui ([#434](#)) ([a7109ff](#))
* **faq:** add latest tag info ([cbe7b4e](#))
* **formatting:** convert formatting to use tabs ([4b348d1](#))
* **log:** add experimental support for JSON logs ([677fd29](#))
* **log:** add initial support for displaying log content ([d8ebcb1](#))
* **log:** add pagination support to schema ([6a1af72](#))
* **log:** add pagination support to schema ([36706ae](#))
* **run:** [results-table] add key list with urls ([83784ef](#))
* **run:** add column visibility toggle to run/diff pages ([ab0d28e](#))
* **run:** add tooltips to details/toolbar buttons ([73c2bb5](#))
* **sidebar:** add collapsible links ([1295902](#))
* **sidebar:** show/hide sidebar on `s` keypress ([ef529b8](#))
* **ui:** add dropdown menu component ([cea395f](#))
* **ui:** add skeleton component ([cfd9b98](#))


### ⏪ Reverts

* **log:** [frame] not saving line number on navigations ([f77e166](#))
* **run:** rollback renaming column ids for run table ([ad334d5](#))


### ✅ Tests

* **ci:** fix lint command ([0bf7f43](#))
* **e2e:** add playwright support ([0ec5dfe](#))
* **history:** add some snapshot tests to history ([7aa7dba](#))
* **import:** fix snapshot for overflow table ([a9d5360](#))
* **import:** fix snapshot test for loading table state ([518a2e6](#))
* **log:** remove build target from lib ([fe240a7](#))
* **run:** fix div instead of button when no url present ([63dfee6](#))
* **ui:** [clock] fix timezone issue in CI ([897a578](#))
* **ui:** [icon] fix svgr not loading in vitest ([365b5e7](#))


### 📦 Chores

* **build:** migrate from webpack to vite ([749a97b](#))
* **build:** upgrade vite to v4.3 ([177fd89](#))
* **changelog:** [modal] disable modal until checkbox is ready ([ca82635](#))
* **changelog:** lazy load changelog ([03d0276](#))
* **ci:** add new commit types ([13730fa](#))
* **ci:** fix compare url ([eff2eb6](#))
* **ci:** update pipeline for manual releases ([425702d](#))
* **deploy:** adjust api for new JSON format ([e4713a4](#))
* **env:** move all env configs to bublik app config ([e353093](#))
* **log:** add run id to tab title ([8c88283](#))
* **log:** remove zod schema converting to JSON from production bundle ([24f2b3f](#))
* **nx:** upgrade nx to 16.2.1 ([6184eaf](#))
* **release:** v0.16.0 ([8d0b1cd](#))
* **test:** update snapshots ([4839df8](#))

## [0.15.0](#) (2023-05-18)


### 📝 Documentation

* **config:** adjust docs to new build pipeline ([216af6a](#))


### 📦 Chores

* **build:** migrate from webpack to vite ([749a97b](#))
* **build:** upgrade vite to v4.3 ([177fd89](#))
* **changelog:** lazy load changelog ([03d0276](#))
* **ci:** add new commit types ([13730fa](#))
* **ci:** fix compare url ([eff2eb6](#))
* **ci:** update pipeline for manual releases ([425702d](#))
* **env:** move all env configs to bublik app config ([e353093](#))
* **log:** add run id to tab title ([8c88283](#))
* **test:** update snapshots ([4839df8](#))


### 💅 Polish

* **animation:** [dialog] add animation to dialog content ([cf17bf6](#))
* **changelog:** add confetti explosion on new release ([645202e](#))
* **history:** add animation to context menu ([3c7242e](#))
* **import:** fix overflow scrollbars ([16ffa15](#))
* **import:** make modal title bigger ([bb84145](#))
* **run:** uppercase table columns ([abcf61b](#))
* **tooltip:** change shadow ([46e3238](#))


### ✅ Tests

* **ci:** fix lint command ([0bf7f43](#))
* **e2e:** add playwright support ([0ec5dfe](#))
* **history:** add some snapshot tests to history ([7aa7dba](#))
* **import:** fix snapshot for overflow table ([a9d5360](#))
* **import:** fix snapshot test for loading table state ([518a2e6](#))
* **log:** remove build target from lib ([fe240a7](#))
* **run:** fix div instead of button when no url present ([63dfee6](#))


### ♻ Code Refactoring

* **run:** change displayed run columns ([1896f7e](#))
* **ui:** replace all skeletons with component ([96b32ba](#))


### ⏪ Reverts

* **run:** rollback renaming column ids for run table ([ad334d5](#))


### 👷‍ Build System

* **size:** extract echarts chunk manulally to reduce size ([ba312fe](#))
* **vite:** add ability to specify remote JSON logs storage ([6f915d4](#))


### 🔧 Continuous Integration | CI

* **build:** skip changelog for beta releases ([72801ed](#))


### 🚀 New Feature

* **ci:** add changelog to the ui ([#434](#)) ([a7109ff](#))
* **faq:** add latest tag info ([cbe7b4e](#))
* **formatting:** convert formatting to use tabs ([4b348d1](#))
* **log:** add experimental support for JSON logs ([677fd29](#))
* **log:** add initial support for displaying log content ([d8ebcb1](#))
* **log:** add pagination support to schema ([6a1af72](#))
* **log:** add pagination support to schema ([36706ae](#))
* **run:** [results-table] add key list with urls ([83784ef](#))
* **run:** add column visibility toggle to run/diff pages ([ab0d28e](#))
* **sidebar:** add collapsible links ([1295902](#))
* **sidebar:** show/hide sidebar on `s` keypress ([ef529b8](#))
* **ui:** add dropdown menu component ([cea395f](#))
* **ui:** add skeleton component ([cfd9b98](#))


### 🐛 Bug Fix

* **history:** lazy loading modules ([5f9e6ed](#))
* **runs:** date range picker no label warning ([4b9f05f](#))
* **runs:** importing from lazy loaded module ([4c8fe1a](#))

## [0.15.0](#) (2023-04-12)

### 🚀 New Feature

- **faq:** add latest tag info ([cbe7b4e](#))

### 💅 Polish

- **import:** make modal title bigger ([bb84145](#))
- **run:** uppercase table columns ([abcf61b](#))

### ✏️ Other

- **build:** migrate from webpack to vite ([749a97b](#))
- **ci:** add new commit types ([13730fa](#))
- **log:** add run id to tab title ([8c88283](#))
- **test:** update snapshots ([4839df8](#))

## [0.13.0](#) (2023-04-05)

### 💅 Polish

- **import:** add border to rows on hover ([22cdc75](#))
- **import:** add scroll for overflowing table ([bd3658f](#))
- **import:** change padding ([54b8bc9](#))
- **import:** fix overflow and sticky position ([bb4ae4d](#))
- **import:** improve error style for import events table ([eff1e41](#))
- **import:** wrap form in div ([a641e27](#))
- **log:** change skipped icon color ([9027989](#))
- **run:** fix not sticking rows ([2a7c81c](#))
- **ui:** [datepicker] add bg on hover to prev/next buttons ([dc5f1b4](#))
- **ui:** [datepicker] make calendar icon bigger ([994a9f7](#))
- **ui:** add offset to date picker field ([04adcc7](#))
- **ui:** opacity for secondary variant ([e1f1175](#))

### 🚀 New Feature

- **api:** add error handling for custom backend errors ([f0a095c](#))
- **ci:** add new release pipline ([6cc90d5](#))
- **dashboard:** open nok results on runs ([07ca4f4](#))
- **faq:** add latest tag info ([8962aa4](#))
- **import:** add date-picker field to form ([b3a0f34](#))
- **import:** add import multiple runs form ([#424](#)) ([f6f9af3](#))
- **import:** add new columns to table ([fb8a4d7](#))
- **import:** add sticky table header ([aa283ac](#))
- **import:** persist form state in URL ([d1df298](#))
- **log:** add skipped icon ([5818f26](#))
- **log:** display focus id test name ([239c280](#))
- **run:** open unexpected results with ctrl click ([7a0571a](#))

### ✏️ Other

- **ci:** fix install script ([6a06ea1](#))
- **ci:** remove uploading build artifacts ([0ca24f3](#))
- cleanup ([12f3b27](#))
- **docker:** add separate conig for bublik docker ([2d6481c](#))
- fix log links in dev mode ([ce0192e](#))
- fix typo ([736c53e](#))
- **history:** format time for history legend header ([c22e6b3](#))
- **import:** change column order ([def4032](#))
- **import:** change timestamp query param ([8ee08e6](#))
- remove broken datepicker tests ([47ab308](#))
- remove broken datepicker tests ([ad4db2f](#))
- remove old context ([f1dc7a3](#))
- replace old base url to localhost ([b09bec5](#))
- **ui:** [dialog] simplify modal styles ([baf87dc](#))
- **ui:** [dialog] simplify modal styles ([e9b0bb3](#))
- **ui:** fix snapshot ([8dcb2e9](#))
- update snapshots ([d29dcda](#))
- update snapshots ([07ef54c](#))

### 🐛 Bug Fix

- **ci:** ci wrong command ([2143d9f](#))
- **history:** apply filters on history mount ([d50d31e](#))
- **import:** missing date ([ed62d5e](#))
- **import:** sidebar is not fixed on long table ([f617e7e](#))
- **import:** trim whitespaces from msg query value ([ec9a5b6](#))
- **import:** ur validationl won't process properly ([0a8f0cb](#))
- **log:** wrong document title ([92f9b2f](#))
