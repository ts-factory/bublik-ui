

## [0.43.0](https://github.com/ts-factory/bublik-ui/compare/v0.3.1...v0.43.0) (2024-07-04)


### 📦 Chores

* **build:** upgraded pnpm setup action to latest version ([290ad77](https://github.com/ts-factory/bublik-ui/commit/290ad7757b9f588412c24138a45fd2d38d695ae0))
* **run:** [details] changed order of buttons and links ([fe9b024](https://github.com/ts-factory/bublik-ui/commit/fe9b0244ccf323f1278fac908e7bbe11f0724553))


### 🚀 New Feature

* **log:** [mi] added display for aggregated values min/max ([f476678](https://github.com/ts-factory/bublik-ui/commit/f476678ca34370d6a39e2b84f099e84eb22fb138))


### 🐛 Bug Fix

* **log:** [mi] display only entries with `aggr` of "single" on chart ([e391d2a](https://github.com/ts-factory/bublik-ui/commit/e391d2aa6a78dfed7139e6d48783641eb8b6be84))
* **reports:** made datasets for chart/table optional ([ff7d724](https://github.com/ts-factory/bublik-ui/commit/ff7d724b37885c0f1fe00c2026c7dccf2f302027))
* **reports:** removed `%` for values that are "-" or "na" ([88e7416](https://github.com/ts-factory/bublik-ui/commit/88e74167b337f2518bab036c2a0882d5cb9a9318))

## [0.42.0](https://github.com/ts-factory/bublik-ui/compare/v0.3.0...v0.42.0) (2024-06-26)


### 🚀 New Feature

* **history:** added labels field to history global search form ([5fc9e7b](https://github.com/ts-factory/bublik-ui/commit/5fc9e7b0418843fefa78ae7c744d1fb341b8f441))
* **history:** added scroll to top of the page on page change ([634934f](https://github.com/ts-factory/bublik-ui/commit/634934fce95fc155a0955056f984fe15ba67945f))
* **reports:** added formatters support to show "%" sign ([5e55703](https://github.com/ts-factory/bublik-ui/commit/5e55703929e931e864c5ac0806770bf8c77cef3f))
* **reports:** added handling for API errors for report page ([323d7ba](https://github.com/ts-factory/bublik-ui/commit/323d7bafbdcde44a074132dbc27034b5dc356b70))
* **reports:** added table title from Y axis label ([c5d3498](https://github.com/ts-factory/bublik-ui/commit/c5d3498f51f1d5b2184eaef231af3bf27a71bed2))


### 🐛 Bug Fix

* **history:** fixed missing default values for history global search form ([f096099](https://github.com/ts-factory/bublik-ui/commit/f09609984044c74193441d909ef6334aff83b385))
* **history:** made field names consistent in search form ([6f569af](https://github.com/ts-factory/bublik-ui/commit/6f569afd25428e4640b2d13b37790fa131def6d6))
* **log:** added option to contain label inside canvas container ([5c07946](https://github.com/ts-factory/bublik-ui/commit/5c079461bb1a8c04168f19b7bab6009f96197ccc))
* **reports:** fixed axis label overflow inside canvas container ([79b5416](https://github.com/ts-factory/bublik-ui/commit/79b541646f429c2d14bfb7b62e3854a0180643bb))
* **reports:** fixed unstable key for report header list item ([a6ac058](https://github.com/ts-factory/bublik-ui/commit/a6ac058b7e85caf3f7704027a895b74c0a425289))
* **run:** fixed copying revision metadata without key ([eefdf45](https://github.com/ts-factory/bublik-ui/commit/eefdf45f9d8eeb2b206a1678048db72d835b5482))
* **runs:** [form] fixed crash when opening tags input ([90e3df6](https://github.com/ts-factory/bublik-ui/commit/90e3df62602eb510344649eb9e8f0f0bd0e101c9))
* **ui:** [combobox] fixed selection change callback type ([9d16f19](https://github.com/ts-factory/bublik-ui/commit/9d16f197c3078560c944739fef630646fd551773))


### 💅 Polish

* **command:** added background overlay to command menu ([08bf23e](https://github.com/ts-factory/bublik-ui/commit/08bf23e6b43d0c1c45d7cf2921c852eabd9b9767))
* **run:** [reports] added gap between exit icon and report label ([de2dd4d](https://github.com/ts-factory/bublik-ui/commit/de2dd4dd698e8864bc250a7ea0ec6ca60668ecf5))

## [0.41.0](https://github.com/okt-limonikas/bublik-ui/compare/v0.2.6...v0.41.0) (2024-06-06)


### 🐛 Bug Fix

* **reports:** added missing dependency to useMemo hook for args calculation ([b67f56b](https://github.com/okt-limonikas/bublik-ui/commit/b67f56bf8378c5556eaedce4553f0f40cb99e7bb))
* **reports:** added missing dependency to useMemo hook for chart series calculation ([38b7682](https://github.com/okt-limonikas/bublik-ui/commit/38b7682b700d5ad82430219adfce7858d0009b40))
* **reports:** added rel="noreferrer" to external links ([8670993](https://github.com/okt-limonikas/bublik-ui/commit/867099344a49554f29899729860d032969e20aa7))
* **reports:** fixed build issues with tests ([d965e1b](https://github.com/okt-limonikas/bublik-ui/commit/d965e1b6692939c2b92775659cbb208df7c4d425))
* **reports:** fixed scroll to element id containing only numbers ([960d826](https://github.com/okt-limonikas/bublik-ui/commit/960d826842271495710927543bf0d46f2c0b948c))
* **reports:** prevent conditional calling of API query hook ([976998b](https://github.com/okt-limonikas/bublik-ui/commit/976998be71777a01290482fd0ffd50aca09d1ce1))


### 💅 Polish

* **reports:** added underline on hover for revision link ([9dc8ab3](https://github.com/okt-limonikas/bublik-ui/commit/9dc8ab3ff464eeb72dc2675ed3cf8e8a0ce73b2a))
* **reports:** fixed styles for dropdown menu item ([89a7921](https://github.com/okt-limonikas/bublik-ui/commit/89a7921867a4be3710a06cbb4ee8f420d027257d))


### 📦 Chores

* **copy-short-url:** upgraded cmdk package to latest version ([196d26b](https://github.com/okt-limonikas/bublik-ui/commit/196d26bddd609e802705f20a5cf5ace1b676a598))
* **icons:** added upload icon to icon library ([9ea35bb](https://github.com/okt-limonikas/bublik-ui/commit/9ea35bb226ba1c4b7b5812342bea7a771e7521d6))
* **reports:** extracted run-report test block ([17ac977](https://github.com/okt-limonikas/bublik-ui/commit/17ac97789e9b34e738761faa2d8bd93687eb2fb3))
* **reports:** generated library for run report ([c8fdf56](https://github.com/okt-limonikas/bublik-ui/commit/c8fdf56646407d7d9a0e7ef16205754bc26795ff))


### 🚀 New Feature

* **copy-short-url:** added "copy short url" button to dashboard page ([5794f1b](https://github.com/okt-limonikas/bublik-ui/commit/5794f1bd990b99029ade8224ecdf6bdaf54f2be9))
* **copy-short-url:** added "copy short url" button to history page ([4f5aa78](https://github.com/okt-limonikas/bublik-ui/commit/4f5aa785eeb8d9268fba4757d2c80192fc2ea0c6))
* **copy-short-url:** added "copy short url" button to run page ([a661fed](https://github.com/okt-limonikas/bublik-ui/commit/a661fed0888727398fc44a304cdddd52f9baa501))
* **copy-short-url:** added "copy short url" to runs page ([6afdd3a](https://github.com/okt-limonikas/bublik-ui/commit/6afdd3a5bcf0896a00e0acab3b3be29438586f93))
* **copy-short-url:** added "copy-short-url" button to log page ([19b6ce1](https://github.com/okt-limonikas/bublik-ui/commit/19b6ce1316de6cf3c7aedcb3425602e4ab4af4bc))
* **copy-short-url:** added "copy-short-url" button to measurements page ([3aa5b5e](https://github.com/okt-limonikas/bublik-ui/commit/3aa5b5e7e89acbbb4ab90f8484da9ed1d11c521a))
* **copy-short-url:** added "copy-short-url" button to run page ([ba2ff97](https://github.com/okt-limonikas/bublik-ui/commit/ba2ff97a93a8961b02c36c9ef92d7f591a5f6105))
* **copy-short-url:** added button for copying short url to current page ([02af6f8](https://github.com/okt-limonikas/bublik-ui/commit/02af6f8ef0cacd95fef206a4cdba60f5106b08db))
* **copy-short-url:** added command component ([8c416c1](https://github.com/okt-limonikas/bublik-ui/commit/8c416c1e023585ec6c93d01c205b0489d4373caa))
* **copy-short-url:** added component for command to copy short url ([a5459d3](https://github.com/okt-limonikas/bublik-ui/commit/a5459d301a0b63059462b824633842e2043bde1a))
* **copy-short-url:** added endpoint for creating short url ([2fd89dd](https://github.com/okt-limonikas/bublik-ui/commit/2fd89ddf9f379861c29d4e15a45ceff101b1f923))
* **copy-short-url:** generated library for "copy short url button" ([04a0931](https://github.com/okt-limonikas/bublik-ui/commit/04a093141098c9f6c1cb856656aa81e699f5a3bd))
* **reports:** added dropdown for run configs links ([c5fb281](https://github.com/okt-limonikas/bublik-ui/commit/c5fb2811ffe8656714d499ef090df4ccd5e09fc6))
* **reports:** added initial report header ([dc1195c](https://github.com/okt-limonikas/bublik-ui/commit/dc1195c2471d0dbfc1c70d4fc07199d3187947eb))
* **reports:** added run report container component ([48591fc](https://github.com/okt-limonikas/bublik-ui/commit/48591fc4d874ddceb0bf614efa6c9de6e72d1ce4))
* **reports:** added sidebar link for run report ([bdc2f1c](https://github.com/okt-limonikas/bublik-ui/commit/bdc2f1c9aadd5892b65ea7c1ae614c341027bc68))
* **reports:** added table and chart components ([4e4d3a7](https://github.com/okt-limonikas/bublik-ui/commit/4e4d3a75d17c8c03f6b898265b65d4d4333fc42a))
* **reports:** added warnings popover ([46d983d](https://github.com/okt-limonikas/bublik-ui/commit/46d983dad714768c6f6676d1b4d1dba4c22c8dcd))
* **reports:** made revision links clickable ([41d50d8](https://github.com/okt-limonikas/bublik-ui/commit/41d50d8dbb44d47e1daf735d64ad0beedfe264e9))

## [0.40.0](https://github.com/ts-factory/bublik-ui/compare/v0.39.1...v0.40.0) (2024-04-29)


### 📦 Chores

* fix run library test config ([4f3df15](https://github.com/ts-factory/bublik-ui/commit/4f3df15d2c95896a609e6c0bc4d79aefc77d335e))


### 💅 Polish

* **log:** [chart] add constraints for min/max values ([88b5262](https://github.com/ts-factory/bublik-ui/commit/88b52621ab4324d1313dc3ee1f5d5d67e98fb98c))


### 🐛 Bug Fix

* **charts:** correct tooltip message for zoom button ([aeaa1ea](https://github.com/ts-factory/bublik-ui/commit/aeaa1ea162e43c6a037dca948f9a9522b65a26e3))
* **run:** result parameters diff crashing on some results ([d196c74](https://github.com/ts-factory/bublik-ui/commit/d196c74f093fa8dbe8c6adbce99de907bac9b34b))


### 👷‍ Build System

* enable sourcemaps ([976756c](https://github.com/ts-factory/bublik-ui/commit/976756ce1bda98d6d5c2549a5c7f724c5534d268))


### 🚀 New Feature

* **log:** scroll to top of log on test click ([e6cfda2](https://github.com/ts-factory/bublik-ui/commit/e6cfda2d8f940f52452630fd7fb270ee7de97c42))
* **measurements:** add stacked chart mode ([5ad0f20](https://github.com/ts-factory/bublik-ui/commit/5ad0f20e614435ac30c19ae1542e1bc2bee1c7d4))

### [0.39.1](https://github.com/ts-factory/bublik-ui/compare/v0.2.3...v0.39.1) (2024-04-08)


### 💅 Polish

* **log:** fix horizontal page overflow ([803c05c](https://github.com/ts-factory/bublik-ui/commit/803c05c27c99c1e88d34ef28d0048e9e26deea3e))


### ♻ Code Refactoring

* **history:** adapt search params to api changes ([91ae184](https://github.com/ts-factory/bublik-ui/commit/91ae184af0c0916cc074795f4c28b2c4379ef1a0))


### 📦 Chores

* **log:** change default log mode to experimental ([d851f04](https://github.com/ts-factory/bublik-ui/commit/d851f0412fc47c38455c103d709b7ba7f5592f0c))


### 🐛 Bug Fix

* **auth:** prevent app crash caused by toast messages ([ce1211f](https://github.com/ts-factory/bublik-ui/commit/ce1211ff30bffadfc4d246d0bb012a6714c51d2e))
* **history:** [checkbox] prevent double select ([ab1d2ed](https://github.com/ts-factory/bublik-ui/commit/ab1d2ed3e5818a7fab759efe5aae4780ed22b148))
* **history:** [form] missing default values ([ed7a34a](https://github.com/ts-factory/bublik-ui/commit/ed7a34ae00d474530a0ca1172de7a51f71437fd8))
* **history:** not display dates in legend ([41a2a5a](https://github.com/ts-factory/bublik-ui/commit/41a2a5a156ecd3eefe1c385060635478cf74ad8a))
* **history:** skipping fetching data on direct navigation ([bc721e1](https://github.com/ts-factory/bublik-ui/commit/bc721e1994a1fa34289051633616f00ba9462979))
* **log:** scroll to saved line ([41cf356](https://github.com/ts-factory/bublik-ui/commit/41cf3567a58cf15dd654fb6c7f4b24b92a6f2c9d))

## [0.39.0](https://github.com/ts-factory/bublik-ui/compare/v0.38.0...v0.39.0) (2024-02-22)


### 👷‍ Build System

* **docker:** add docker for easily bootstrapping dev env ([f0da04d](https://github.com/ts-factory/bublik-ui/commit/f0da04db315506a64d04e8932f265fc0be6d250f))


### 🐛 Bug Fix

* **providers:** [tooltip] disable hoverable content ([dc6baf5](https://github.com/ts-factory/bublik-ui/commit/dc6baf5ee560c7ed9881802efde702607def69b4))
* **ui:** [checkbox] not updating on label click ([3475b01](https://github.com/ts-factory/bublik-ui/commit/3475b01081281b6766da0cd691df52d2c5aa1efc))


### 🚀 New Feature

* **log:** make log page respect user preferences ([ef5ebe3](https://github.com/ts-factory/bublik-ui/commit/ef5ebe34c5c9954252dc0d3cebfe09af2a273c45))
* **performance:** add view for bublik performance self-testing ([2a3619b](https://github.com/ts-factory/bublik-ui/commit/2a3619b4dc8f3258459d84e3816fb5c5bd3060b9))
* **run:** add ability to highlight param difference ([b75d295](https://github.com/ts-factory/bublik-ui/commit/b75d2956820c99673e4516d7ffa9522cdcb7a205))
* **ui:** add radio group component ([aa27baa](https://github.com/ts-factory/bublik-ui/commit/aa27baa741f637dcdb39235b5233f1506c0653f8))
* **user:** [preferences] add user preferences form ([2ce58ce](https://github.com/ts-factory/bublik-ui/commit/2ce58cebce2e08bf884f2669e0fbb3aa57fa5ba3))


### ♻ Code Refactoring

* **log,history,measurements:** make history links respect preferences ([2d3cfff](https://github.com/ts-factory/bublik-ui/commit/2d3cfff076211d8adb2a2b272119d7ad7556efd1))

## 0.38.0 (2024-01-31)


### 🔧 Continuous Integration | CI

* **release,ci:** fix formatting and pass env through global config ([03b1dab](https://github.com/ts-factory/bublik-ui/commit/03b1dab85d780bc0fd71b2277fd451c6a8a780bc))


### 💅 Polish

* **import:** fix import table overflowing horizontally ([b66d49c](https://github.com/ts-factory/bublik-ui/commit/b66d49ce41918861f9425452610e9a213e8eca17))
* **ui:** [toaster] add colors for different states ([2955b94](https://github.com/ts-factory/bublik-ui/commit/2955b94a3611e6129b20fe19da71326fb25d9b6e))


### 🚀 New Feature

* **import:** add live import logs via polling for changes ([75ab1b1](https://github.com/ts-factory/bublik-ui/commit/75ab1b1a51e548b86c4e4235b61de54f48516bd0))
* **run:** add tip for ctrl+click on run page ([5ca2912](https://github.com/ts-factory/bublik-ui/commit/5ca29124d42b79c8a76c662ee0dcad1a7fc2329c))


### 📦 Chores

* **auth:** allow access to dev section for unauthenticated users ([b7f83f2](https://github.com/ts-factory/bublik-ui/commit/b7f83f26546526ce9d458c1860af967de82e35de))
* **nx:** upgrade nx and it's packages to latest versions ([ad45ca6](https://github.com/ts-factory/bublik-ui/commit/ad45ca634506812fdbcd8999f39852cd64f3f484))
* **storybook:** cleanup unused imports/types ([e1039f2](https://github.com/ts-factory/bublik-ui/commit/e1039f25d7dbaa75f2070909cd7f7134ca8e33e0))


### 🐛 Bug Fix

* **build:** adjust release config to allow releases from branches other than `main` ([22a6f6b](https://github.com/ts-factory/bublik-ui/commit/22a6f6be3555e509f16ed7c1b0999dd2d98501d5))
* **import:** [import-form] allow empty URL ([33347a3](https://github.com/ts-factory/bublik-ui/commit/33347a30152a6faafb6b5fe9ee6d16a0485faef1))
* **log:** fix json log overflow scrolling not working ([537677c](https://github.com/ts-factory/bublik-ui/commit/537677cf6729cacb226645fc9fb905430bf2a535))

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