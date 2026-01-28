

## [2.8.0](https://github.com/ts-factory/bublik-ui/compare/v2.7.1...v2.8.0) (2026-01-28)


### 🚀 New Feature

* **log:** [preview] add history link to log preview drawer modal ([7f71547](https://github.com/ts-factory/bublik-ui/commit/7f71547c7d48f85fcf5b8ca9e0b38ff86fa5edb0))
* **log:** add full path to test when navigating to history ([709916d](https://github.com/ts-factory/bublik-ui/commit/709916d3f4826c49f95042616926b673e7cf52b9))
* **run:** [details] support URL links in labels to allow users open new tab ([6fe12db](https://github.com/ts-factory/bublik-ui/commit/6fe12dba636cc36697f5eecd7fd83d7ce0a09d74)), closes [#468](https://github.com/ts-factory/bublik-ui/issues/468)
* **run:** add dim mode to visually highlight common parameters ([f97f5d5](https://github.com/ts-factory/bublik-ui/commit/f97f5d564d46cdb20a6635874da1182f42b467b3)), closes [#449](https://github.com/ts-factory/bublik-ui/issues/449)
* **run:** add Expected/Unexpected total columns ([a902b9e](https://github.com/ts-factory/bublik-ui/commit/a902b9ea441865ce763bd7853a7d8b3b3a893a0e)), closes [#54](https://github.com/ts-factory/bublik-ui/issues/54)
* **run:** add interrupted run status handling ([d92eee0](https://github.com/ts-factory/bublik-ui/commit/d92eee0321c40dc5487bf381fc7803d8c2a07e9e))
* **settings:** initialize settings library ([c3f2cb7](https://github.com/ts-factory/bublik-ui/commit/c3f2cb70b4c7a97c97fb18406f7342d68772a84f))


### 💅 Polish

* **run:** [details] make "Expose" button the most left button ([1f83306](https://github.com/ts-factory/bublik-ui/commit/1f83306888bff9c782fa0b22259eed72b2074947))
* **run:** [results] move filter toolbar below result's table header ([df3e344](https://github.com/ts-factory/bublik-ui/commit/df3e34427b061a5c512f66a651418ebac86d261b))
* **runs:** improve layout of `Statistic Summary` columns ([fd6baf3](https://github.com/ts-factory/bublik-ui/commit/fd6baf36619abeb189dd573be63dbd782269080a))
* **ui:** update checkbox and radio-group components ([fc26942](https://github.com/ts-factory/bublik-ui/commit/fc26942d97cbc1bf9a03c7fd45188857d56016dd))


### 🐛 Bug Fix

* **bublik-logs:** align TypeScript lib config with bublik for ESNext support ([e705bbd](https://github.com/ts-factory/bublik-ui/commit/e705bbdebfde617dedec635a0ff9bbcf8c358223))
* **history:** format date based on user timezone for history ([1f56e7c](https://github.com/ts-factory/bublik-ui/commit/1f56e7ced32ed488f08622a72b1e96b981378cbe))
* **import:** fix React Hooks order violation in EventRow ([f4c22b6](https://github.com/ts-factory/bublik-ui/commit/f4c22b6bcc6df717e0000363a1c7515293a1b483))
* **import:** handle `null` celery_task in events table ([2bc21de](https://github.com/ts-factory/bublik-ui/commit/2bc21def5963b93a84af75ebcd9d2edafa1503af)), closes [#459](https://github.com/ts-factory/bublik-ui/issues/459)
* **import:** resolve React Hooks order violation ([6a2eb40](https://github.com/ts-factory/bublik-ui/commit/6a2eb40da3a43a422c3ecc67a2315ba995bd59c4))
* **log:** [new-bug] fix layout shift for "new bug" button ([814a0f6](https://github.com/ts-factory/bublik-ui/commit/814a0f601c533b2f011caa6eb53d501cad8ee44a))
* **log:** [new-bug] generate CMD based on top level `config` key ([78417ac](https://github.com/ts-factory/bublik-ui/commit/78417acd9ba2abcbac7444f85d709fc686323039)), closes [#174](https://github.com/ts-factory/bublik-ui/issues/174)
* **log:** [new-bug] make log data optional for NewBugContainer ([bfcd1ef](https://github.com/ts-factory/bublik-ui/commit/bfcd1efae81750b5101032635890799d26a87648))
* **log:** display test start and end in user timezone ([2c1fbad](https://github.com/ts-factory/bublik-ui/commit/2c1fbad239e0a5f0a68a5f5d16686125b5f57e3f)), closes [#470](https://github.com/ts-factory/bublik-ui/issues/470)
* **log:** not showing pagination when viewing full log ([5e4fc44](https://github.com/ts-factory/bublik-ui/commit/5e4fc44f253a7a0e9a4a4d32cdce552526001908)), closes [#176](https://github.com/ts-factory/bublik-ui/issues/176)
* **run:** [details] format start, finish dates of test run ([86e7d29](https://github.com/ts-factory/bublik-ui/commit/86e7d294ce59df331daa9bf0d23294ae2fd0ea1d)), closes [#470](https://github.com/ts-factory/bublik-ui/issues/470)
* **run:** ensure reference rows have visible borders in diff/dim mode ([5c8ba2d](https://github.com/ts-factory/bublik-ui/commit/5c8ba2d1371091701af2857c59c97d2eccc9d333))
* **run:** incorrectly formatted column labels for Unexpected/Expected total ([042df12](https://github.com/ts-factory/bublik-ui/commit/042df12f26c5b4a75c915aea1c988e98085255d5))
* **run:** preserve toolbar visibility when toggling dim/diff mode ([5af2ac1](https://github.com/ts-factory/bublik-ui/commit/5af2ac11323503ca9d125fafb582053d5ebcb027))


### ♻ Code Refactoring

* **history:** generate history-link library ([6c29b4b](https://github.com/ts-factory/bublik-ui/commit/6c29b4b4072120f926b491432107afce19a481be))
* **history:** unify history link component into shared library ([310cf27](https://github.com/ts-factory/bublik-ui/commit/310cf27d7e590d85f4746e67f6e6670b2c28564e)), closes [#414](https://github.com/ts-factory/bublik-ui/issues/414)
* **performance:** remove page and update component ([71a0cb8](https://github.com/ts-factory/bublik-ui/commit/71a0cb8fab92da0ab28f61d6d5f986ea10b439b3))
* **router:** update router and navigation ([73e4468](https://github.com/ts-factory/bublik-ui/commit/73e4468fcc4b30d87cfd330fe4605312377bbd29))
* **run,log,measurements:** use single result type across all code ([fb6a8c0](https://github.com/ts-factory/bublik-ui/commit/fb6a8c0c769e0e72aca76ceef69b343d2cd814fb))
* **settings:** migrate to modal-based UI ([a547df8](https://github.com/ts-factory/bublik-ui/commit/a547df8ace8663916d11644e058e89e1a4d45f62))
* **settings:** split and simplify forms ([da4e402](https://github.com/ts-factory/bublik-ui/commit/da4e402c5e74beaa6c3b8be85c468626ddea555a))


### 📦 Chores

* **ci:** upgrade CI actions to latest versions ([9cb1cf1](https://github.com/ts-factory/bublik-ui/commit/9cb1cf1e2439a190f25db51f8086335c249a9a53))
* **deps:** add lucide-react dependency ([82586ef](https://github.com/ts-factory/bublik-ui/commit/82586ef6e14aaf3bb2e8604b89d9e07854eda661))
* **docs:** add AGENTS.md file for AI agent usage instructions ([e6bd184](https://github.com/ts-factory/bublik-ui/commit/e6bd18427229ec7712b46ec3ad67e59f762e53ce))

### [2.7.1](https://github.com/ts-factory/bublik-ui/compare/v2.7.0...v2.7.1) (2025-12-30)


### 💅 Polish

* **ui:** fix ";" symbol at the end of run report ([22c0009](https://github.com/ts-factory/bublik-ui/commit/22c00091d838f3d837ea4a832594f7b5e4a34fc9))


### 🐛 Bug Fix

* **report:** [chart] mismatch between legend and line colors ([939158f](https://github.com/ts-factory/bublik-ui/commit/939158f0a46bb51adf533b80f31b34007fb51489))
* **report:** circular imports for cause by report args and warning hover card ([1bb733f](https://github.com/ts-factory/bublik-ui/commit/1bb733f3d9ceca61e7a1c59c8580a7bacd36aa04))

## [2.7.0](https://github.com/ts-factory/bublik-ui/compare/v2.6.0...v2.7.0) (2025-12-30)


### 🚀 New Feature

* **history:** [measurements] add parameters filter to series charts ([9180fc5](https://github.com/ts-factory/bublik-ui/commit/9180fc59fd08e0e0fc495c071fa8c7e01500e0da))


### 🐛 Bug Fix

* **history:** restore selected charts from URL ([d9c1d60](https://github.com/ts-factory/bublik-ui/commit/d9c1d60ed59bf104104a4cbf59eb87d04635a295))
* **measurements:** add y-axis label to chart name ([6022ccb](https://github.com/ts-factory/bublik-ui/commit/6022ccb2ccb80399f155f525235c225a4b09a89b))
* **report:** improve scrolling to item when clickin on TOC item ([1162833](https://github.com/ts-factory/bublik-ui/commit/116283354d70245d5a4e74cd50ee15e0fe8cb9d3))
* **version:** crash on safari for `NaN` date ([b06a215](https://github.com/ts-factory/bublik-ui/commit/b06a2158fea89b7f8cb36f42b274f0432208100b))


### ♻ Code Refactoring

* **history:** [measurements] generate unique names for series ([5b9baae](https://github.com/ts-factory/bublik-ui/commit/5b9baae52d6fd2f920dd95bfd6c8850a6a118489))
* **history:** [measurements] merge y-axises with the same name ([c3682ce](https://github.com/ts-factory/bublik-ui/commit/c3682ce06452c8704e2a3cec00bfbae99ebb78db))
* **measurements:** remove green circles to highlight expected results ([8df10a4](https://github.com/ts-factory/bublik-ui/commit/8df10a4384e34fe2273e94a79842b529e1e791d5))

## [2.6.0](https://github.com/ts-factory/bublik-ui/compare/v2.5.0...v2.6.0) (2025-12-17)


### 🚀 New Feature

* **report:** [chart] add stacked charts support for report ([e4f4cc8](https://github.com/ts-factory/bublik-ui/commit/e4f4cc82bb91059ba200ded89164c960fb6b39c5))


### 💅 Polish

* **run:** [result-table] fix history split button icon being on top of header ([d47cd2e](https://github.com/ts-factory/bublik-ui/commit/d47cd2e88996021d2c07c81264366209d3e7f5fe))

## [2.5.0](https://github.com/ts-factory/bublik-ui/compare/v2.4.1...v2.5.0) (2025-12-11)


### 🚀 New Feature

* **history:** [aggregation] add important tags to results hover card ([070e0b1](https://github.com/ts-factory/bublik-ui/commit/070e0b15794657280d3cc73610dc50dbd5859128))
* **log:** expand level up to row with `MI` level by default ([57f1cb8](https://github.com/ts-factory/bublik-ui/commit/57f1cb8de6bebfc04697c27c7f83ef5acf9174ba))
* **report:** [table] add ability to pair "gain" columns to their base series ([24052dd](https://github.com/ts-factory/bublik-ui/commit/24052dd9578efa70ebb7bc97788ffe6d113ff94f))
* **run:** add link to run straight to iteration ([831652d](https://github.com/ts-factory/bublik-ui/commit/831652d9c1b2d0dcbb10639f98f816d18d774364))
* **url:** add ability to copy short URL with page state or without ([816e8c8](https://github.com/ts-factory/bublik-ui/commit/816e8c8f8bdce555aaa45c88c1cf042dea4a5074))


### 💅 Polish

* **report:** [chart,table] ensure table and chart always take 50% width ([0dcb4a9](https://github.com/ts-factory/bublik-ui/commit/0dcb4a9a39b964eaff3a0fb86512e35870ae2274))
* **report:** [table] allow table header to wrap for long header labels ([0ed18f6](https://github.com/ts-factory/bublik-ui/commit/0ed18f62040b43cc046904590e01c346fd7c4b41))


### 🐛 Bug Fix

* **history:** apply filter state on mount ([7acf814](https://github.com/ts-factory/bublik-ui/commit/7acf814b7d5280bc459f782d9e524f4ae4c44572))
* **import:** add missing react `key` prop to import events table ([34a2b03](https://github.com/ts-factory/bublik-ui/commit/34a2b0372db0b655b2548a132507e223b2101bf6))
* **report:** hide empty `arg-val-block` in report ([4f3fdbb](https://github.com/ts-factory/bublik-ui/commit/4f3fdbb1a038d4ce64a640f402018f5a4c1bb722))
* **run:** [result-table] fix parameters diff ([2bdb7bc](https://github.com/ts-factory/bublik-ui/commit/2bdb7bc177aed919964ff680d308a17b771859dd))


### ♻ Code Refactoring

* **import:** [log] display log as a table with columns ([e7cde45](https://github.com/ts-factory/bublik-ui/commit/e7cde451a570c8ff7250d988ff75e4f195294e73))
* **version:** fix missing API version information ([d0c71a2](https://github.com/ts-factory/bublik-ui/commit/d0c71a2c0c7a8c3bdaf364b0ef878d956b3cc981))


### 📦 Chores

* **deps:** upgrade node version to 24.11 LTS ([eb62198](https://github.com/ts-factory/bublik-ui/commit/eb62198f588213c2640d3131af6a7ccdc2de708a))

## [2.4.0](https://github.com/ts-factory/bublik-ui/compare/v2.3.0...v2.4.0) (2025-11-18)


### 🚀 New Feature

* **import:** [form] add `project` field to form ([1378923](https://github.com/ts-factory/bublik-ui/commit/1378923ce147282ab463ee73336cb6c900b8b0be))
* **import:** add "Try Again" button to trigger re-import of the run ([7baa22a](https://github.com/ts-factory/bublik-ui/commit/7baa22a5f16c18a46cd2eddd89781bfe8d8fbe46))
* **run:** add comment form to run details page ([60386c0](https://github.com/ts-factory/bublik-ui/commit/60386c0dc9832d85395ed863b025e50c11769edf))


### 💅 Polish

* **report:** [TOC] change font size and spacing to improve clarity ([8f43850](https://github.com/ts-factory/bublik-ui/commit/8f43850b9b587bd90173299da1330959671af4e1))
* **run:** [details] add padding to error state ([c5e96ab](https://github.com/ts-factory/bublik-ui/commit/c5e96ab8e74cfeb6b87809e53e75e610cc38a534))


### 🐛 Bug Fix

* **import:** open log modal with polling enabled in case of `STARTED` state ([024c609](https://github.com/ts-factory/bublik-ui/commit/024c6091fb389a36401cf30a0a9f40a96920669b))
* **log:** [preview] fix incorrectly handling for first log page ([0320a17](https://github.com/ts-factory/bublik-ui/commit/0320a170462a3a742aab30b9deffda939abc51fe))
* **log:** [preview] reset log table state on pagination change ([2156d47](https://github.com/ts-factory/bublik-ui/commit/2156d47b2ebb8ac0450f3cf8a4a88311113099fc))
* **run:** use full test path for history search ([6a39791](https://github.com/ts-factory/bublik-ui/commit/6a397916406a1b0b349eaaa168fcda237dd282e1))


### ♻ Code Refactoring

* **import:** display timeline for each import task on row click ([456d0c7](https://github.com/ts-factory/bublik-ui/commit/456d0c70d3f0c99a8d934a8eaa9f5cc4cf4abef5))
* **run:** reorder columns and align headers with badge placement ([2dd6b13](https://github.com/ts-factory/bublik-ui/commit/2dd6b13cdbe6525ce1fdbc435defb2f4e13e2df0))


### ⚡ Performance Improvements

* **measurements:** use canvas renderer for plots ([0bc05ce](https://github.com/ts-factory/bublik-ui/commit/0bc05ce4591890522e59697c5d99e748cadbedee))

## [2.3.0](https://github.com/ts-factory/bublik-ui/compare/v2.2.0...v2.3.0) (2025-10-08)


### 🚀 New Feature

* **run:** [compare] support pasting full run URLs in comparison form ([87976f4](https://github.com/ts-factory/bublik-ui/commit/87976f414d6b9a08cfc5d6dde07ea68377c93607)), closes [#413](https://github.com/ts-factory/bublik-ui/issues/413)


### ♻ Code Refactoring

* **projects:** get tab title prefix from API ([9c4c2cb](https://github.com/ts-factory/bublik-ui/commit/9c4c2cb79b8ac66ef86739e65717dc1ff4d481a0))

## [2.2.0](https://github.com/ts-factory/bublik-ui/compare/v2.1.0...v2.2.0) (2025-10-02)


### 🚀 New Feature

* **config:** add button to view config schema ([eed4e0b](https://github.com/ts-factory/bublik-ui/commit/eed4e0b0b060cf379a348759b0d406c3fbbb0a5c))
* **config:** show only projects/configs that are currently selected ([9dd52b1](https://github.com/ts-factory/bublik-ui/commit/9dd52b14868dd3af23bdf39b27c5cdc4668ae7b1))


### 💅 Polish

* **config:** [settings] improve sizing of icon and styling of dropdown ([c0c26f6](https://github.com/ts-factory/bublik-ui/commit/c0c26f6b668391cfc10a8b2958d4975dd5cc3b07))
* **run:** [results] change `Expose` button icon ([c131cb5](https://github.com/ts-factory/bublik-ui/commit/c131cb5341e176a2197156109f45cd036860084d))
* **run:** [results] make default history link bold ([2106fa5](https://github.com/ts-factory/bublik-ui/commit/2106fa52a21ef196aac0d0fc9bbf1148e623de2a))
* **ui:** [button] fix disabled state color ([9858ac1](https://github.com/ts-factory/bublik-ui/commit/9858ac1450960537634262ed3b9b40ebf507ebaa))
* **ui:** make placeholder text color dimmer for inputs ([8b9d38d](https://github.com/ts-factory/bublik-ui/commit/8b9d38dfb70ef5874c9da0023a1427e6ca2314cb))


### 🐛 Bug Fix

* **config:** [update] display validation error in case of error ([e4cdcce](https://github.com/ts-factory/bublik-ui/commit/e4cdcce2ef269ceeaebc2f48886d5a7422113f7c))
* **config:** outdated config list after auth ([41c7b74](https://github.com/ts-factory/bublik-ui/commit/41c7b74fcc9e8379d0769ed7028378dd703a3641))
* **config:** overlapping editor line numbers ([4366ff1](https://github.com/ts-factory/bublik-ui/commit/4366ff12c67a8c7e75e37ea120deff9154a7ebb8))
* **dashboard:** missing project name for selected project ([534485d](https://github.com/ts-factory/bublik-ui/commit/534485d827d1087b5e7525e1352db13f41c53c63))


### ♻ Code Refactoring

* **config:** [list] show all project cards by default ([e6e89e0](https://github.com/ts-factory/bublik-ui/commit/e6e89e091ae87ab8f3701de494739fca998ee0ea))
* **config:** disable/hide admin only actions ([2c0f7da](https://github.com/ts-factory/bublik-ui/commit/2c0f7da5828b2592e6da87cd470ff680f179f631))
* **config:** improve error handling for config create/update forms ([e01691b](https://github.com/ts-factory/bublik-ui/commit/e01691b031fd04f88a265d22aec777c54a66c076))


### 📦 Chores

* **config:** remove redundant code ([8509e01](https://github.com/ts-factory/bublik-ui/commit/8509e01c9bfae956f97e4c9a39de8a78521cfd21))
* **run:** [results] change order of result table columns ([18f0ff6](https://github.com/ts-factory/bublik-ui/commit/18f0ff6711bb62eb47f4dde03dbf17033dc92b83))
* **run:** [results] swap `prefilled` and `direct` order ([52e0ddf](https://github.com/ts-factory/bublik-ui/commit/52e0ddf6ff76baac425c9f6163f8cbde75148da9))
* **run:** change default link to direct to history ([4dd7997](https://github.com/ts-factory/bublik-ui/commit/4dd7997716c3e09efa3223ff8dcf73164e531555))

## [2.1.0](https://github.com/ts-factory/bublik-ui/compare/v2.0.1...v2.1.0) (2025-08-26)


### 🚀 New Feature

* **run:** add link to history for test filtered by run id and test name ([53d2c52](https://github.com/ts-factory/bublik-ui/commit/53d2c52fdd3cae8a77e2c195fc9b7ff080982a67)), closes [#372](https://github.com/ts-factory/bublik-ui/issues/372)


### 🐛 Bug Fix

* **config:** [update-project-form] show meaningful validation errors ([ea98698](https://github.com/ts-factory/bublik-ui/commit/ea98698096c5a743a860ec0be83b0f5228121b70)), closes [#374](https://github.com/ts-factory/bublik-ui/issues/374)
* **config:** make description field optional in config forms and API ([cf653d9](https://github.com/ts-factory/bublik-ui/commit/cf653d9fa3ac07104daecf50f92df549186d0813)), closes [#377](https://github.com/ts-factory/bublik-ui/issues/377)
* **run:** reset `open` state for history search form on back navigation ([7de1533](https://github.com/ts-factory/bublik-ui/commit/7de1533b40ca875ccf9213b884c66a003914a4e6)), closes [#383](https://github.com/ts-factory/bublik-ui/issues/383)


### 📦 Chores

* **projects:** [config] update default project label ([6b6adef](https://github.com/ts-factory/bublik-ui/commit/6b6adef40630ef500d99f90dcce81524c5bde66b)), closes [#375](https://github.com/ts-factory/bublik-ui/issues/375)
* **run:** remove forgotten `console.log` ([71173e7](https://github.com/ts-factory/bublik-ui/commit/71173e77acbb21ad33ec6a3f1c7c22d44f1f9268))

## [2.0.0](https://github.com/ts-factory/bublik-ui/compare/v1.10.3...v2.0.0) (2025-08-14)

This major version contains breaking API changes and introduces new features which affect existing functionality.
In this release, we have introduced initial steps to support project creation and management.

### 🚀 New Feature

* **configs:** add project creation button to config sidebar ([c646f24](https://github.com/ts-factory/bublik-ui/commit/c646f24a2cf69d566359939c9b9332e1d038de08))
* **configs:** add project deletion and update functionality ([bb84489](https://github.com/ts-factory/bublik-ui/commit/bb84489811b66368fe88c18eda8d02bf444ba3d4))
* **log:** add new type of log attachment for `.cap` and `.pcap` files ([4bef056](https://github.com/ts-factory/bublik-ui/commit/4bef0565f72a4b2e7e2ef685885300e252498797))
* **net:** add dissection tree component ([50bacfe](https://github.com/ts-factory/bublik-ui/commit/50bacfe640ae52446daac320a1edda7e564ecac7))
* **net:** add loading samples for testing ([479b6d9](https://github.com/ts-factory/bublik-ui/commit/479b6d95a7ab0d861c491a1ffffb68eff03cc51a))
* **net:** add packet capture analyze page ([5452f0d](https://github.com/ts-factory/bublik-ui/commit/5452f0d3a017d8979366231550e1e9c1b71f2f3e))
* **net:** add resizable panels for tree, dump and table ([abd25ec](https://github.com/ts-factory/bublik-ui/commit/abd25ecc6fcd75b0969fb0d29139eedc74ecd2b9))
* **net:** add trace flow component ([4287321](https://github.com/ts-factory/bublik-ui/commit/4287321180b6cf7a43587fea340f986eb779c9df))
* **projects:** [config] remove global config validation and improve empty state handling ([369845a](https://github.com/ts-factory/bublik-ui/commit/369845abad489bb3120d93eba96b42dcec82ce24))
* **projects:** add project creation functionality ([9618134](https://github.com/ts-factory/bublik-ui/commit/961813446ffbf514bd11c80401ced5bea780fa91))
* **projects:** add project dropdown component ([78499f4](https://github.com/ts-factory/bublik-ui/commit/78499f43b170ef56d1f95b16d0dd96d20905ad8b))
* **projects:** add project support and missing config creation ([2cec4fa](https://github.com/ts-factory/bublik-ui/commit/2cec4fa009dce785ffe933f69e8648df3864bd6b))
* **projects:** add projects feature library ([e0603f7](https://github.com/ts-factory/bublik-ui/commit/e0603f7a9a5230c828700b0f3e23c2143e99f2fe))
* **projects:** enhance project dropdown with sidebar toggle and project name display ([c609cc2](https://github.com/ts-factory/bublik-ui/commit/c609cc2f48ea72a639d2be3396e71afac386b5d7))
* **projects:** extend config schema with project field ([a1dd545](https://github.com/ts-factory/bublik-ui/commit/a1dd545b9858fdb3ae4e3eab2ffd6dc58d829b4c))
* **projects:** implement project creation modal and add project dropdown to sidebar ([9255aeb](https://github.com/ts-factory/bublik-ui/commit/9255aeb6513274c580386c2c418fb1b61f202a70))
* **projects:** implement project filtering across pages ([f88a601](https://github.com/ts-factory/bublik-ui/commit/f88a6018f911dbea35c29ebee758fa5f41b65ad5))
* **projects:** improve error handling for project creation and update forms ([d1e366a](https://github.com/ts-factory/bublik-ui/commit/d1e366a1988706a39f06e6c99aaf75c1d0b59d2c))
* **projects:** replace Link with `LinkWithProject`` across all components ([72ffded](https://github.com/ts-factory/bublik-ui/commit/72ffdeda47b552c3dfb12a6b27f2d53b27fdbf1f))
* **report:** [chart] add toolbar for report charts ([ee23155](https://github.com/ts-factory/bublik-ui/commit/ee231559b6464970c68bad61fc953734195f10b2))
* **report:** [TOC] remember open/close state in URL ([1db6e9c](https://github.com/ts-factory/bublik-ui/commit/1db6e9c4e2f160d46525951ca7ee7a042f87a550))
* **run:** improve error handling in compromise status feature ([d3ea8fb](https://github.com/ts-factory/bublik-ui/commit/d3ea8fbce8734f54e1211b0d9a9ca027f9e3f607))
* **ui:** [icons] add external-link icon ([91ad7aa](https://github.com/ts-factory/bublik-ui/commit/91ad7aabd903fe4352e79af036169a28a115867d))
* **ui:** [split-button] add new component for split-button ([4cb17a0](https://github.com/ts-factory/bublik-ui/commit/4cb17a0b9732154d7efddfca5e066e71e254f381))


### 💅 Polish

* **configs:** add animation for project list accordion open/close states ([8d708d1](https://github.com/ts-factory/bublik-ui/commit/8d708d1ee2c97814376bff04c03866f3fd61aeee))
* **net:** [packet-table] add proper empty/loading states ([66edb07](https://github.com/ts-factory/bublik-ui/commit/66edb07fe35b490f58e51dfab1dff67f8f41e393))
* **sidebar:** fix sidebar button label alignment ([7b52db1](https://github.com/ts-factory/bublik-ui/commit/7b52db1f3b5dabaef0917c51f8ce650ef2fb5831))
* **sidebar:** refactor project dropdown and search hooks ([824a493](https://github.com/ts-factory/bublik-ui/commit/824a493fe219ac5747f50bb601bdc3dab7b81c06))
* **ui:** [dropdown-menu] remove unused left padding from dropdown menu items ([ae46070](https://github.com/ts-factory/bublik-ui/commit/ae460701522643e91221caa5fa4421a7d0c4d9cc))


### 🐛 Bug Fix

* **assets:** ensure public directory exists for static assets ([33dd537](https://github.com/ts-factory/bublik-ui/commit/33dd537b32ba75f3e38e08d5658b247f7482643d))
* **ci:** increase node memory limit to prevent out-of-memory errors ([4426e54](https://github.com/ts-factory/bublik-ui/commit/4426e54016028caed13315c5464e47ff30ad6dab))
* **configs:** handle default project deletion and conditional rendering ([bb1f043](https://github.com/ts-factory/bublik-ui/commit/bb1f043989d699c85fd60a84605ce02808cded40))
* **configs:** handle null project IDs in config list and API schema ([bbc5157](https://github.com/ts-factory/bublik-ui/commit/bbc51571149f2e6e5f2d81bfd5570e051cb4a991))
* **history:** preserve project filter when resetting history filters ([9aaa76f](https://github.com/ts-factory/bublik-ui/commit/9aaa76f8bb7fff47f8cdeb1d44c6c4f0c99c6fec))
* **import:** improve import log error handling and display ([b869367](https://github.com/ts-factory/bublik-ui/commit/b86936705d27f771f80f173294c93f33d8c322f2))
* **net:** evenly space bottom panels for tree and data sources ([ce42680](https://github.com/ts-factory/bublik-ui/commit/ce42680b5ed3a5151ec92fa3c87991ffd2eb6016))
* **net:** loading `.cap` and `.pcap` files ([ffaa94e](https://github.com/ts-factory/bublik-ui/commit/ffaa94ed8b25fb73fe4c8cf93b28b64dd3591b86))
* **projects:** add truncate class to project dropdown text ([2bd9f4d](https://github.com/ts-factory/bublik-ui/commit/2bd9f4dcc34794c76fc8f5db03c33ad0a8a351d2))
* **projects:** handle `undefined` project field in config endpoint ([625d0d4](https://github.com/ts-factory/bublik-ui/commit/625d0d417a23c7463bd1fa922a2f3af6d17b43ab))
* **projects:** refine config endpoint error handling and project field ([66c7af5](https://github.com/ts-factory/bublik-ui/commit/66c7af55d9f673beb2720989283e11b1f8c86fa1))
* **projects:** rename `project_name`` field to `name` in API endpoints ([c71b31e](https://github.com/ts-factory/bublik-ui/commit/c71b31e712e06c7c2282b56cfe0911443cc986b9))
* **report:** [table] fix react duplicate key error ([b9a8971](https://github.com/ts-factory/bublik-ui/commit/b9a8971dbcc7114209f4ba1ecd9ab0d96c7f7119))
* **run:** [comments] add project ID to test comment functionality ([80620d4](https://github.com/ts-factory/bublik-ui/commit/80620d49318bc7ef046a276de4a922291094897b))
* **run:** add no-cache to outside domains issues endpoint ([fa488d2](https://github.com/ts-factory/bublik-ui/commit/fa488d25f0a7b89bdfb1b3d7aef946c58a014d11))
* **run:** fix split button popover being overlayed by run row ([7584646](https://github.com/ts-factory/bublik-ui/commit/7584646f0f15f4afbbc9c2e35898c453ce4fdcd8))
* **run:** update API endpoints and remove unused prefetch ([19f65e1](https://github.com/ts-factory/bublik-ui/commit/19f65e1f2f6a186c92d22f53cc6d44ce2732f8a2))
* **types:** replace most of `any` types with concrete ones ([b3edcba](https://github.com/ts-factory/bublik-ui/commit/b3edcba4aa2aee2b8a6280fdb05535f6ee2718b0))
* **ui:** [link] update link component ref type and pass ref to Link ([3f318a0](https://github.com/ts-factory/bublik-ui/commit/3f318a05df4a1c23741ae1804d4c64b73020c06c))
* **ui:** fix circural deps issue with context-links component ([12775d0](https://github.com/ts-factory/bublik-ui/commit/12775d0b6027daf152bafba923b8010597cedaa5))


### ♻ Code Refactoring

* **history:** [linear] use split button to display shortcuts ([431ac51](https://github.com/ts-factory/bublik-ui/commit/431ac51fb21003ff33d9c90c794d39d5b808a681))
* **projects:** add project support to config creation and sidebar ([bd9fb66](https://github.com/ts-factory/bublik-ui/commit/bd9fb662d14349c0ce40b4d33f393e8fb612eb19))
* **projects:** refactor project dropdown to use radio buttons instead of checkboxes ([1d3152f](https://github.com/ts-factory/bublik-ui/commit/1d3152f8182e838f9473fc594287c7a7be0aec31))
* **report:** [chart] extract logic for chart options ([e832af0](https://github.com/ts-factory/bublik-ui/commit/e832af050c9eca2497ba431227b3342837544197))
* **run:** [result-table] change history link labels and add new shortcuts ([484c4d5](https://github.com/ts-factory/bublik-ui/commit/484c4d55d955a953b8c45f13d5aeb53be8c718d3)), closes [#358](https://github.com/ts-factory/bublik-ui/issues/358)
* **run:** [results] use split button to display links to history ([3ff9b3c](https://github.com/ts-factory/bublik-ui/commit/3ff9b3c192acdfbfc18981e0cc17c4cb0fe9cc97))


### 📦 Chores

* **charts:** delete outdated toolbar component ([d47507d](https://github.com/ts-factory/bublik-ui/commit/d47507dffd44c80ce44e47b3e70153455b5a8cd6))
* **faq:** remove outdated storybook story ([526f99b](https://github.com/ts-factory/bublik-ui/commit/526f99b8074d141cbc7161620d29d4b1f2a4886f))
* **measurements:** remove unused chart imports from plot list component ([6469f18](https://github.com/ts-factory/bublik-ui/commit/6469f188050c23db6532814030ae59c0dd5a174b))
* **measurements:** update export utility import path ([8d2b23a](https://github.com/ts-factory/bublik-ui/commit/8d2b23a1a8ab3083bba4c99b3addd76a5e2dc155))
* **net:** generate library for network analysis ([6f5f43a](https://github.com/ts-factory/bublik-ui/commit/6f5f43ae12e13e5291fb7a4f640ac45b48a0a29e))
* **net:** move packet analysis component to generated library ([303ae2e](https://github.com/ts-factory/bublik-ui/commit/303ae2e3c7f9f1b7e91488d30dbd6bd8099b0d31))
* **projects:** update redux toolkit query import path ([f8a877e](https://github.com/ts-factory/bublik-ui/commit/f8a877e7d52ee2cb186f82632f59e5682bcd9c4f))
* **run:** remove debug console log from compromise form ([eade7db](https://github.com/ts-factory/bublik-ui/commit/eade7dbcde1e75ef062a9accca44385e56057244))
* **sidebar:** update project dropdown and sidebar link behavior ([ca939ae](https://github.com/ts-factory/bublik-ui/commit/ca939ae83831a8f23588b8de0ff409a86d71653e))


### ⚡ Performance Improvements

* **images:** convert PNG images to WebP for improved performance and loading speed ([844bb16](https://github.com/ts-factory/bublik-ui/commit/844bb16f6d6f52f0ddbc7edd508cd325dc439d5d))

### [1.10.2](https://github.com/ts-factory/bublik-ui/compare/v1.10.1...v1.10.2) (2025-07-16)


### 🐛 Bug Fix

* **report:** [table] don't show "undefined" when formatter is not present ([7876216](https://github.com/ts-factory/bublik-ui/commit/78762163a5bad460ed573fd1814c9685e8430b2a))

## [1.10.0](https://github.com/ts-factory/bublik-ui/compare/v1.9.0...v1.10.0) (2025-07-09)


### 🚀 New Feature

* **history:** [charts] add new mode for measurements by result ([d17f7d5](https://github.com/ts-factory/bublik-ui/commit/d17f7d572957d0e9eae6a8dac7f21780e873f714))
* **history:** [charts] add new section with measurement series chart data ([07a027c](https://github.com/ts-factory/bublik-ui/commit/07a027cf9e06109498e2b59d7ae07adf18ffbdc7))
* **history:** [charts] add selected group in search params for persistence ([b2e6b6d](https://github.com/ts-factory/bublik-ui/commit/b2e6b6d8f828d9744c1a0cfbd8566a269a76a756))
* **history:** add help for "Series Charts" history mode ([ee98b3a](https://github.com/ts-factory/bublik-ui/commit/ee98b3aec3aa59cb7686702489aa8ec2e61aff81))
* **history:** adjust history measurements API for new response type ([031b2e1](https://github.com/ts-factory/bublik-ui/commit/031b2e1e04ede39ee4570f563b276699face081e))
* **import:** handle `RECEIVED` and `STARTED` statuses ([1a82e3c](https://github.com/ts-factory/bublik-ui/commit/1a82e3cdc4549f070dfe886fe49ab2f3e36309da)), closes [#347](https://github.com/ts-factory/bublik-ui/issues/347)
* **report,measurements:** add toggle to limit min/max values for plot ([c0e2cc6](https://github.com/ts-factory/bublik-ui/commit/c0e2cc659915dfd0ec83b876a54adcc138d3887f)), closes [#350](https://github.com/ts-factory/bublik-ui/issues/350)
* **report:** allow empty `series` and `series_labels` ([0efffbf](https://github.com/ts-factory/bublik-ui/commit/0efffbf61a25b651a0e9cb76e308ed566e997ba4)), closes [#349](https://github.com/ts-factory/bublik-ui/issues/349)


### 🐛 Bug Fix

* **history:** [series] show only results which have measurements ([1698f25](https://github.com/ts-factory/bublik-ui/commit/1698f254dd90149eaba045eebb34c80ebb1e30cd))


### ♻ Code Refactoring

* **history,run:** [results] allow multiple `expected_results` ([6cc385c](https://github.com/ts-factory/bublik-ui/commit/6cc385c2597062cd37065d2bc73db26f8a4652c3))
* **measurements:** allow empty values and add `start` for result info block ([8da566d](https://github.com/ts-factory/bublik-ui/commit/8da566db73629fc95d02d3598ab7ff43518e4b94))


### 📦 Chores

* **history,measurements:** cleanup ([02af5da](https://github.com/ts-factory/bublik-ui/commit/02af5dacf898ada8ea3037a9a25ade035d57421a))
* **report:** add missing parameter to dependency effect array ([c2c2cf6](https://github.com/ts-factory/bublik-ui/commit/c2c2cf66c0d6fd7871ec341ee365ee9e5311f785))
* **report:** remove deprecated `nonscrict` call ([5de3b95](https://github.com/ts-factory/bublik-ui/commit/5de3b95cd944f3e2aa6d7efa372f1f12b29ee98f))

## [1.9.0](https://github.com/ts-factory/bublik-ui/compare/v1.8.0...v1.9.0) (2025-06-18)

## [1.8.0](https://github.com/ts-factory/bublik-ui/compare/v1.7.0...v1.8.0) (2025-05-21)


### 🚀 New Feature

* **log:** [new-bug] add log filters for scenario and verdict ([c1a7827](https://github.com/ts-factory/bublik-ui/commit/c1a7827b1346fcf100cf5b86463397c13d25dbdd)), closes [#246](https://github.com/ts-factory/bublik-ui/issues/246)
* **result:** [measurements] add selection popover for combined charts ([0d29de3](https://github.com/ts-factory/bublik-ui/commit/0d29de320d457b42467f5c78b1174570a83140da))
* **run,log:** show message for runs in progress instead of error ([9532d31](https://github.com/ts-factory/bublik-ui/commit/9532d31fbb8f2c86bbf3fb011f66c4a8af2a0db6))
* **runs:** add ability to select dates based on duration ([0fb0dbe](https://github.com/ts-factory/bublik-ui/commit/0fb0dbe7b7ea90924da6fe65a1bbef95c997905a))
* **runs:** add scroll to top on page change ([c8a91ef](https://github.com/ts-factory/bublik-ui/commit/c8a91ef15b7670dadee08b49c5401d98d3501b3a))
* **ui:** [date-range-picker] add mode for selection dates based on duration ([627c361](https://github.com/ts-factory/bublik-ui/commit/627c3614bd79c0ecbe8af6eb4eff108d694888a0))
* **ui:** [date-range-picker] make range buttons select sliding window ([81bd2dd](https://github.com/ts-factory/bublik-ui/commit/81bd2ddcd9364f5bf3406c751057530dbcaf0ee5))
* **utils:** add function to parse ISO8601 duration format ([112d73b](https://github.com/ts-factory/bublik-ui/commit/112d73b98ab8730ee12e15391b51e352cfdf7876))


### 💅 Polish

* **result:** [measurement] fix selection popover overlap with table header ([374ec57](https://github.com/ts-factory/bublik-ui/commit/374ec57eda7b2e79e9e558f868cd3045247ab881))
* **run:** change padding for all popovers ([255d6e1](https://github.com/ts-factory/bublik-ui/commit/255d6e15b5a9c917b00b5e300abd3b611e3703fe))
* **runs:** align "Name" and "Start" labels vertically in list item ([466a349](https://github.com/ts-factory/bublik-ui/commit/466a349b92607d35587367c0cb6d3b33802ec41e))
* **ui:** [date-range-picker] fix hover styles for cells ([b2e50ea](https://github.com/ts-factory/bublik-ui/commit/b2e50ea2814a68a9e071f07f9783f8ea107bdcb4))
* **ui:** [date-range-picker] prevent jumping when changing mode ([c172c68](https://github.com/ts-factory/bublik-ui/commit/c172c6893f41dd3676f6ce06b2cc541f94cb4d82))


### 🐛 Bug Fix

* **ci:** ignore `.pnpm-store` while checking formatting ([19fd7f4](https://github.com/ts-factory/bublik-ui/commit/19fd7f48f767a9dfc874f5f9d072ab620169f47c))
* **configs:** [editor] prevent monaco editor getting source from CDN ([0969059](https://github.com/ts-factory/bublik-ui/commit/09690597175663d56a2345044e112687e9850a37))
* **log:** [mi] ensure last data point is included in chart ([4b2ac17](https://github.com/ts-factory/bublik-ui/commit/4b2ac17e1d70d2b9114712c66cce28a512401f8f))
* **log:** [mi] fix incorrect distance proportion between points ([ed3c00f](https://github.com/ts-factory/bublik-ui/commit/ed3c00f1dd349885f1b7a04e4ad7196719914969))
* **log:** [new-bug] escape `|` in log to properly format markdown table ([bbaf57d](https://github.com/ts-factory/bublik-ui/commit/bbaf57d63bbffc46c292d8f18525a0516858e4f7))
* **report,result:** [chart] incorrect distance proprtions in charts ([3e6a537](https://github.com/ts-factory/bublik-ui/commit/3e6a53785542414946d249ed2a187fb3234eab45))
* **report:** missing tab title when reloading page ([c1a1e19](https://github.com/ts-factory/bublik-ui/commit/c1a1e19d0b18aa54e1b4e8dde3cfd03d0f8847e6)), closes [#321](https://github.com/ts-factory/bublik-ui/issues/321)
* **run,log:** disable link in case no URL for source available ([973689c](https://github.com/ts-factory/bublik-ui/commit/973689c8a71c26b306d80c6b534e9e29d4355878)), closes [#243](https://github.com/ts-factory/bublik-ui/issues/243)
* **run:** remove auto-sort on "Preview NOK" button click ([e8bbb8f](https://github.com/ts-factory/bublik-ui/commit/e8bbb8fca3b0df2d59b9768f45d89ef56bd0a35c)), closes [#320](https://github.com/ts-factory/bublik-ui/issues/320)
* **run:** use correct endpoint for getting bug storage url ([fc9f8b0](https://github.com/ts-factory/bublik-ui/commit/fc9f8b028f3f6e44811d7339a2935fb138449468))


### ♻ Code Refactoring

* **history:** [measurements] use selection state popover from shared lib ([727aaad](https://github.com/ts-factory/bublik-ui/commit/727aaadc4115ac6eef16cc7b5af60d6e2a6e5f97))
* **log:** allow dynamically to get initial filter options ([c7cf020](https://github.com/ts-factory/bublik-ui/commit/c7cf0207448f21d932a50b57fb3037af172332eb))


### 📦 Chores

* **log:** [attachments] improve filename generation ([9e7af6d](https://github.com/ts-factory/bublik-ui/commit/9e7af6d06b40a6c6b540b88ddccd503a86c9685f))
* **log:** delete duplicated code for log source button component ([0a2f7fb](https://github.com/ts-factory/bublik-ui/commit/0a2f7fb394c1ded7cd65be5c97584bb2984193c3))
* **log:** extract new bug button component ([5dd6e8e](https://github.com/ts-factory/bublik-ui/commit/5dd6e8e1967c14b1da5bf6fe94087a1757c99ac8))
* **log:** remove duplicated new bug button component usage ([4de5b28](https://github.com/ts-factory/bublik-ui/commit/4de5b286d6eb6fb340db13aff7bac1da098b8f5a))
* **log:** remove new bug button component ([2708628](https://github.com/ts-factory/bublik-ui/commit/2708628092af43ed62c302e84e6a6d6ad651ca61))
* **measurements:** extract selection popover for charts to shared lib ([5867d11](https://github.com/ts-factory/bublik-ui/commit/5867d11caad7022e6ef0dc8acf061a7be0505ad4))
* **redux:** upgrade redux and zod to latest ([54be9d1](https://github.com/ts-factory/bublik-ui/commit/54be9d132b65ee65ffc6aba84402c41a501de059))
* **runs:** remove max selection limit to view merged runs ([27ef3c1](https://github.com/ts-factory/bublik-ui/commit/27ef3c17e9cfaa06c52fa22fa9b48936a69131b0))
* **ui:** [date-range-picker] adjust types for duration picker ([e442a0b](https://github.com/ts-factory/bublik-ui/commit/e442a0bcef0de69773eeb5e730716b8dca34c2eb))
* **ui:** [date-range-picker] extract shared constants and types ([35e8a63](https://github.com/ts-factory/bublik-ui/commit/35e8a63bd5824b6732bd86ac5d09fe13aa088148))
* **ui:** [icons] add gear icon ([2c958bd](https://github.com/ts-factory/bublik-ui/commit/2c958bdf35fc0e112dfcb823b59571c32b1e68df))

## [1.7.0](https://github.com/ts-factory/bublik-ui/compare/v1.6.1...v1.7.0) (2025-04-16)


### ♻ Code Refactoring

* **logs:** rename 'Artifacts' to 'Attachments' ([07d5667](https://github.com/ts-factory/bublik-ui/commit/07d566768c125b8d4976d9e7cb54b5a7779721c8))

### [1.6.1](https://github.com/ts-factory/bublik-ui/compare/v1.6.0...v1.6.1) (2025-04-04)

### 🐛 Bug Fix

- **import:** don't modify response from API ([aa96896](https://github.com/ts-factory/bublik-ui/commit/aa968966c797c11def219b0c14b8b14b184023e9))

## [1.6.0](https://github.com/ts-factory/bublik-ui/compare/v1.5.0...v1.6.0) (2025-04-04)

### 🚀 New Feature

- **import:** add support for API pagination ([c438ec3](https://github.com/ts-factory/bublik-ui/commit/c438ec3a4a10083564f710d9121801b0960c27aa))

### 🐛 Bug Fix

- **api:** typo in short_url endpoint ([95a01e2](https://github.com/ts-factory/bublik-ui/commit/95a01e20837ffbf49c01e78b87e86c66eb8f33cb))

### 📦 Chores

- **import:** make 'importruns' default facility ([9f6fa6d](https://github.com/ts-factory/bublik-ui/commit/9f6fa6d30c1ce4dd0c645d53d109157b264e47c9))

## [1.5.0](https://github.com/ts-factory/bublik-ui/compare/v1.4.0...v1.5.0) (2025-03-27)

### ⚠ BREAKING CHANGES

- **run:** add migration for url query expanded state

### 🚀 New Feature

- add query delimiter to global config ([d7d8fae](https://github.com/ts-factory/bublik-ui/commit/d7d8fae798ce279687f3e83f9c287237aeca3bd9))
- **run:** add global url requirements filter provider ([22b1201](https://github.com/ts-factory/bublik-ui/commit/22b120125d7edab39156cceb18f6f15a9b35aff3))
- **run:** add requirements filter ([c54fcab](https://github.com/ts-factory/bublik-ui/commit/c54fcabe677b98a54b29730c83e0638d91dc451c))
- **run:** re-enable parameters diff mode ([9c7da00](https://github.com/ts-factory/bublik-ui/commit/9c7da003f45cd61ef1ca7204ed024c6813a29f42))

### 💅 Polish

- **run:** adjust offsets for results table toolbar ([65c95c1](https://github.com/ts-factory/bublik-ui/commit/65c95c184cc576261e1ee76bb6f69331ef49908c))
- **run:** change button style to show result filters toolbar ([a3f0a78](https://github.com/ts-factory/bublik-ui/commit/a3f0a78912d02f06b4f424eb2962c42a4fd0fb4a))

### ♻ Code Refactoring

- **api:** change API for fetching runs ([12851cc](https://github.com/ts-factory/bublik-ui/commit/12851cc07cbc5a7a5f59605eff186f8a5909b7ae))
- **run:** add `abnormal` to unexpected columns for expansion ([a4ffac0](https://github.com/ts-factory/bublik-ui/commit/a4ffac048a07cf22aa9da6b09e8d97bcfdebb452))
- **run:** add migration for url query expanded state ([0b9f3b6](https://github.com/ts-factory/bublik-ui/commit/0b9f3b6ff77a1e7442cb9fce415cf8ee47aeb7a4))
- **run:** adjust getting row id ([9fbd4a3](https://github.com/ts-factory/bublik-ui/commit/9fbd4a3f3160e50c8e1ad622183829758dbb9b4d))
- **run:** show filter options based on filtered data ([c3c66b1](https://github.com/ts-factory/bublik-ui/commit/c3c66b11aaea1a164357c8eb17661098a1e336a5))

### 📦 Chores

- **run:** fix types and some style changes ([04e7977](https://github.com/ts-factory/bublik-ui/commit/04e7977b4cc91afd5935475fefc9d35a4e83f889))
- **types:** adjust incorrect types ([81b167f](https://github.com/ts-factory/bublik-ui/commit/81b167faeb88e2b1efc91b5d8952fdbbb983d807))
- **ui:** extract data table faceted filter to shared lib ([0e977a4](https://github.com/ts-factory/bublik-ui/commit/0e977a482d87bbbb6b56783f24852ae5cfebf887))

## [1.4.0](https://github.com/ts-factory/bublik-ui/compare/v1.3.1...v1.4.0) (2025-03-27)

### 🚀 New Feature

- **config:** get available config types from rest api ([86ccf09](https://github.com/ts-factory/bublik-ui/commit/86ccf095eacfe66c3d55fb42c98bb1af3dca7ac4))
- **history:** [measurements] mark results with `has_error` with green/red marks ([a3321ef](https://github.com/ts-factory/bublik-ui/commit/a3321ef9ed7a16e881d6b1e71b21d27ef9b65ea6))
- **log:** add artifacts dropdown menu to log page and log preview ([2e7a4ee](https://github.com/ts-factory/bublik-ui/commit/2e7a4eeb3b99b429ab1891d38f6a91e4c3edb40c))
- **log:** add endpoint to fetch `artifacts.json` ([0565219](https://github.com/ts-factory/bublik-ui/commit/0565219a8e5f4b3226755196b2d7edfdf830808e))
- **log:** add log-artifacts dropdown menu component ([3353a06](https://github.com/ts-factory/bublik-ui/commit/3353a0683594e6462fef1183bb6ad2621c0c6ade))
- **ui:** add icon for download ([3b38881](https://github.com/ts-factory/bublik-ui/commit/3b38881a10de1a8c29ae2308d9fbe790db76fa4a))

### 💅 Polish

- **measurements:** remove red and green colors from theme for lines ([ffc8aa9](https://github.com/ts-factory/bublik-ui/commit/ffc8aa94c2e456632b37513cfc167aac865c535f))
- **report:** chart use empty circle for results without `has_error` ([5ad1d2b](https://github.com/ts-factory/bublik-ui/commit/5ad1d2b191a4069942e31a08c88ae1e925202099))

### 🐛 Bug Fix

- **history:** [linear] reset filters on "Preview" button click ([ed2304b](https://github.com/ts-factory/bublik-ui/commit/ed2304b1a26224b68ee74ed98f351ebb8fa769d4))

### 📦 Chores

- **log:** change button label for viewing legacy log ([057e3db](https://github.com/ts-factory/bublik-ui/commit/057e3dbf890cde3f701979a52053cf621265f7f3))
- **log:** generate log-artifacts library ([9ace68a](https://github.com/ts-factory/bublik-ui/commit/9ace68a2b8ebc4f85c40498123540b9e23d10370))

### [1.3.1](https://github.com/ts-factory/bublik-ui/compare/v1.3.0...v1.3.1) (2025-02-28)

### 🐛 Bug Fix

- **report:** [chart] highlight with red color points with `has_error` flag ([b7eb34b](https://github.com/ts-factory/bublik-ui/commit/b7eb34ba84c3e3b9ff23d1e00c7b80cc50b01bb8)), closes [#303](https://github.com/okt-limonikas/bublik/issues/303)

## [1.3.0](https://github.com/ts-factory/bublik-ui/compare/v1.2.0...v1.3.0) (2025-02-27)

### 🚀 New Feature

- **build:** add check that json logs is buildable to CI ([7f5ffa8](https://github.com/ts-factory/bublik-ui/commit/7f5ffa8c5d5d7cf9f32536f8b3d6d1c109ab2c91))
- **config:** add ability to create configs for references, meta, tags ([d1b5d23](https://github.com/ts-factory/bublik-ui/commit/d1b5d23af5f01ccc652ef5bc799f396e3070bbcc))
- **history:** add shortcut to view log on linear history ([1ee797b](https://github.com/ts-factory/bublik-ui/commit/1ee797bf113a55cef4fd8f9371896a4ece72aa4f))
- **log:** add application for local json logs ([6608e67](https://github.com/ts-factory/bublik-ui/commit/6608e67946e01dcf947f0df2bd9d80086fe32264))
- **run:** [table] add help dialog with usage information ([33690f7](https://github.com/ts-factory/bublik-ui/commit/33690f7887a499a5132b46e452e674cbcd3dbc12))

### 🐛 Bug Fix

- **log:** don't camelize keys to improve compatability ([9c64f2e](https://github.com/ts-factory/bublik-ui/commit/9c64f2ec3dad33ca3e407b24a3bcc37239d995bf))
- **log:** improve parameter value formatting in log meta block ([a6c2399](https://github.com/ts-factory/bublik-ui/commit/a6c2399c2003a821a6c7dd65701ed7a05b461e7d))
- **run:** display missing link to result ([c7275ea](https://github.com/ts-factory/bublik-ui/commit/c7275eaaea3ca008bbc72070324f3048bbc8e23b))
- **types:** fix typescript issues for tanstack react table ([1b8d911](https://github.com/ts-factory/bublik-ui/commit/1b8d911064afdba01d0c8ee228f0a891221b15eb))

### 📦 Chores

- **log:** [preview] change order of links ([d37b6c9](https://github.com/ts-factory/bublik-ui/commit/d37b6c9499697ab190fcd7935a0b2ebb70c7e713))
- remove redundant import ([2de7d60](https://github.com/ts-factory/bublik-ui/commit/2de7d60338f92d9e537a6ae94084eeb9a21bfa57))
- **result:** rename links from "measure" to "result" ([d27d2b3](https://github.com/ts-factory/bublik-ui/commit/d27d2b3c789c9f8270bc9111fc1a6230a283a87f))
- **types:** remove `test_name` from linear history data type ([3eb226e](https://github.com/ts-factory/bublik-ui/commit/3eb226ecffe606d3e344d248cc771ee79b2c50b5))
- **ui:** move help dialog to shared lib ([ccaef6b](https://github.com/ts-factory/bublik-ui/commit/ccaef6b27ba879e4fab1cdee2466446e776c40ec))

## [1.2.0](https://github.com/ts-factory/bublik-ui/compare/v1.1.0...v1.2.0) (2025-02-18)

### 🚀 New Feature

- **report:** [chart] highlight failed results with red and symbol ([cf91f2c](https://github.com/ts-factory/bublik-ui/commit/cf91f2c8e9b97e4201e37f2aa6a2d5b7b9922d5a))

### 🐛 Bug Fix

- **docker:** disable check for prettier ([17a31ad](https://github.com/ts-factory/bublik-ui/commit/17a31adcb949c6e81fbf91c0f3acdbde2104f37c))
- **docker:** fix corepack keyid mismatch issue ([31d4dc2](https://github.com/ts-factory/bublik-ui/commit/31d4dc203c031eea0d3588cde9df9d3b45a7101b))
- **run:** [table] missing column visibility url state ([a63a725](https://github.com/ts-factory/bublik-ui/commit/a63a725f7bc1a97700e6b5d44ddae3a3f948e980))

### 📦 Chores

- **config:** remove redundant config migration check ([e03016d](https://github.com/ts-factory/bublik-ui/commit/e03016d53b6a868b50fb26e52678526a9a70a200))

## [1.1.0](https://github.com/ts-factory/bublik-ui/compare/v1.0.2...v1.1.0) (2025-01-29)

### 🚀 New Feature

- **docs:** add docs link to sidebar under help section ([f366807](https://github.com/ts-factory/bublik-ui/commit/f3668075b372a5012ab5e82f9c7751a8b76bd683))
- **help:** add tip on how to access help dialog from sidebar ([a2aceef](https://github.com/ts-factory/bublik-ui/commit/a2aceeff45af59c1bcbc71d951d89a2f9f8f788f))
- **import:** add links to flower, run, log from import log ([6897567](https://github.com/ts-factory/bublik-ui/commit/6897567658fdc8b76f941c2efe44befe5dabae55))
- **import:** allow url links to specific logs ([ef7210a](https://github.com/ts-factory/bublik-ui/commit/ef7210a707544bd06f58d9936553271369aec6ed))
- **import:** invalidate import events table on submit ([6dfdcf8](https://github.com/ts-factory/bublik-ui/commit/6dfdcf8c5f984a6137fc0ec5981f7af8d1c71fbe))
- **log:** add loading skeleton for log loading ([f367cd0](https://github.com/ts-factory/bublik-ui/commit/f367cd070fbaae3e3f9f11ba90ecc44dd8a319ca))
- **log:** add scroll to top button on log page ([45ae4a2](https://github.com/ts-factory/bublik-ui/commit/45ae4a27ccca84e6e159957caf05939af4a5fc52))
- **run:** [objective] add popover with full content ([63abe5a](https://github.com/ts-factory/bublik-ui/commit/63abe5ad8484f2f7fe252d4c8a0ff16c439e7c92))
- **sidebar:** add help dialogs for sidebar links ([2c8e162](https://github.com/ts-factory/bublik-ui/commit/2c8e162fdf92802de6a42072ba14d6c12b039f5f))

### 💅 Polish

- **layout:** fix sidebar and drawer height on tablets ([b59056d](https://github.com/ts-factory/bublik-ui/commit/b59056db8da6b83f18ea69276ec194a409f7b65c))
- **log:** [header] fix wrap for multiline objective ([ee4a066](https://github.com/ts-factory/bublik-ui/commit/ee4a06655d0b24ced80fe5f2a5499937c0c8dc64))
- **log:** [table] change font size to 13px ([e40d089](https://github.com/ts-factory/bublik-ui/commit/e40d0890e7848702daf0dd476eca5168e732d7c3))
- **log:** [table] make colors dimmer ([ef17d40](https://github.com/ts-factory/bublik-ui/commit/ef17d4038ce82e8a289d40241853ce085e1811cd))
- **log:** add Geist Mono font as default monospace ([4277aac](https://github.com/ts-factory/bublik-ui/commit/4277aac70696c7bcfa09fe6ed10249837dd5d4d7))
- **log:** reduce margin bottom and set mono font for log ([93f637c](https://github.com/ts-factory/bublik-ui/commit/93f637c3a574c1da98c86b79ba837ce1974b84b6))
- **run:** [table] make cell padding smaller ([9929dba](https://github.com/ts-factory/bublik-ui/commit/9929dba7b23d0db97d41269a1dc5ae39f9337a81))
- **runs:** [charts] add better separation between different charts ([8524131](https://github.com/ts-factory/bublik-ui/commit/852413199eed648db16a662d577ddc620e227c25))
- **runs:** add icon for submit and change button order ([3f6c712](https://github.com/ts-factory/bublik-ui/commit/3f6c71294977adb3036facd12134796397d1edf4))

### 🐛 Bug Fix

- **build:** add `.nx` and `dist` folders to `.dockerignore` ([902e27c](https://github.com/ts-factory/bublik-ui/commit/902e27c3dc52e73910df9406800d8fe2202b22ac))
- **dashboard:** refetch dashboard on mount and bypass browser cache ([c665f8e](https://github.com/ts-factory/bublik-ui/commit/c665f8eedb5c7096d631462980ce808980f9fdb7))
- **history:** invalidate cache on submit click ([328130c](https://github.com/ts-factory/bublik-ui/commit/328130c2c72466d6b1ee09f49096dae6bf57e73d)), closes [#90](https://github.com/ts-factory/bublik-ui/issues/90)
- **import:** bypass browser cache when polling logs ([e8dc121](https://github.com/ts-factory/bublik-ui/commit/e8dc121093006437ce208ea73e2cd0fcab482833))
- **import:** fix import log events table caching ([5c79e7b](https://github.com/ts-factory/bublik-ui/commit/5c79e7b29ee30cc4684a35d977e3010218208909))
- **log:** [table] include #T: Verdict in scenario filter ([e6847df](https://github.com/ts-factory/bublik-ui/commit/e6847dfc7db34d5a3075d70cddfa785918286683))
- **log:** don't use custom redirect for JSON logs in development ([6e03bf0](https://github.com/ts-factory/bublik-ui/commit/6e03bf01ceadfe04f291a443c39d14509d52b856))
- **run:** fix test row overflowing results when objective too big ([566a518](https://github.com/ts-factory/bublik-ui/commit/566a518b281f722a3d807c15cfb7094f06edad7e)), closes [#251](https://github.com/ts-factory/bublik-ui/issues/251)
- **runs:** [table] invalidate cached data on submit ([1ea7a3c](https://github.com/ts-factory/bublik-ui/commit/1ea7a3c6afd71fcd2c5cd9021cff1c621edbcf88)), closes [#90](https://github.com/ts-factory/bublik-ui/issues/90)
- **runs:** refetch runs list on mount and bypass browser cache ([ca9c984](https://github.com/ts-factory/bublik-ui/commit/ca9c98412bf5b0aa39cf77ddddb51bdf2d5cdf64))
- **ui:** missing separator border ([4c13552](https://github.com/ts-factory/bublik-ui/commit/4c13552e5ec947373db170c010344c1126cbe100))

### ♻ Code Refactoring

- **import:** improve styling of import table and form ([b1aa6d3](https://github.com/ts-factory/bublik-ui/commit/b1aa6d37e6ac55a1101fb7297acb79b098142296))
- **log:** [header] full refactor of log meta ([50ce8d9](https://github.com/ts-factory/bublik-ui/commit/50ce8d9a911616c64d3c4d14e740ab5508a5e1d2))
- **log:** [table] add log tree nest indicator, integrate toolbar ([83453f6](https://github.com/ts-factory/bublik-ui/commit/83453f63598d3f4f703ec1da8d15a56b18db791e))
- **log:** [toolbar] fix bugs with toolbar scrolling and jumping ([fde2d21](https://github.com/ts-factory/bublik-ui/commit/fde2d21fcde62d59c8ebd05a485aba98a61487fe))
- **log:** display packages test lists as table ([1c528f6](https://github.com/ts-factory/bublik-ui/commit/1c528f6994cc878998ae333b5950aa37cb01e1fb))
- **ui:** allow greater composability for scroll to top component ([26d84e1](https://github.com/ts-factory/bublik-ui/commit/26d84e185179c8a34413beecb414e1dbb963f971))

### 📦 Chores

- **build:** bump docker images to node 22.13-alpine LTS ([49285b8](https://github.com/ts-factory/bublik-ui/commit/49285b8ccde4a9ede0d1dacb8b3f8e259550093f))
- **docs:** remove changelog from react app ([4423025](https://github.com/ts-factory/bublik-ui/commit/4423025d12bfde034299d27ab3b84d3605184fc2))
- **log:** add `requirements` to log header schema ([a426c29](https://github.com/ts-factory/bublik-ui/commit/a426c2977ded408277637c89663db8209b7561f0))
- **log:** apply format ([0786e4d](https://github.com/ts-factory/bublik-ui/commit/0786e4dc3693ca35b3d96b2475ceac97f9e5cd98))
- **log:** remove toast with delta anchor line information ([f7f3162](https://github.com/ts-factory/bublik-ui/commit/f7f316276c3d2123909af3a3c65f6be771d08276))
- **sidebar:** change labels for history, measurements for clarity ([d29c428](https://github.com/ts-factory/bublik-ui/commit/d29c4287a338813ccf750b0bc2cddc9588588843)), closes [#259](https://github.com/ts-factory/bublik-ui/issues/259)

### [1.0.2](https://github.com/ts-factory/bublik-ui/compare/v1.0.1...v1.0.2) (2024-12-24)

### 🐛 Bug Fix

- **config:** replace `.toSorted` with `.sort` for broader browser compatibility ([eb969b7](https://github.com/ts-factory/bublik-ui/commit/eb969b710e86a9444cb816a2a2dfb06408ebabdf))

### [1.0.1](https://github.com/ts-factory/bublik-ui/compare/v1.0.0...v1.0.1) (2024-12-13)

### 🚀 New Feature

- **measurements,history:** add sliders for zoom on x axis ([701fd89](https://github.com/ts-factory/bublik-ui/commit/701fd8988f5e344ef0c0928674d1b49958476f43))

### 💅 Polish

- **measurements:** show legend on the left to prevent overlay on y axis title ([d548e79](https://github.com/ts-factory/bublik-ui/commit/d548e79ef0bddebb7d4a6248134fe5ace0453146))

### 🐛 Bug Fix

- **history,measurements:** make more space for y axises ([94110dd](https://github.com/ts-factory/bublik-ui/commit/94110dd5f4781984a9009bf114cdddee88932b00))
- **history:** resolve url based on copy router location to prevent outdated urls ([bed012f](https://github.com/ts-factory/bublik-ui/commit/bed012f60d97ceba4b224a6483f8a343db500d51))
- **measurements:** prevent duplicate ids for plots with the same title ([632dadb](https://github.com/ts-factory/bublik-ui/commit/632dadb6ef69a043256e0bd6c80075b5d97b57d1))

## [1.0.0-rc.3](https://github.com/ts-factory/bublik-ui/compare/v1.0.0-rc.2...v1.0.0-rc.3) (2024-12-09)

### 🐛 Bug Fix

- **report:** handle `null` values for missing chart points ([239238f](https://github.com/ts-factory/bublik-ui/commit/239238fc41df447b5762237fafba010fe8403997))

## [1.0.0-rc.2](https://github.com/ts-factory/bublik-ui/compare/v1.0.0-rc.1...v1.0.0-rc.2) (2024-12-05)

### 🚀 New Feature

- **report:** [chart] add legend title only when `series_label` present ([f14af54](https://github.com/ts-factory/bublik-ui/commit/f14af54e228983dc718896bba3fa54932f6a22b8))

### 🐛 Bug Fix

- **history:** [measurements] axis Y label cutoff ([c54cd17](https://github.com/ts-factory/bublik-ui/commit/c54cd17ed112a6d017d9461b4c5919a9ec6ec9f3))
- **report:** [chart] axis Y label cutoff ([eea0d26](https://github.com/ts-factory/bublik-ui/commit/eea0d2645abe02509a46c3bed22bbb48553c8cdf))
- **report:** [chart] resize chart on window resize ([a453a95](https://github.com/ts-factory/bublik-ui/commit/a453a95ca21196dbc413fe8c3c1cceb92b032dcc)), closes [#114](https://github.com/ts-factory/bublik-ui/issues/114)

## [1.0.0-rc.1](https://github.com/ts-factory/bublik-ui/compare/v1.0.0-rc.0...v1.0.0-rc.1) (2024-12-04)

### 🐛 Bug Fix

- **measurements:** add missing measurement `aggr` ([436754c](https://github.com/ts-factory/bublik-ui/commit/436754c8b03eaeaa8a9887bc921d2471f957d933))
- **report:** [chart] don't display legend if only one series present ([85bbfba](https://github.com/ts-factory/bublik-ui/commit/85bbfbaf97143d07251137038b6055686c642033))
- **report:** [table] display `x` label in first column when have single series ([4336d22](https://github.com/ts-factory/bublik-ui/commit/4336d22d38b72327f00bfed3f41e3b17f16f926f))
- **report:** [table] fix warnings not shown correctly ([c9cd01c](https://github.com/ts-factory/bublik-ui/commit/c9cd01ce26869eaf5e89bd09551fafc356745b9f))

## [1.0.0-rc.0](https://github.com/ts-factory/bublik-ui/compare/v0.7.1...v1.0.0-rc.0) (2024-12-03)

### 🚀 New Feature

- **measurements:** added endpoint and types for single measurement plot ([3b8df42](https://github.com/ts-factory/bublik-ui/commit/3b8df42ec891fab6b79d03753b94268c3cee6085))
- **measurements:** added new chart component ([68f68c5](https://github.com/ts-factory/bublik-ui/commit/68f68c5be72bbaa6b0dc513ad78491e5e0fa52f9))
- **measurements:** added new stacked chart component ([513d581](https://github.com/ts-factory/bublik-ui/commit/513d5812575adda43befa13cecf06b23bdacc57d))
- **report:** [chart] open point info dialog when clicking on point ([840d9f9](https://github.com/ts-factory/bublik-ui/commit/840d9f9a90859f7c50ac2aaa0d515931a1c56507))
- **report:** [table] open point info dialog when clicking on table cell ([a1c8dcb](https://github.com/ts-factory/bublik-ui/commit/a1c8dcb6e8cf9744eb4546cba09aeddc4774ceab))
- **report:** added drawer with point information component ([c8c9450](https://github.com/ts-factory/bublik-ui/commit/c8c9450371d8b60bf62da361b356d4be5b1acbbe))
- **run:** added header groups to show difference between columns ([505d798](https://github.com/ts-factory/bublik-ui/commit/505d798b82843075b4f26ed49d8be1a0c98da20a)), closes [#175](https://github.com/ts-factory/bublik-ui/issues/175)
- **run:** added screen reader only label for "add note" button ([9ba0120](https://github.com/ts-factory/bublik-ui/commit/9ba01208a6cca5ed5b5650280cfb6c5a6dcc3e69))
- **ui:** [chart] allowed to override default options for chart ([bd65b92](https://github.com/ts-factory/bublik-ui/commit/bd65b92df0a6eefd25a64b204fb6271f7969bbf9))
- **utils:** added controllable state hook ([dc885dd](https://github.com/ts-factory/bublik-ui/commit/dc885ddb4b5b5e91f90b772030a1429472636c80))
- **utils:** added platform specific ctrl key hook ([3e92144](https://github.com/ts-factory/bublik-ui/commit/3e92144c76159513f4e8c6a511d7d9e49ecffaf1))

### 💅 Polish

- **report:** [chart] made chart take as much space as possible ([74df1e5](https://github.com/ts-factory/bublik-ui/commit/74df1e52d89436cd740233dfa81176f9e0e2abee))
- **report:** [table] made columns take 50% of width when only have one series ([b04ce9b](https://github.com/ts-factory/bublik-ui/commit/b04ce9b81ed5f36785f3fcddb706d68891005dfc))
- **run:** adjusted offset for sticky rows ([bf47f87](https://github.com/ts-factory/bublik-ui/commit/bf47f87fb3d0d1f11fc1f007dae3bf20f43f0ed5))

### 🐛 Bug Fix

- **history:** fixed history chart resetting zoom when releasing modifier key ([a8c47ca](https://github.com/ts-factory/bublik-ui/commit/a8c47cad6c461f1c0a52789324fc83dd6c4711f6))
- **log:** fixed crash when failing to retrieve node name ([5cf78e9](https://github.com/ts-factory/bublik-ui/commit/5cf78e924fc308257086e826447176bd51cafe61))
- **report:** [chart] added margin between legend and grid ([cda1f19](https://github.com/ts-factory/bublik-ui/commit/cda1f195f8bcaa732d6266134bf200e0ec10a0a3))
- **report:** [chart] display y_axis label when `series_label` is `null` ([567b059](https://github.com/ts-factory/bublik-ui/commit/567b05900a22adb7c90bf01982a6f73a3ae83bc7))
- **report:** [chart] don't show legend when series label is `null` ([f96bcc4](https://github.com/ts-factory/bublik-ui/commit/f96bcc48d3944ced1621440f1ea35e211c66a23e))
- **report:** [chart] fixed incorrect values on x axis ([1ee4da5](https://github.com/ts-factory/bublik-ui/commit/1ee4da5c75189e3535f895c82871f00c9971764f))
- **report:** [chart] fixed zoom reset on ctrl + scroll ([fbb976b](https://github.com/ts-factory/bublik-ui/commit/fbb976bf300866a9555e26dfdf25ef3004fb0de2))
- **report:** [table] incorrect table first series name ([55d576c](https://github.com/ts-factory/bublik-ui/commit/55d576cb4e2004b9066c048b45b67f48fa48b70b))
- **run:** fixed text comment popover being on partially shown ([e803cd9](https://github.com/ts-factory/bublik-ui/commit/e803cd9e8589ba5b042cfb598fb6601acaf1e6ed))

### ♻ Code Refactoring

- **history:** adjusted history for new data, types and components ([38b2aab](https://github.com/ts-factory/bublik-ui/commit/38b2aab81aa23c90798f8cb3536fad0392a22e81))
- **history:** changed to new log preview for stacked charts ([a3d00d3](https://github.com/ts-factory/bublik-ui/commit/a3d00d3204c766610a272b7d10ae2fb6b1abd55e))
- **history:** swap for new preview drawer modal ([6e40b79](https://github.com/ts-factory/bublik-ui/commit/6e40b79522bc1d40445488b21e66ffa87a955fbc))
- **history:** use new stacked chart for history stacked mode ([1734d69](https://github.com/ts-factory/bublik-ui/commit/1734d698e896eb3c18944f5eb0e04df309850a77))
- **log:** extracted log preview component to separate lib ([89007fb](https://github.com/ts-factory/bublik-ui/commit/89007fb3b78dccdd0cdf2b00b592e87c1c266e12))
- **measurements:** adjusted export logic for new types and data ([ea2e5a4](https://github.com/ts-factory/bublik-ui/commit/ea2e5a42b270b732882eec444072a89a913ade60))
- **measurements:** adjusted getting chart name ([9d94e70](https://github.com/ts-factory/bublik-ui/commit/9d94e70a9ae371bba8f569b9b6bd0963be209f6e))
- **measurements:** adjusted measurement charts for new types and data ([4687d47](https://github.com/ts-factory/bublik-ui/commit/4687d47b57d00e657fd677e2b2de0ed5633f9832))
- **measurements:** adjusted measurements page for new data and types ([20bc843](https://github.com/ts-factory/bublik-ui/commit/20bc843a2d8672283ec02418e81f804b418da104))
- **measurements:** adjusted table for new data and types ([245e370](https://github.com/ts-factory/bublik-ui/commit/245e37033f11658a65e2959452a8305c850d1d36))
- **measurements:** use new stacked chart component for overlay mode ([343abce](https://github.com/ts-factory/bublik-ui/commit/343abce62608a3cf0f707920de34881edbea7148))
- **report:** [chart] allow zoom only when metaKey is pressed ([d3e7fe0](https://github.com/ts-factory/bublik-ui/commit/d3e7fe0b24662b41cf906d53f9a0362c9c907cc8))
- **report:** [chart] updated chart for API changes ([b427854](https://github.com/ts-factory/bublik-ui/commit/b427854469a28ed2d4cb5f5fa9ae7e7628a89207))
- **report:** [table] allow scroll only when ctrl or meta key is pressed ([0451a1f](https://github.com/ts-factory/bublik-ui/commit/0451a1f566d802ea3c7eb98ba2a939f9611539aa))
- **report:** adjusted logic for determining labels ([0193a07](https://github.com/ts-factory/bublik-ui/commit/0193a07051372b4b467c55820c2257cd4a89f36e))
- **report:** adjusted props to chart and table ([ba47278](https://github.com/ts-factory/bublik-ui/commit/ba47278b888932ca5da501280d2a00304a40e33b))
- **report:** changed location of warnings hover cards ([154d577](https://github.com/ts-factory/bublik-ui/commit/154d577cfeadd4f93ab41dce14e600cbac3b113d))
- **report:** use shared drawer dialog for log preview ([03f4d05](https://github.com/ts-factory/bublik-ui/commit/03f4d05b8babca7555bd8e881323548092e9396b))

### 📦 Chores

- **history:** removed old plot point dialog ([5613e2f](https://github.com/ts-factory/bublik-ui/commit/5613e2faf081e68a8770a2ecfb1357830bdcd359))
- **measurements,history:** remove old dead code and types ([fc20033](https://github.com/ts-factory/bublik-ui/commit/fc200338d2cf08c8c2426642bb775d18c7d8b939))
- **report:** adjusted report types for new API changes ([b58ed3b](https://github.com/ts-factory/bublik-ui/commit/b58ed3b18d9ce93132cb4b12713afba67a095e34))
- **report:** changed labels for list of arguments ([69ababb](https://github.com/ts-factory/bublik-ui/commit/69ababb263794ab628cb4fd56f10b11d88f13186))
- **report:** display spinner when loading report ([2833e2e](https://github.com/ts-factory/bublik-ui/commit/2833e2e405a47b3f0cc6ed0c30458307f11a2247))
- **report:** removed old point dialog drawer component ([c27c225](https://github.com/ts-factory/bublik-ui/commit/c27c22583811e95d02c4002696b83f10ad816aea))

### [0.7.1](https://github.com/ts-factory/bublik-ui/compare/v0.7.0...v0.7.1) (2024-11-15)

### 🐛 Bug Fix

- **log:** fixed log not scrolling to top on page change ([771d617](https://github.com/ts-factory/bublik-ui/commit/771d6179b7fb9dbecd6a9d0318f17e12dbd4fa45))

## [0.7.0](https://github.com/ts-factory/bublik-ui/compare/v0.6.2...v0.7.0) (2024-11-14)

### 🚀 New Feature

- **report:** added link from report to log page ([d2c63cb](https://github.com/ts-factory/bublik-ui/commit/d2c63cba37d7310f8c1fbaaab458c2115d3fb0b2)), closes [#214](https://github.com/ts-factory/bublik-ui/issues/214)
- **report:** added run details to report ([70b0b25](https://github.com/ts-factory/bublik-ui/commit/70b0b25c4fefacf644fc112ce00ac84d7295ef88))
- **run:** [results] added artifacts and requirements to results ([a00d9bc](https://github.com/ts-factory/bublik-ui/commit/a00d9bc72e5ec5d5aaa0efb51d521c687157311b))
- **run:** added endpoint to get verdicts and artifacts for iteration ([551352d](https://github.com/ts-factory/bublik-ui/commit/551352d79050a3c1b74d7278a628181325f392c2))

### 💅 Polish

- **log:** [details] removed minimum height for details block ([e0c4fd9](https://github.com/ts-factory/bublik-ui/commit/e0c4fd931800bce66dd06de51331727bbeadee35))
- **run:** [details] removed minimum height for details block ([3d76aac](https://github.com/ts-factory/bublik-ui/commit/3d76aac5542de1072b0921a9115bf4adfc662165))

### 🐛 Bug Fix

- **config:** [update] added handling for error when config with same name exists ([00296f8](https://github.com/ts-factory/bublik-ui/commit/00296f89120e70c543cc160c7991b05b503ee9f5))
- **log:** added scroll to top on page change ([9b479e8](https://github.com/ts-factory/bublik-ui/commit/9b479e835893f551fda5ea1f1fa39e99caa580a3))
- **run, log:** disable source link on URL retrieval failure ([ed3c420](https://github.com/ts-factory/bublik-ui/commit/ed3c420619c4dcb77ddf53d9edf8cc0cc128d1a8)), closes [#216](https://github.com/ts-factory/bublik-ui/issues/216)
- **run:** [results] added handling for results in progress ([932773a](https://github.com/ts-factory/bublik-ui/commit/932773aafe80b2ce9a9a18f507f12a9b1770b785))

### ♻ Code Refactoring

- **config:** added name field to update config form ([5148e56](https://github.com/ts-factory/bublik-ui/commit/5148e5677be5c80d4bce5d3072e27553adeed8f4))
- **config:** adjusted logic for activating/deactivating config ([673dc0c](https://github.com/ts-factory/bublik-ui/commit/673dc0c7a64c9e8eb464fea1aaacf3a63471bc5d))
- **config:** adjusted types to allow renaming configs ([b26fd97](https://github.com/ts-factory/bublik-ui/commit/b26fd97456ae69eb5a6a4ac74e513cd9928967ae))
- **log:** [new-bug] try to get configuration from `special_categories` ([49875f9](https://github.com/ts-factory/bublik-ui/commit/49875f9eab060797269d29228c9ad97755153285))
- **log:** get artifacts and verdicts from API and merge them into log ([fc38cca](https://github.com/ts-factory/bublik-ui/commit/fc38ccaa9ee68d7be25ffeef815ea6c70954a9e6))
- **log:** made pagination look the same top and bottom ([67374a9](https://github.com/ts-factory/bublik-ui/commit/67374a9b0c81d6a1d1023de824152793d86d354b))
- **report:** added report description frame with config and warnings ([4421048](https://github.com/ts-factory/bublik-ui/commit/442104867afc7f5af522b4c80b7f3e33bfd9df29))

### 🔧 Continuous Integration | CI

- **build:** added check to ensure code is buildable ([86166a5](https://github.com/ts-factory/bublik-ui/commit/86166a52b25a8fd76eab83f0e7b1f1326a3aa9b6))

### 📦 Chores

- **config:** adjusted alert dialog description for activation of the config ([9b69d74](https://github.com/ts-factory/bublik-ui/commit/9b69d74ecd05529cc3458fe8ee585f95e2a05c2f))
- **config:** removed redundant endpoint ([b810389](https://github.com/ts-factory/bublik-ui/commit/b810389f258d431abc2f8274ade5bc045da9206d))
- **log:** removed redundant prop ([6bd37aa](https://github.com/ts-factory/bublik-ui/commit/6bd37aacb340a6c87c5f2d6ec23837119d354957))
- **log:** removed redundant type ([48d17a5](https://github.com/ts-factory/bublik-ui/commit/48d17a53c41140881bb593616a7755736bf8b970))
- **log:** simplified logic for redirect to legacy ([e390fe7](https://github.com/ts-factory/bublik-ui/commit/e390fe72920a267a2dd4af132c7a79a4f93752ec))
- **run:** [results] renamed badly named variables ([724a688](https://github.com/ts-factory/bublik-ui/commit/724a6884044cc8f2599370dbcf8d9d3651176b53))

### [0.6.2](https://github.com/ts-factory/bublik-ui/compare/v0.6.1...v0.6.2) (2024-10-31)

### 🚀 New Feature

- **log:** [new-bug] added artifacts to new bug ([5f34ed0](https://github.com/ts-factory/bublik-ui/commit/5f34ed0eecedce8ced72d83b49111ac07f8c9fbb))
- **run:** added persistence for column visibility state ([dae4b1b](https://github.com/ts-factory/bublik-ui/commit/dae4b1b533c474d87835016343241d77e7c98288))

### 🐛 Bug Fix

- **history:** fixed filters incorrect reset when global filter has no values ([e585e4d](https://github.com/ts-factory/bublik-ui/commit/e585e4d7d6753b76aff98f16e4807c1f8de8c654))

### 📦 Chores

- **history:** renamed global search button labels ([54a6346](https://github.com/ts-factory/bublik-ui/commit/54a63464094e1569d5135136d8d63cfd0ff85465))

## [0.6.0](https://github.com/ts-factory/bublik-ui/compare/v0.5.1...v0.6.0) (2024-10-30)

### 🚀 New Feature

- **log,run:** added new bug button to log preview ([f2a37ca](https://github.com/ts-factory/bublik-ui/commit/f2a37cae13f1848f95bdd9030e79142379a169ea))
- **log:** added link to reports from log page ([5227387](https://github.com/ts-factory/bublik-ui/commit/52273874e2ed12d04d71848e78fea280a053a1cb)), closes [#185](https://github.com/ts-factory/bublik-ui/issues/185)
- **run:** [multiple] added endpoint for merging multiple runs ([73902e5](https://github.com/ts-factory/bublik-ui/commit/73902e58e613f6affb409e3a52b7e56991cbb04b))
- **run:** [result-table] added prop to show link to result run ([7950f3c](https://github.com/ts-factory/bublik-ui/commit/7950f3cc748d9b241010ceb242e88871767563f8))
- **run:** added initial multiple runs page ([91bee3d](https://github.com/ts-factory/bublik-ui/commit/91bee3d88d06e139c3eadb966de35d09c0365bdf))
- **run:** added link to multiple run page from runs selection popover ([de98aea](https://github.com/ts-factory/bublik-ui/commit/de98aeaa64cfae42fea6c728913a4e172005ab16))
- **run:** added link to multiple runs in sidebar ([70c983e](https://github.com/ts-factory/bublik-ui/commit/70c983e558a36267093490078a55e41bb2c37103))

### 💅 Polish

- **log:** [new-bug] made new bug appear as drawer content from right ([10b034f](https://github.com/ts-factory/bublik-ui/commit/10b034f44679a1e23be01f6394be9637cd382915))
- **run:** [details] removed unnecessary padding from list label ([94a7017](https://github.com/ts-factory/bublik-ui/commit/94a70173683f052f13b74b764555d79105059e6f))
- **run:** [log] show log preview as drawer from right side ([15cee82](https://github.com/ts-factory/bublik-ui/commit/15cee823ecf3ec497a13710a202280cb7b24d7d5))

### 🐛 Bug Fix

- **log:** [new-bug] added test path for generated `CMD` ([bf03de0](https://github.com/ts-factory/bublik-ui/commit/bf03de0118d2b6d674a496aa64c0eee27cff6719)), closes [#173](https://github.com/ts-factory/bublik-ui/issues/173)
- **run:** fixed run compromise status invalidation for runs/dashboard pages ([64d0a71](https://github.com/ts-factory/bublik-ui/commit/64d0a71fb7789a0852dec32968a53521bd0a8633))
- **runs:** [charts] fixed clicking on bar plot not redirecting to run ([6969fc3](https://github.com/ts-factory/bublik-ui/commit/6969fc3a350e555c2b2fb2efe73cf06b606cd02c))

### ♻ Code Refactoring

- **log:** [new-bug] added function to get new bug props to remove boilerplate ([be5a89f](https://github.com/ts-factory/bublik-ui/commit/be5a89fcf4d192247ec7c2d308e78f5ed7be063d))
- **log:** [new-bug] simplified log-feature component logic ([1763d4f](https://github.com/ts-factory/bublik-ui/commit/1763d4f75d819dfe065d4ca06fd224b1d202e16f))
- **run:** [result-table] added support for merged results ([b358be9](https://github.com/ts-factory/bublik-ui/commit/b358be99fe7f02da78be2ec84e75e1260cb5cae5))
- **run:** added support for merged runs in run table ([36f7389](https://github.com/ts-factory/bublik-ui/commit/36f7389166731820bded8f8b7b53c2bee3b455db))
- **run:** adjusted run tab title generation for multiple runs ([d12c8c1](https://github.com/ts-factory/bublik-ui/commit/d12c8c1f45aa2db2f40674ccf358081f574fef68))
- **run:** sort results by iteration id ([d9fc3d1](https://github.com/ts-factory/bublik-ui/commit/d9fc3d16db2923908b9700c788cdc84c00698bd5))

### 📦 Chores

- **log:** [new-bug] fixed typo for successful copy message ([30bbc34](https://github.com/ts-factory/bublik-ui/commit/30bbc3421a4b838020581247fd6cd087f43783f5))
- **report:** fixed formatting ([6271f19](https://github.com/ts-factory/bublik-ui/commit/6271f19ac205e6579551a2e72ecc79f507f7ebfc))

### [0.5.1](https://github.com/ts-factory/bublik-ui/compare/v0.5.0...v0.5.1) (2024-10-18)

### 🚀 New Feature

- **report:** added axis labels display at the bottom of chart ([bb65ae3](https://github.com/ts-factory/bublik-ui/commit/bb65ae33bea3b90c1502fb435350f165e50b3d99))

### ♻ Code Refactoring

- **configs:** added handling for errors in create config form ([9890f83](https://github.com/ts-factory/bublik-ui/commit/9890f8381796264794f940edee540df8148e584a))

### 📦 Chores

- **report:** removed unnecessary import ([f3ae71b](https://github.com/ts-factory/bublik-ui/commit/f3ae71bcf534361937cca06a596bde81483f11b3))

## [0.5.0](https://github.com/ts-factory/bublik-ui/compare/v0.4.3...v0.5.0) (2024-10-16)

### 🚀 New Feature

- **configs:** [editor] added setting to change font size ([53ef50e](https://github.com/ts-factory/bublik-ui/commit/53ef50e029270879fc73d9010998d17b51e0af06)), closes [#145](https://github.com/ts-factory/bublik-ui/issues/145)
- **configs:** added shortcut to trigger autocomplete in editor `ctrl+\` ([e5f6078](https://github.com/ts-factory/bublik-ui/commit/e5f6078a60f0b6ee38e1e36bd7da3a634e058ade)), closes [#144](https://github.com/ts-factory/bublik-ui/issues/144)
- **report:** added button to copy link for currently open report ([83f5c63](https://github.com/ts-factory/bublik-ui/commit/83f5c6337f21a48d515c57959d926205b7c45c8a)), closes [#152](https://github.com/ts-factory/bublik-ui/issues/152)
- **report:** added link to config used for generation current report ([3f606cc](https://github.com/ts-factory/bublik-ui/commit/3f606cc063c7305fdb9648542781d3e407c86cb3)), closes [#151](https://github.com/ts-factory/bublik-ui/issues/151)
- **report:** added sticky-stacked headers for all levels ([f0ce3af](https://github.com/ts-factory/bublik-ui/commit/f0ce3af9ac834a547591ddcdaeec76eed27145be)), closes [#147](https://github.com/ts-factory/bublik-ui/issues/147)

### 💅 Polish

- **history:** [plots] moved links for plot point to modal header ([38d8221](https://github.com/ts-factory/bublik-ui/commit/38d822197ba8cc2c0bc751214680f14a0de9c9e2))
- **log:** fixed button for log filters being shown on top of the new bug modal ([8fd958b](https://github.com/ts-factory/bublik-ui/commit/8fd958bd10515163c8eb9d2c6acb76d05b0a74ed))
- **report:** fixed missing border in case `multiple_sequences` is `false` ([46d2b14](https://github.com/ts-factory/bublik-ui/commit/46d2b14bb6934787cf16913bd7af56fe42f9559a))

### 🐛 Bug Fix

- **configs:** added modal to show "navigate to existing config" if it exists ([4639f21](https://github.com/ts-factory/bublik-ui/commit/4639f2127d6963406cb54d134c626b5c43bd3ad4))
- **configs:** allowed partial updates for config ([7b8150d](https://github.com/ts-factory/bublik-ui/commit/7b8150d76f9724b8191a76e99487eb27ba42dd9e))
- **log,run:** fixed parameters incorrectly cutting off "=" ([b6d2032](https://github.com/ts-factory/bublik-ui/commit/b6d2032255ae3c8918f93891d0d055a95d674583)), closes [#137](https://github.com/ts-factory/bublik-ui/issues/137)

### ♻ Code Refactoring

- **build:** adjusted release config to sort sections ([9d1affc](https://github.com/ts-factory/bublik-ui/commit/9d1affc83e4e5ba6374c227db3da7c50bf62f6bc)), closes [#138](https://github.com/ts-factory/bublik-ui/issues/138)
- **configs:** extracted all components to improve readability ([df9cbc3](https://github.com/ts-factory/bublik-ui/commit/df9cbc3c7b92d04d5c37d69dffdcfaac2555d220))

### 📦 Chores

- **sidebar:** moved history and measurements links to the bottom ([b480074](https://github.com/ts-factory/bublik-ui/commit/b48007433f5679d642eab3884abb47d3d4f3315d)), closes [#139](https://github.com/ts-factory/bublik-ui/issues/139)

### [0.4.2](https://github.com/ts-factory/bublik-ui/compare/v0.4.1...v0.4.2) (2024-10-09)

### 🚀 New Feature

- **configs:** handle initial global config migration ([8e29d66](https://github.com/ts-factory/bublik-ui/commit/8e29d66be462340304565fa252710038481bcd8b))

## [1.0.0](https://github.com/ts-factory/bublik-ui/compare/v0.3.9...v1.0.0) (2024-10-04)

### 🚀 New Feature

- **configs:** added API endpoints for config management ([1aa6673](https://github.com/ts-factory/bublik-ui/commit/1aa6673326283f6dfebd28d11fecf29364829db8)), closes [#141](https://github.com/ts-factory/bublik-ui/issues/141)
- **configs:** added config management page ([613ce46](https://github.com/ts-factory/bublik-ui/commit/613ce4638dd1a096a8266881f801dab56218ed9e)), closes [#141](https://github.com/ts-factory/bublik-ui/issues/141)
- **report:** added table of contents to report ([7667a0e](https://github.com/ts-factory/bublik-ui/commit/7667a0ec0066fc300b48aae20b4041199f4a5667)), closes [#143](https://github.com/ts-factory/bublik-ui/issues/143)

### 💅 Polish

- **report:** fixed double borders for report labels ([d4fd924](https://github.com/ts-factory/bublik-ui/commit/d4fd924860e87fd7d946de0d4185abc2b8d3be5d))
- **ui:** [alert-dialog] improve readability for dialog ([ce9f12f](https://github.com/ts-factory/bublik-ui/commit/ce9f12f0e70271a45e7e5810025a8d8560a1c20e)), closes [#141](https://github.com/ts-factory/bublik-ui/issues/141)

### 🐛 Bug Fix

- **build:** correct proxying to derive API path from URL_PREFIX ([1f62c82](https://github.com/ts-factory/bublik-ui/commit/1f62c82bf36ca1d058b63b940782da39ae2b5759))
- **build:** skip package scripts to optimize dev build ([0f12745](https://github.com/ts-factory/bublik-ui/commit/0f1274563c1742f27f3e870e5c251b9fd5e92a71))
- **report:** fixed incorrect scrolling on mount ([f4b284b](https://github.com/ts-factory/bublik-ui/commit/f4b284b25300e5fb9cfd896efe2cea9b9774b2b3)), closes [#143](https://github.com/ts-factory/bublik-ui/issues/143)

### 📦 Chores

- added react-monaco-editor dependency ([b5e858a](https://github.com/ts-factory/bublik-ui/commit/b5e858a7e462b1ad75c51825f06549d914c02321)), closes [#141](https://github.com/ts-factory/bublik-ui/issues/141)
- **report:** updated components for new type changes ([f05977c](https://github.com/ts-factory/bublik-ui/commit/f05977c327ebd97801310f581dd9ac43785d875f)), closes [#143](https://github.com/ts-factory/bublik-ui/issues/143)
- **types:** updated report types to API changes ([34ed7e9](https://github.com/ts-factory/bublik-ui/commit/34ed7e99defa4e7472e6f6fa2732dc828c33f45b)), closes [#143](https://github.com/ts-factory/bublik-ui/issues/143)

### ♻ Code Refactoring

- **run:** [reports] adjusted types and components for config changes ([b3eb33a](https://github.com/ts-factory/bublik-ui/commit/b3eb33a4f87f238c0aa79016b3b4b951f85e4c85)), closes [#141](https://github.com/ts-factory/bublik-ui/issues/141)
- **ui:** [card-header] allow passing react node as label ([5aac339](https://github.com/ts-factory/bublik-ui/commit/5aac3390e0b519189b7bf2757721979730892f58))

### [0.3.9](https://github.com/ts-factory/bublik-ui/compare/v0.3.8...v0.3.9) (2024-09-24)

### 📦 Chores

- **runs:** [table] removed unnecessary import ([c3dc7ca](https://github.com/ts-factory/bublik-ui/commit/c3dc7ca92d142458fb8f29635aea5d8733675595))

### 🐛 Bug Fix

- **run:** [table] display sorting ui only for sortable columns ([97827d0](https://github.com/ts-factory/bublik-ui/commit/97827d09cd4e1c6ad6f004ed97b8c028d0d36aa2))

### 🚀 New Feature

- **run:** [table] added UI for creating/editing test notes ([6e3b470](https://github.com/ts-factory/bublik-ui/commit/6e3b470711d9a4955e791b59c098b83f7a327ff5))
- **run:** added endpoints to handle note CRUD for test ([6e34438](https://github.com/ts-factory/bublik-ui/commit/6e34438bd09e0ce4f9eb0fe0b2e6789fabdf6f9e))
- **ui:** [button] added variant for destruction-secondary styles ([8c75174](https://github.com/ts-factory/bublik-ui/commit/8c7517476ddba8fb011c2cb2dffab2244b562561))
- **ui:** added file plus icon ([1e5eae0](https://github.com/ts-factory/bublik-ui/commit/1e5eae03ef81b028db446971eaac43dab8c2a973))

### 💅 Polish

- **run:** [table] added borders for `Notes` and `Objective` columns ([f5d94ee](https://github.com/ts-factory/bublik-ui/commit/f5d94ee075784bf55eb3a506573935c6321de29b))
- **run:** [table] fixed number alignment for "0" ([23023e6](https://github.com/ts-factory/bublik-ui/commit/23023e640533952a85ec703df8a670f3cdd848ca)), closes [#130](https://github.com/ts-factory/bublik-ui/issues/130)
- **run:** [table] lower opacity to indicate pending state ([dfa74f9](https://github.com/ts-factory/bublik-ui/commit/dfa74f923d9bfc41af8bc5308c6607de93db2a2e))
- **ui:** [alert] added dialog overlay by default to alert dialog ([e7e860e](https://github.com/ts-factory/bublik-ui/commit/e7e860e6a3ec6399c25d235225aad563fd84050e))

### [0.3.8](https://github.com/ts-factory/bublik-ui/compare/v0.3.7...v0.3.8) (2024-09-10)

### 💅 Polish

- **log,run:** [new-bug] wrapped path to test with backticks ([0f3ca9e](https://github.com/ts-factory/bublik-ui/commit/0f3ca9efe17ec9077d6be7610b46b4f380b92369))

### 🚀 New Feature

- **log,run:** [new-bug] added ability to display cells as code block ([94e7b59](https://github.com/ts-factory/bublik-ui/commit/94e7b59b48a6322195ccda521c23762f531baafe))

### 🐛 Bug Fix

- **run,log:** [new-bug] fixed env breaking markdown table ([7f9acee](https://github.com/ts-factory/bublik-ui/commit/7f9acee3fcef6e5bbee4e7642a24b7a8c146e270))

### [0.3.7](https://github.com/ts-factory/bublik-ui/compare/v0.3.6...v0.3.7) (2024-09-09)

### 🐛 Bug Fix

- **run,log:** fix text overflow in new bug preview modal ([bb556e4](https://github.com/ts-factory/bublik-ui/commit/bb556e4284dad76f006a631dd64195d1eeb18b47))

### 🚀 New Feature

- **log:** added new field to markdown from te-log-meta ([cb3692f](https://github.com/ts-factory/bublik-ui/commit/cb3692f3c72f148540623f9bc176c0d9dc28fa14))

### [0.3.6](https://github.com/ts-factory/bublik-ui/compare/v0.3.5...v0.3.6) (2024-09-09)

### ♻ Code Refactoring

- **run:** added labels to toggle button for full/short run details ([9431427](https://github.com/ts-factory/bublik-ui/commit/9431427e972aa5e87be7beb7c6e8246e3c96948e))
- **run:** disabled uppercase all headers by default ([0b87b4e](https://github.com/ts-factory/bublik-ui/commit/0b87b4e351c163cf1b1cfd43db30441524e68887))

### 🚀 New Feature

- **log:** added full path to test in new bug modal ([60bbe17](https://github.com/ts-factory/bublik-ui/commit/60bbe171e3580825b1e070e1beceaf9c984ef9b0))
- **log:** added new bug button for log page ([458f871](https://github.com/ts-factory/bublik-ui/commit/458f871a2e4adedc6164b06fb799e0992a298884))
- **run:** added new bug button to run page ([875f366](https://github.com/ts-factory/bublik-ui/commit/875f366ace180e19b33b0dded633a5f98315f88b))
- **run:** added objective column to run table ([7814984](https://github.com/ts-factory/bublik-ui/commit/7814984329c9557234f646cc298bbd9ced4ff58f))
- **ui:** added issue icon to library ([00ee4a5](https://github.com/ts-factory/bublik-ui/commit/00ee4a5bf2d25390af71d67c5276c8518251c55d))
- **ui:** added new bug component ([1175af4](https://github.com/ts-factory/bublik-ui/commit/1175af4a403d5af8708a70cc6921e70fe8bc6a87))

### 🐛 Bug Fix

- **log:** removed redundant query param from bug link ([8bbcd58](https://github.com/ts-factory/bublik-ui/commit/8bbcd58e7bd2d8ab0daa5753a31eab3acf2ec0ab))
- **run:** remove redundant rowState query param ([69ae6cf](https://github.com/ts-factory/bublik-ui/commit/69ae6cfca2bbb319304ebb47c513c4f818711785))

### [0.3.5](https://github.com/ts-factory/bublik-ui/compare/v0.3.2...v0.3.5) (2024-08-17)

### 🚀 New Feature

- **report:** added common args for not processed points table ([720da5f](https://github.com/ts-factory/bublik-ui/commit/720da5fe217372c117fff70ca8629c2d2b7a8e48))
- **report:** added data zoom to report plots ([8999ee3](https://github.com/ts-factory/bublik-ui/commit/8999ee375b6d1b33f57dc8a01c1d10b1c3d7ce2f))

### ♻ Code Refactoring

- **run,log:** omit conclusion reason from run details in short mode ([fd2817d](https://github.com/ts-factory/bublik-ui/commit/fd2817d603b01c81a24f14aa08e8515dc9c91559))

### 📦 Chores

- **run,log:** renamed label from "Reason" to "Conclusion Reason" ([b106bb3](https://github.com/ts-factory/bublik-ui/commit/b106bb3009db56e54db40ee7ef80c35b0950c901))
- **storybook:** remove all mocked modules ([2f4ab3d](https://github.com/ts-factory/bublik-ui/commit/2f4ab3d3fa78532488ca10224d5a7bbb9c580c09))

### 💅 Polish

- **run,log:** [details] fixed column alignment between term and description ([8a4780c](https://github.com/ts-factory/bublik-ui/commit/8a4780c93c675a07cc22142edf2bee814f8e310c))

## [0.3.4](https://github.com/ts-factory/bublik-ui/compare/v0.3.2...v0.3.4) (2024-08-16)

### 🐛 Bug Fix

- **report:** ensure all test blocks are displayed in the report ([658540b](https://github.com/ts-factory/bublik-ui/commit/658540b28cd65d25c7cfa90d5003831905ec467e))

### [0.3.3](https://github.com/ts-factory/bublik-ui/compare/v0.3.2...v0.3.3) (2024-08-13)

### 🔧 Continuous Integration | CI

- added formatting check ([c84a564](https://github.com/ts-factory/bublik-ui/commit/c84a564c2fadcc5748fa168d029b178fbaf5dd1c))
- run formatter on code base ([4da8c4b](https://github.com/ts-factory/bublik-ui/commit/4da8c4b96944aab2d466929968818435dc9ca38f))
- splitted `test` and `lint` steps into different jobs ([8de0f52](https://github.com/ts-factory/bublik-ui/commit/8de0f52a62cd757caac831ff8b87048464f610c6))
- swapped to prettier for formatting checks ([8170886](https://github.com/ts-factory/bublik-ui/commit/81708860b7c363f3cbca1640318f351c0bc77c15))

### 📦 Chores

- added vscode dir to gitignore ([6fe10f3](https://github.com/ts-factory/bublik-ui/commit/6fe10f31644c3956eb17dcc8a51558110c6343f0))
- **deps:** upgrade nx to latest version ([bdaa929](https://github.com/ts-factory/bublik-ui/commit/bdaa929350be5dc2acdb04aa807554c28937f0d2))
- **log,run:** changed option to show full run details by default ([f5257f0](https://github.com/ts-factory/bublik-ui/commit/f5257f0a2d73fd791076ce5cd4c15d75aaabe666))
- **storybook:** remove all mocked modules ([2f4ab3d](https://github.com/ts-factory/bublik-ui/commit/2f4ab3d3fa78532488ca10224d5a7bbb9c580c09))

### 💅 Polish

- **report:** made table columns take even width ([8981192](https://github.com/ts-factory/bublik-ui/commit/8981192c72e0b8f7ddbf17dcf6f43d4b75245ec9))
- **ui:** [hover-card] added align prop ([95cf988](https://github.com/ts-factory/bublik-ui/commit/95cf9881306dfc90109bd2b31aa3f1bb54082539))

### 🐛 Bug Fix

- **report:** fixed broken link to report section ([31f3004](https://github.com/ts-factory/bublik-ui/commit/31f3004f07271251e3b78244aedb8411b4817798))
- **report:** fixed not showing error if no config id or run id present ([810ea12](https://github.com/ts-factory/bublik-ui/commit/810ea12d8c160dd671277595c56850cf8eeb2035))
- **storybook:** fixed wrong location for vite config ([81d7cf2](https://github.com/ts-factory/bublik-ui/commit/81d7cf2da5aa9fbe159c674c15dcff39a9d8e0cd))
- **ui:** fixed typescript issues in tailwind-ui ([9d22183](https://github.com/ts-factory/bublik-ui/commit/9d221838ca11c85f08e58511bd5857fab2bd1364))

### ♻ Code Refactoring

- **report:** added not processed points table ([b6c8025](https://github.com/ts-factory/bublik-ui/commit/b6c80250f37195fc6da044cf5d19bc9a70181d34))
- **report:** upgraded to latest changes ([113c4b6](https://github.com/ts-factory/bublik-ui/commit/113c4b6a50ff2b500a3ec33d0519c4465322504e))
- **run:** extracted conclusion badge to shared UI lib ([fa583d8](https://github.com/ts-factory/bublik-ui/commit/fa583d8ead7d9b00fa9552e8def819b667695174))

### 🚀 New Feature

- **dashboard:** added conclusion reason hover card to dashboard ([390685b](https://github.com/ts-factory/bublik-ui/commit/390685b7e623db855ed54dde78a0a7849c0dadf7))
- **report:** added report data zoom to plot ([716a7ac](https://github.com/ts-factory/bublik-ui/commit/716a7ac7487f00dc4eb2f7b25493181414a9ab4b))
- **run:** added conclusion reason hover card to run details ([d7a6288](https://github.com/ts-factory/bublik-ui/commit/d7a628818f7ae6e0387618b8fc4d3a279679a879))
- **run:** added preview log modal ([5c4056c](https://github.com/ts-factory/bublik-ui/commit/5c4056c3e8565000d4c3d1f7fd308ed8a0c51d6a))
- **runs:** added conclusion reason hover card to runs page ([b3215c9](https://github.com/ts-factory/bublik-ui/commit/b3215c91692a0eab9182b42c1132f1838297c37a))
- **ui:** added conclusion hover card component to ui lib ([1183ee4](https://github.com/ts-factory/bublik-ui/commit/1183ee4427e8c5b20a15dfb9806fea82cf1caea8))

## [0.43.0](https://github.com/ts-factory/bublik-ui/compare/v0.3.1...v0.43.0) (2024-07-04)

### 📦 Chores

- **build:** upgraded pnpm setup action to latest version ([290ad77](https://github.com/ts-factory/bublik-ui/commit/290ad7757b9f588412c24138a45fd2d38d695ae0))
- **run:** [details] changed order of buttons and links ([fe9b024](https://github.com/ts-factory/bublik-ui/commit/fe9b0244ccf323f1278fac908e7bbe11f0724553))

### 🚀 New Feature

- **log:** [mi] added display for aggregated values min/max ([f476678](https://github.com/ts-factory/bublik-ui/commit/f476678ca34370d6a39e2b84f099e84eb22fb138))

### 🐛 Bug Fix

- **log:** [mi] display only entries with `aggr` of "single" on chart ([e391d2a](https://github.com/ts-factory/bublik-ui/commit/e391d2aa6a78dfed7139e6d48783641eb8b6be84))
- **reports:** made datasets for chart/table optional ([ff7d724](https://github.com/ts-factory/bublik-ui/commit/ff7d724b37885c0f1fe00c2026c7dccf2f302027))
- **reports:** removed `%` for values that are "-" or "na" ([88e7416](https://github.com/ts-factory/bublik-ui/commit/88e74167b337f2518bab036c2a0882d5cb9a9318))

## [0.42.0](https://github.com/ts-factory/bublik-ui/compare/v0.3.0...v0.42.0) (2024-06-26)

### 🚀 New Feature

- **history:** added labels field to history global search form ([5fc9e7b](https://github.com/ts-factory/bublik-ui/commit/5fc9e7b0418843fefa78ae7c744d1fb341b8f441))
- **history:** added scroll to top of the page on page change ([634934f](https://github.com/ts-factory/bublik-ui/commit/634934fce95fc155a0955056f984fe15ba67945f))
- **reports:** added formatters support to show "%" sign ([5e55703](https://github.com/ts-factory/bublik-ui/commit/5e55703929e931e864c5ac0806770bf8c77cef3f))
- **reports:** added handling for API errors for report page ([323d7ba](https://github.com/ts-factory/bublik-ui/commit/323d7bafbdcde44a074132dbc27034b5dc356b70))
- **reports:** added table title from Y axis label ([c5d3498](https://github.com/ts-factory/bublik-ui/commit/c5d3498f51f1d5b2184eaef231af3bf27a71bed2))

### 🐛 Bug Fix

- **history:** fixed missing default values for history global search form ([f096099](https://github.com/ts-factory/bublik-ui/commit/f09609984044c74193441d909ef6334aff83b385))
- **history:** made field names consistent in search form ([6f569af](https://github.com/ts-factory/bublik-ui/commit/6f569afd25428e4640b2d13b37790fa131def6d6))
- **log:** added option to contain label inside canvas container ([5c07946](https://github.com/ts-factory/bublik-ui/commit/5c079461bb1a8c04168f19b7bab6009f96197ccc))
- **reports:** fixed axis label overflow inside canvas container ([79b5416](https://github.com/ts-factory/bublik-ui/commit/79b541646f429c2d14bfb7b62e3854a0180643bb))
- **reports:** fixed unstable key for report header list item ([a6ac058](https://github.com/ts-factory/bublik-ui/commit/a6ac058b7e85caf3f7704027a895b74c0a425289))
- **run:** fixed copying revision metadata without key ([eefdf45](https://github.com/ts-factory/bublik-ui/commit/eefdf45f9d8eeb2b206a1678048db72d835b5482))
- **runs:** [form] fixed crash when opening tags input ([90e3df6](https://github.com/ts-factory/bublik-ui/commit/90e3df62602eb510344649eb9e8f0f0bd0e101c9))
- **ui:** [combobox] fixed selection change callback type ([9d16f19](https://github.com/ts-factory/bublik-ui/commit/9d16f197c3078560c944739fef630646fd551773))

### 💅 Polish

- **command:** added background overlay to command menu ([08bf23e](https://github.com/ts-factory/bublik-ui/commit/08bf23e6b43d0c1c45d7cf2921c852eabd9b9767))
- **run:** [reports] added gap between exit icon and report label ([de2dd4d](https://github.com/ts-factory/bublik-ui/commit/de2dd4dd698e8864bc250a7ea0ec6ca60668ecf5))

## [0.41.0](https://github.com/okt-limonikas/bublik-ui/compare/v0.2.6...v0.41.0) (2024-06-06)

### 🐛 Bug Fix

- **reports:** added missing dependency to useMemo hook for args calculation ([b67f56b](https://github.com/okt-limonikas/bublik-ui/commit/b67f56bf8378c5556eaedce4553f0f40cb99e7bb))
- **reports:** added missing dependency to useMemo hook for chart series calculation ([38b7682](https://github.com/okt-limonikas/bublik-ui/commit/38b7682b700d5ad82430219adfce7858d0009b40))
- **reports:** added rel="noreferrer" to external links ([8670993](https://github.com/okt-limonikas/bublik-ui/commit/867099344a49554f29899729860d032969e20aa7))
- **reports:** fixed build issues with tests ([d965e1b](https://github.com/okt-limonikas/bublik-ui/commit/d965e1b6692939c2b92775659cbb208df7c4d425))
- **reports:** fixed scroll to element id containing only numbers ([960d826](https://github.com/okt-limonikas/bublik-ui/commit/960d826842271495710927543bf0d46f2c0b948c))
- **reports:** prevent conditional calling of API query hook ([976998b](https://github.com/okt-limonikas/bublik-ui/commit/976998be71777a01290482fd0ffd50aca09d1ce1))

### 💅 Polish

- **reports:** added underline on hover for revision link ([9dc8ab3](https://github.com/okt-limonikas/bublik-ui/commit/9dc8ab3ff464eeb72dc2675ed3cf8e8a0ce73b2a))
- **reports:** fixed styles for dropdown menu item ([89a7921](https://github.com/okt-limonikas/bublik-ui/commit/89a7921867a4be3710a06cbb4ee8f420d027257d))

### 📦 Chores

- **copy-short-url:** upgraded cmdk package to latest version ([196d26b](https://github.com/okt-limonikas/bublik-ui/commit/196d26bddd609e802705f20a5cf5ace1b676a598))
- **icons:** added upload icon to icon library ([9ea35bb](https://github.com/okt-limonikas/bublik-ui/commit/9ea35bb226ba1c4b7b5812342bea7a771e7521d6))
- **reports:** extracted run-report test block ([17ac977](https://github.com/okt-limonikas/bublik-ui/commit/17ac97789e9b34e738761faa2d8bd93687eb2fb3))
- **reports:** generated library for run report ([c8fdf56](https://github.com/okt-limonikas/bublik-ui/commit/c8fdf56646407d7d9a0e7ef16205754bc26795ff))

### 🚀 New Feature

- **copy-short-url:** added "copy short url" button to dashboard page ([5794f1b](https://github.com/okt-limonikas/bublik-ui/commit/5794f1bd990b99029ade8224ecdf6bdaf54f2be9))
- **copy-short-url:** added "copy short url" button to history page ([4f5aa78](https://github.com/okt-limonikas/bublik-ui/commit/4f5aa785eeb8d9268fba4757d2c80192fc2ea0c6))
- **copy-short-url:** added "copy short url" button to run page ([a661fed](https://github.com/okt-limonikas/bublik-ui/commit/a661fed0888727398fc44a304cdddd52f9baa501))
- **copy-short-url:** added "copy short url" to runs page ([6afdd3a](https://github.com/okt-limonikas/bublik-ui/commit/6afdd3a5bcf0896a00e0acab3b3be29438586f93))
- **copy-short-url:** added "copy-short-url" button to log page ([19b6ce1](https://github.com/okt-limonikas/bublik-ui/commit/19b6ce1316de6cf3c7aedcb3425602e4ab4af4bc))
- **copy-short-url:** added "copy-short-url" button to measurements page ([3aa5b5e](https://github.com/okt-limonikas/bublik-ui/commit/3aa5b5e7e89acbbb4ab90f8484da9ed1d11c521a))
- **copy-short-url:** added "copy-short-url" button to run page ([ba2ff97](https://github.com/okt-limonikas/bublik-ui/commit/ba2ff97a93a8961b02c36c9ef92d7f591a5f6105))
- **copy-short-url:** added button for copying short url to current page ([02af6f8](https://github.com/okt-limonikas/bublik-ui/commit/02af6f8ef0cacd95fef206a4cdba60f5106b08db))
- **copy-short-url:** added command component ([8c416c1](https://github.com/okt-limonikas/bublik-ui/commit/8c416c1e023585ec6c93d01c205b0489d4373caa))
- **copy-short-url:** added component for command to copy short url ([a5459d3](https://github.com/okt-limonikas/bublik-ui/commit/a5459d301a0b63059462b824633842e2043bde1a))
- **copy-short-url:** added endpoint for creating short url ([2fd89dd](https://github.com/okt-limonikas/bublik-ui/commit/2fd89ddf9f379861c29d4e15a45ceff101b1f923))
- **copy-short-url:** generated library for "copy short url button" ([04a0931](https://github.com/okt-limonikas/bublik-ui/commit/04a093141098c9f6c1cb856656aa81e699f5a3bd))
- **reports:** added dropdown for run configs links ([c5fb281](https://github.com/okt-limonikas/bublik-ui/commit/c5fb2811ffe8656714d499ef090df4ccd5e09fc6))
- **reports:** added initial report header ([dc1195c](https://github.com/okt-limonikas/bublik-ui/commit/dc1195c2471d0dbfc1c70d4fc07199d3187947eb))
- **reports:** added run report container component ([48591fc](https://github.com/okt-limonikas/bublik-ui/commit/48591fc4d874ddceb0bf614efa6c9de6e72d1ce4))
- **reports:** added sidebar link for run report ([bdc2f1c](https://github.com/okt-limonikas/bublik-ui/commit/bdc2f1c9aadd5892b65ea7c1ae614c341027bc68))
- **reports:** added table and chart components ([4e4d3a7](https://github.com/okt-limonikas/bublik-ui/commit/4e4d3a75d17c8c03f6b898265b65d4d4333fc42a))
- **reports:** added warnings popover ([46d983d](https://github.com/okt-limonikas/bublik-ui/commit/46d983dad714768c6f6676d1b4d1dba4c22c8dcd))
- **reports:** made revision links clickable ([41d50d8](https://github.com/okt-limonikas/bublik-ui/commit/41d50d8dbb44d47e1daf735d64ad0beedfe264e9))

## [0.40.0](https://github.com/ts-factory/bublik-ui/compare/v0.39.1...v0.40.0) (2024-04-29)

### 📦 Chores

- fix run library test config ([4f3df15](https://github.com/ts-factory/bublik-ui/commit/4f3df15d2c95896a609e6c0bc4d79aefc77d335e))

### 💅 Polish

- **log:** [chart] add constraints for min/max values ([88b5262](https://github.com/ts-factory/bublik-ui/commit/88b52621ab4324d1313dc3ee1f5d5d67e98fb98c))

### 🐛 Bug Fix

- **charts:** correct tooltip message for zoom button ([aeaa1ea](https://github.com/ts-factory/bublik-ui/commit/aeaa1ea162e43c6a037dca948f9a9522b65a26e3))
- **run:** result parameters diff crashing on some results ([d196c74](https://github.com/ts-factory/bublik-ui/commit/d196c74f093fa8dbe8c6adbce99de907bac9b34b))

### 👷‍ Build System

- enable sourcemaps ([976756c](https://github.com/ts-factory/bublik-ui/commit/976756ce1bda98d6d5c2549a5c7f724c5534d268))

### 🚀 New Feature

- **log:** scroll to top of log on test click ([e6cfda2](https://github.com/ts-factory/bublik-ui/commit/e6cfda2d8f940f52452630fd7fb270ee7de97c42))
- **measurements:** add stacked chart mode ([5ad0f20](https://github.com/ts-factory/bublik-ui/commit/5ad0f20e614435ac30c19ae1542e1bc2bee1c7d4))

### [0.39.1](https://github.com/ts-factory/bublik-ui/compare/v0.2.3...v0.39.1) (2024-04-08)

### 💅 Polish

- **log:** fix horizontal page overflow ([803c05c](https://github.com/ts-factory/bublik-ui/commit/803c05c27c99c1e88d34ef28d0048e9e26deea3e))

### ♻ Code Refactoring

- **history:** adapt search params to api changes ([91ae184](https://github.com/ts-factory/bublik-ui/commit/91ae184af0c0916cc074795f4c28b2c4379ef1a0))

### 📦 Chores

- **log:** change default log mode to experimental ([d851f04](https://github.com/ts-factory/bublik-ui/commit/d851f0412fc47c38455c103d709b7ba7f5592f0c))

### 🐛 Bug Fix

- **auth:** prevent app crash caused by toast messages ([ce1211f](https://github.com/ts-factory/bublik-ui/commit/ce1211ff30bffadfc4d246d0bb012a6714c51d2e))
- **history:** [checkbox] prevent double select ([ab1d2ed](https://github.com/ts-factory/bublik-ui/commit/ab1d2ed3e5818a7fab759efe5aae4780ed22b148))
- **history:** [form] missing default values ([ed7a34a](https://github.com/ts-factory/bublik-ui/commit/ed7a34ae00d474530a0ca1172de7a51f71437fd8))
- **history:** not display dates in legend ([41a2a5a](https://github.com/ts-factory/bublik-ui/commit/41a2a5a156ecd3eefe1c385060635478cf74ad8a))
- **history:** skipping fetching data on direct navigation ([bc721e1](https://github.com/ts-factory/bublik-ui/commit/bc721e1994a1fa34289051633616f00ba9462979))
- **log:** scroll to saved line ([41cf356](https://github.com/ts-factory/bublik-ui/commit/41cf3567a58cf15dd654fb6c7f4b24b92a6f2c9d))

## [0.39.0](https://github.com/ts-factory/bublik-ui/compare/v0.38.0...v0.39.0) (2024-02-22)

### 👷‍ Build System

- **docker:** add docker for easily bootstrapping dev env ([f0da04d](https://github.com/ts-factory/bublik-ui/commit/f0da04db315506a64d04e8932f265fc0be6d250f))

### 🐛 Bug Fix

- **providers:** [tooltip] disable hoverable content ([dc6baf5](https://github.com/ts-factory/bublik-ui/commit/dc6baf5ee560c7ed9881802efde702607def69b4))
- **ui:** [checkbox] not updating on label click ([3475b01](https://github.com/ts-factory/bublik-ui/commit/3475b01081281b6766da0cd691df52d2c5aa1efc))

### 🚀 New Feature

- **log:** make log page respect user preferences ([ef5ebe3](https://github.com/ts-factory/bublik-ui/commit/ef5ebe34c5c9954252dc0d3cebfe09af2a273c45))
- **performance:** add view for bublik performance self-testing ([2a3619b](https://github.com/ts-factory/bublik-ui/commit/2a3619b4dc8f3258459d84e3816fb5c5bd3060b9))
- **run:** add ability to highlight param difference ([b75d295](https://github.com/ts-factory/bublik-ui/commit/b75d2956820c99673e4516d7ffa9522cdcb7a205))
- **ui:** add radio group component ([aa27baa](https://github.com/ts-factory/bublik-ui/commit/aa27baa741f637dcdb39235b5233f1506c0653f8))
- **user:** [preferences] add user preferences form ([2ce58ce](https://github.com/ts-factory/bublik-ui/commit/2ce58cebce2e08bf884f2669e0fbb3aa57fa5ba3))

### ♻ Code Refactoring

- **log,history,measurements:** make history links respect preferences ([2d3cfff](https://github.com/ts-factory/bublik-ui/commit/2d3cfff076211d8adb2a2b272119d7ad7556efd1))

## 0.38.0 (2024-01-31)

### 🔧 Continuous Integration | CI

- **release,ci:** fix formatting and pass env through global config ([03b1dab](https://github.com/ts-factory/bublik-ui/commit/03b1dab85d780bc0fd71b2277fd451c6a8a780bc))

### 💅 Polish

- **import:** fix import table overflowing horizontally ([b66d49c](https://github.com/ts-factory/bublik-ui/commit/b66d49ce41918861f9425452610e9a213e8eca17))
- **ui:** [toaster] add colors for different states ([2955b94](https://github.com/ts-factory/bublik-ui/commit/2955b94a3611e6129b20fe19da71326fb25d9b6e))

### 🚀 New Feature

- **import:** add live import logs via polling for changes ([75ab1b1](https://github.com/ts-factory/bublik-ui/commit/75ab1b1a51e548b86c4e4235b61de54f48516bd0))
- **run:** add tip for ctrl+click on run page ([5ca2912](https://github.com/ts-factory/bublik-ui/commit/5ca29124d42b79c8a76c662ee0dcad1a7fc2329c))

### 📦 Chores

- **auth:** allow access to dev section for unauthenticated users ([b7f83f2](https://github.com/ts-factory/bublik-ui/commit/b7f83f26546526ce9d458c1860af967de82e35de))
- **nx:** upgrade nx and it's packages to latest versions ([ad45ca6](https://github.com/ts-factory/bublik-ui/commit/ad45ca634506812fdbcd8999f39852cd64f3f484))
- **storybook:** cleanup unused imports/types ([e1039f2](https://github.com/ts-factory/bublik-ui/commit/e1039f25d7dbaa75f2070909cd7f7134ca8e33e0))

### 🐛 Bug Fix

- **build:** adjust release config to allow releases from branches other than `main` ([22a6f6b](https://github.com/ts-factory/bublik-ui/commit/22a6f6be3555e509f16ed7c1b0999dd2d98501d5))
- **import:** [import-form] allow empty URL ([33347a3](https://github.com/ts-factory/bublik-ui/commit/33347a30152a6faafb6b5fe9ee6d16a0485faef1))
- **log:** fix json log overflow scrolling not working ([537677c](https://github.com/ts-factory/bublik-ui/commit/537677cf6729cacb226645fc9fb905430bf2a535))

### [0.37.2](#) (2023-12-28)

### 🐛 Bug Fix

- **auth:** display field errors for reset password view ([ce6eb52](#))

### [0.37.1](#) (2023-12-26)

### 🐛 Bug Fix

- **preferences:** allow current password less than 8 chars ([ec94866](#))

## [0.37.0](#) (2023-12-26)

### 🐛 Bug Fix

- **auth:** double ref ([be37aad](#))
- **auth:** not displaying error for some forms ([4402d31](#))

### 🚀 New Feature

- **admin:** add toast to notify admin when sent email message ([c7e3980]())

## [0.36.0](#) (2023-12-26)

### 🚀 New Feature

- **auth:** add errors to reset password/change password ([f13770c](#))

### [0.35.1](#) (2023-12-26)

### ♻ Code Refactoring

- **ui:** [toaster] move to sonner toaster ([62054bb](#))

### 🐛 Bug Fix

- **dashboard:** date-picker cut on overflow in some modes ([ae58964](#))
- **history:** resetting filters resets date ([aec6a76](#))
- **run:** old config for toast ([0d8376b](#))

### 📦 Chores

- **build:** upgrade lockfile ([474feb0](#))

## [0.35.0](#) (2023-12-25)

### 🐛 Bug Fix

- **history:** resetting filters reset test name ([3583a23](#))
- **history:** resetting filters resets date ([bd84bb0](#))

### 💅 Polish

- **history:** add border to run details ([ef3c5cf](#))

### 📦 Chores

- **admin,runs:** add empty and error states for queries ([199cf9b](#))
- **admin,runs:** cleanup ([65ba623](#))
- **admin:** add toast for successfully updating user ([9956060](#))
- **admin:** sort users table by default ([a9b7854](#))

### 🚀 New Feature

- **preferences:** add ability to edit profile ([ba46992](#))

### [0.34.1](#) (2023-12-22)

### 📦 Chores

- **history:** fix typo in placeholder ([9d9b4bf](#))

### 🐛 Bug Fix

- **admin:** fix some errors now showing for form ([b07eac6](#))

## [0.34.0](#) (2023-12-22)

### 💅 Polish

- **import:** improve log scrollbars ([aa35386](#))

### ♻ Code Refactoring

- **runs,history:** add `tag_expr` to forms ([f14c6e2](#))
- **users:** remove ability to change user role ([cc9f8b5](#))
- **users:** rename "email verified" to isActive flag ([11aae23](#))

### 🚀 New Feature

- **history:** add multiple expression params to form ([4f4cf34](#))

### 🐛 Bug Fix

- **auth:** change status code for retrying to 403 ([fdab344](#))
- **auth:** display error for update user form ([63286ba](#))
- **auth:** display server errors for create-user/change-password forms ([682f2a5](#))
- **history:** move inputs to respective zones of global search form ([fdada14](#))

### ✅ Tests

- **auth:** update snapshot tests ([c89ec34](#))

### 📦 Chores

- **auth:** remove old register endpoint ([dcd8b12](#))

### [0.33.1](#) (2023-12-19)

### 👷‍ Build System

- **ci:** upgrade actions to latest versions ([563e5cb](#))

## [0.33.0](#) (2023-12-18)

### 👷‍ Build System

- **ci:** add ci on pull request ([161696f](#))

### 🚀 New Feature

- **history:** add run details for point in modal ([#476](#)) ([02f5956](#))

### [0.32.3](#) (2023-12-15)

### 🐛 Bug Fix

- **dashboard:** [table] provide default date in case fetching fails ([d046e75](#))

### 📦 Chores

- **history:** sync filter state with global search form ([9635cea](#))

### [0.32.2](#) (2023-12-13)

### 👷‍ Build System

- **config:** fix disable sourcemaps ([a7d8d85](#))

### [0.32.1](#) (2023-12-13)

### 👷‍ Build System

- **config:** disable sourcemaps ([546f283](#))

### 💅 Polish

- **import:** change text color for import logs ([c65cf37](#))
- **import:** make table take whole width ([e4f4fa9](#))

### ✅ Tests

- **import:** update snapshots ([f860501](#))
- **user-preferences:** remove broken test ([3767917](#))

## [0.32.0](#) (2023-12-13)

### ♻ Code Refactoring

- **runs:** [stats] extract click logic on charts into functions ([60ebe6c](#))

### 🚀 New Feature

- **import:** add import log viewer modal ([69360f1](#))

### ✅ Tests

- **import:** upgrade snapshot tests ([de463ff](#))

### 💅 Polish

- **ui:** fix renamed class not working ([cc286d4](#))

## [0.31.0](#) (2023-12-06)

### ♻ Code Refactoring

- **charts:** reduce bundle size ([2cfcb65](#))

### 💅 Polish

- **dashboard:** [notes] break overflowing words ([b16780a](#))

### 🚀 New Feature

- **runs:** [stats] add bar chart with tests by day ([ab0eca9](#))
- **runs:** add chart page ([#475](#)) ([5bcc183](#))

## [0.30.0](#) (2023-11-29)

### ♻ Code Refactoring

- **dashboard:** full dashboard refactor ([#474](#)) ([7ca9627](#))

### 📦 Chores

- **dashboard:** extract subrow component ([16b3224](#))
- **help:** upgrade react-flow ([908ecd4](#))
- **ui:** cleanup ([4d9a0cc](#))
- **ui:** upgrade cva ([d26651b](#))

### ✅ Tests

- **dashboard:** add tests for search bar and mode picker ([a28341c](#))
- **history:** fix snapshot test ([f4a301e](#))
- **ui:** update snapshots for new app shell ([a9a87d7](#))

### 💅 Polish

- **404:** fix go to dashboard styles ([a2c1754](#))
- **changelog:** fix missing styles/fonts ([b77e421](#))
- **config:** extend height ([88dbe8b](#))
- **dashboard:** [table] fix border color ([aedcbe6](#))
- **dashboard:** [table] fix border-radius for row ([50ef904](#))
- **dashboard:** fix arrow direction of sort ([0e0b2ab](#))
- **history:** [aggregation] add underline to links on hover ([300bc77](#))
- **layout:** change overflow styles for app shell ([7f2fdb2](#))
- **runs:** add underline to run links ([2b8d492](#))

### 🐛 Bug Fix

- **dashboard:** [table] displaying old date ([770d947](#))
- **dashboard:** date changing when no today present ([11976f9](#))
- **dashboard:** display column with multiple values ([2a3de5b](#))
- **dashboard:** infinite loading on error ([1ec84b6](#))
- **dashboard:** not invalidating dashboard by day ([098723e](#))
- **dashboard:** showing loading indicator when mode and query failed ([f019999](#))
- **import:** broken select fields on `all` value ([f9c6bc7](#))
- **log:** cva using old API ([cc156a8](#))

### 🚀 New Feature

- **dashboard:** [table] add link to bug url ([a09f85c](#))
- **dashboard:** [table] ask for confirmation before removing note ([f4acc8b](#))
- **dashboard:** add error and empty state handling ([e7e339b](#))
- **dashboard:** add prefetching next/previous day ([cd92863](#))
- **dashboard:** prefetch nok for expand button on hover ([800e423](#))

## [0.29.0](#) (2023-11-22)

### 🚀 New Feature

- **deploy:** add new bublik instance for base path `/private/bublik` ([ef0bbad](#))

## [0.28.0](#) (2023-11-22)

### 🚀 New Feature

- **auth:** add ability for user to change password ([b0a843b](#))
- **auth:** add new api endpoints for changing password and import token ([2fae3af](#))
- **import:** add ability to generate import token ([35a3877](#))

### 💅 Polish

- **auth:** change login/logout to sign in/sign out ([f1074b9](#))
- **ui:** [button] add hover styles for destructive button ([3fa1ea3](#))
- **ui:** [select] add checkbox indicator to select ([ee8e13c](#))

### ✅ Tests

- **auth:** fix tests for login form ([2157380](#))

### [0.27.1](#) (2023-11-15)

## [0.27.0](#) (2023-11-13)

### 🚀 New Feature

- **log:** add all pages button to paginated log ([3ed7b2e](#))

### 💅 Polish

- **admin:** add close button to user edit/create modals ([81abf57](#))
- **error:** fix centering of error ([800b182](#))
- **settings:** change settings.layout.tsx ([2028e37](#))

### ✅ Tests

- **auth:** fix snapshot tests for login forms ([802b1a6](#))
- **e2e:** upgrade playwright ([3196482](#))

### 📦 Chores

- **admin:** remove onClose callback ([cb937cd](#))
- **auth:** fix schemas ([2e4a7ae](#))

### 🐛 Bug Fix

- **api:** check if trailing slash disabled when search params present ([f03c4b6](#))
- **app:** missing loader ([6715ce9](#))
- **history:** refresh page on reset filters click ([aba4c68](#))
- **log:** wrong url building for json log ([9d0b743](#))

## [0.27.0-beta.3](#) (2023-11-10)

### 🐛 Bug Fix

- **auth:** disable caching for user query ([b6ae8dc](#))

### 🚀 New Feature

- **auth:** add ability to reset passwords ([2bbdb28](#))

### ✅ Tests

- **auth:** fix snapshot for change password form ([3d32d8f](#))

## [0.27.0-beta.2](#) (2023-11-02)

### 🐛 Bug Fix

- **log:** remove trailing slash from json log URL ([5d57200](#))

### ⏪ Reverts

- Revert chore(auth): add logs to auth ([dbad9f3](#))

### ♻ Code Refactoring

- **auth:** change logic for determining if user is logged in ([729a071](#))

### 📦 Chores

- **auth:** remove auth slice ([fb75a6c](#))
- **profile:** fix typo ([36fe3f1](#))

## [0.27.0-beta.1](#) (2023-11-01)

### 📦 Chores

- **auth:** add logs to auth ([37597a9](#))

## [0.27.0-beta.0](#) (2023-11-01)

### ♻ Code Refactoring

- **router:** upgrade router to latest version and use data router ([6d4cbc9](#))

### 🚀 New Feature

- **admin:** add CRUD users table for admins ([#471](#)) ([0b1918f](#))
- **ui:** [error-boundary] improve error handling ([#470](#)) ([a3ec687](#))

### 🐛 Bug Fix

- **auth:** user profile header casing ([157dfb8](#))
- **ui:** make error prop option for 404 page ([4a1e14a](#))

## [0.26.0](#) (2023-10-20)

### 💅 Polish

- **dashboard:** fix border-radius not being consistent in header ([9711d95](#))

### ♻ Code Refactoring

- **router:** remove all lazy loaded components ([52987d3](#))

### 🚀 New Feature

- **router:** start loading whole app with spinner ([f1e2a79](#))
- **ui:** [form-alert]: add form alert component ([27ef388](#))

### 📦 Chores

- **changelog:** [confetti] remove changelog modal ([9899025](#))

### 🐛 Bug Fix

- **auth:** [login-form] display error when invalid credentials provided ([c24a570](#))
- **run:** [page] not prefetching tree in log page ([9994167](#))

### [0.25.1](#) (2023-10-18)

### 📦 Chores

- **import:** add 4 default rows for import ([a9190bd](#))
- **sidebar:** remove tests link from sidebar ([d188ea7](#))

### 💅 Polish

- **log:** fix floating button overlaying toolbar popovers ([f9415ad](#))
- **run:** add styles for sorted columns ([5bfb90d](#))

## [0.25.0](#) (2023-10-13)

### 🚀 New Feature

- **ui:** [sidebar] improve scrollbar behaviour for sidebar ([310035e](#))

### 🐛 Bug Fix

- **types:** remove runs config type from router ([4ba6852](#))

### 📦 Chores

- **nx:** migrate to latest nx ([7556574](#))
- **ui:** fix some react keys logic ([14432d5](#))

### [0.24.1](#) (2023-10-12)

### 🐛 Bug Fix

- **diff:** improve error message when no ids selected ([9da9af9](#))

## [0.24.0](#) (2023-10-11)

### ♻ Code Refactoring

- **log:** expand log to level 1 by default ([adaa0d2](#))
- **log:** extract pagination logic into hooks ([518eccc](#))
- **log:** improve error messages for JSON logs ([14adf94](#))
- **log:** re-arrange log levels via weight parameter ([1a9fca0](#))

### 📦 Chores

- cleanup old todos ([c9ddc48](#))
- **log:** change title of log level ([6991c01](#))

### 🐛 Bug Fix

- **import:** base query not adding prefix in queryFn ([b4a3adc](#))
- **log:** animation not working for highlighting row ([d1220bf](#))
- **log:** properly handle errors from JSON api ([4d3e73a](#))

### 🚀 New Feature

- **log:** add floating toolbar ([5cf1c4a](#))

### 💅 Polish

- **log:** add partially expanded row color ([09a0dc8](#))
- **log:** emphasize floating toolbar button styles ([75a24c0](#))
- **log:** fix styling for wrapped file block ([ff187ca](#))
- **log:** improve line breaking for pre-formatted elements ([06bfba5](#))
- **log:** improve word breaking ([8edd8ab](#))
- **log:** move log bgs to css variables ([4ef5d27](#))
- **ui:** [button] missing border in disabled state ([e3f31b5](#))
- **vars:** change all colors to hsl and allow opacity change ([15b9f1e](#))
- **vars:** fixs overlay opacity ([c9e1824](#))

### ✅ Tests

- **ui:** update snapshot tests for new css vars ([4d5a9bb](#))

### [0.23.3](#) (2023-10-03)

### 🐛 Bug Fix

- **import:** double slash in pathname ([028ea4a](#))

### [0.23.2](#) (2023-10-02)

### 🐛 Bug Fix

- **api:** wrong root url building ([ee32781](#))

### [0.23.1](#) (2023-10-02)

### 🐛 Bug Fix

- **api:** missing trailing slash for base url ([a0bc8c5](#))

## [0.23.0](#) (2023-10-02)

### 📦 Chores

- upgrade nx to latest version ([46d8d20](#))

### 🚀 New Feature

- **dashboard:** add project name to tab title ([b4f3066](#))

## [0.22.0](#) (2023-10-01)

### 🚀 New Feature

- **auth:** add initial auth logic ([#464](#)) ([97da705](#))

### 🐛 Bug Fix

- **import:** wrong parsing of URL ([96e82e0](#))

### 📦 Chores

- **log:** cleanup type imports ([7874b50](#))

### [0.21.1](#) (2023-09-18)

### 🐛 Bug Fix

- **runs:** not reading dates from URL ([8c7ad1c](#))
- **ui:** [badge-box] preventing delete chart in inputs ([4b171c2](#))

## [0.21.0](#) (2023-09-13)

### ♻ Code Refactoring

- **import:** upgrade form to support all import features ([#462](#)) ([2a92935](#))

### 🚀 New Feature

- **auth:** add initial login forms/pages ([#460](#)) ([8722379](#))
- **history:** add hover card with links to actions column ([#463](#)) ([7b7d418](#))

### 🐛 Bug Fix

- **history:** export to form value type ([e0552d8](#))
- **log:** incorrect color for error, warn levels ([0860697](#))

### [0.20.1](#) (2023-09-06)

### 💅 Polish

- **log:** improve row colors ([535c92b](#))

### ♻ Code Refactoring

- **history:** [form] add tags expression input ([a62bdd0](#))
- **history:** extract expressions into separate input ([#461](#)) ([221397a](#))

## [0.20.0](#) (2023-08-16)

### 💅 Polish

- **sidebar:** add hover effect for logo button ([a11349a](#))
- **ui:** [button] fix disabled text color ([e9df017](#))

### 🐛 Bug Fix

- **measurements, history:** limit max results ids by 6000 ([024bbb1](#))
- **run:** [table] disable expand/preview buttons when no NOK present ([461f0b3](#))
- **ui:** [form] remove old type ([ac9d5f7](#))

### 🚀 New Feature

- **measurements:** add separate screen for combined charts ([afa3680](#))
- **ui:** allow creating custom errors ([fae27e1](#))

### 📦 Chores

- **measurements:** remove old chart modes ([8656714](#))
- **test:** update history-error snapshots ([303a55a](#))

## [0.19.0](#) (2023-08-02)

### 🚀 New Feature

- **log:** add timestamp delta with anchor ([616b73c](#))

## [0.19.0-beta.0](#) (2023-07-24)

### 🐛 Bug Fix

- **log:** time delta not working correctly with timestamps ([e6ef2c4](#))
- **ui:** [tags-box-input] removing selected items ([ed6f41e](#))

### ♻ Code Refactoring

- **ui:** [chart] replace chart toolbar with updated ([c3a6a30](#))

### 💅 Polish

- **history:** [plot-list] add shadow to header when sticky ([0a4403f](#))
- **history:** [refresh] fix animation origin ([23c81da](#))
- **measurements:** improve measurements chart layout ([36d7ae9](#))
- **ui:** [button] don't allow click when loading ([4cc0967](#))
- **ui:** [chart] add more space in fullscreen mode ([faac01e](#))
- **ui:** [export-button] fix icon and styles ([28d2cb3](#))
- **ui:** [link] missing animation when loading ([5e6c55a](#))

### 📦 Chores

- **log:** add timestamp mock ([b926195](#))
- **measurements:** [chart] remove plot with series ([012d1e4](#))
- **ui:** [chart] adjust icon sizes ([392a963](#))
- **ui:** [chart] improve voice over labels ([cc97fc2](#))

### 🚀 New Feature

- **history, measuremensts:** add fullscreen chart ([fda3f68](#))
- **history:** [chart] add ability to view charts with multiple Y axises ([#456](#)) ([5aa8ad0](#))
- **ui:** [toolbar] add toolbar component ([aa142d5](#))

### ✅ Tests

- **history, import:** update snapshot tests ([0fbda34](#))

## [0.18.0](#) (2023-07-07)

### ♻ Code Refactoring

- **ui:** [button] replace all buttons with updated one ([6f31418](#))

### 🚀 New Feature

- **log:** add ability to display timestamp delta ([#446](#)) ([1391225](#))
- **log:** add command to generate log schema ([6fc71c5](#))
- **measurements:** add toggle to show/hide sliders ([#445](#)) ([1262867](#))
- **runs:** add new badge input ([#444](#)) ([901ba60](#))

### 📦 Chores

- **history:** remove stacked mode from history ([ce02b08](#))
- **run:** add storybook handlers ([33c71b7](#))

### 💅 Polish

- **history:** improve chart layout on smaller screens ([8c3993e](#))
- **measurements:** add right space to chart ([9c786da](#))

### 🐛 Bug Fix

- **log:** change default test id to tin ([#447](#)) ([679858d](#))
- **runs:** duplicate run data badges with same key ([ac15c5e](#))

### [0.17.2](#) (2023-06-14)

### 💅 Polish

- **runs:** return shadow sticky scroll ([be58ed0](#))

### 🐛 Bug Fix

- **changelog:** adapt to new deploy info JSON ([4a4bf34](#))

### [0.17.1](#) (2023-06-09)

### 🐛 Bug Fix

- **dashboard, runs:** clicking on NOK with ctrl pressed not expanding results on linux ([e4ea7cd](#))
- **log:** pagination for first page is not fetching correct data ([c3a7b9b](#))

### 💅 Polish

- **log:** add pagination at the top of the table ([6cb7937](#))

## [0.17.0](#) (2023-06-09)

### 📦 Chores

- **dev:** add node version ([a33ede7](#))
- **log:** add storybook story for log tree ([d81fbd0](#))

### 💅 Polish

- **log:** adjust styles for log meta header ([33b3efd](#))
- **log:** adjust table styles ([6d3e3fb](#))
- **log:** fix unexpected icon size ([e0461c6](#))

### 🐛 Bug Fix

- **storybok:** fix old icon stories ([76e6dad](#))

### ♻ Code Refactoring

- **changelog:** add full changelog ([544e319](#))
- **log:** rework filtering UI and parameters table ([#443](#)) ([460357f](#))

### 🔧 Continuous Integration | CI

- **pnpm:** add auto-install-peers flag ([bce8369](#))
- **release:** don't ignore prerelease tags ([455b479](#))

## [0.17.0-beta.0](#) (2023-05-25)

### 📝 Documentation

- **config:** adjust docs to new build pipeline ([216af6a](#))

### 👷‍ Build System

- **size:** extract echarts chunk manulally to reduce size ([ba312fe](#))
- **vite:** add ability to specify remote JSON logs storage ([6f915d4](#))

### 🔧 Continuous Integration | CI

- **build:** fix failing to parse passed args ([af3151e](#))
- **build:** skip changelog for beta releases ([72801ed](#))

### ♻ Code Refactoring

- **icon:** convert all icons to `.svg` ([#439](#)) ([d056f89](#))
- **run:** change displayed run columns ([1896f7e](#))
- **ui:** replace all skeletons with component ([96b32ba](#))

### 🐛 Bug Fix

- **history:** lazy loading modules ([5f9e6ed](#))
- **log:** [frame] not saving line number on subsequent navigations ([4e185aa](#))
- **runs:** date range picker no label warning ([4b9f05f](#))
- **runs:** importing from lazy loaded module ([4c8fe1a](#))

### 💅 Polish

- **animation:** [dialog] add animation to dialog content ([cf17bf6](#))
- **changelog:** add confetti explosion on new release ([645202e](#))
- **history:** add animation to context menu ([3c7242e](#))
- **history:** align reset buttons with close button ([4957228](#))
- **import:** fix overflow scrollbars ([16ffa15](#))
- **import:** make modal title bigger ([bb84145](#))
- **run:** [table] add group columns with border ([af37d1e](#))
- **run:** add background on row hover ([ed74c97](#))
- **run:** uppercase table columns ([abcf61b](#))
- **tooltip:** change shadow ([46e3238](#))

### 🚀 New Feature

- **ci:** add changelog to the ui ([#434](#)) ([a7109ff](#))
- **faq:** add latest tag info ([cbe7b4e](#))
- **formatting:** convert formatting to use tabs ([4b348d1](#))
- **log:** add experimental support for JSON logs ([677fd29](#))
- **log:** add initial support for displaying log content ([d8ebcb1](#))
- **log:** add pagination support to schema ([6a1af72](#))
- **log:** add pagination support to schema ([36706ae](#))
- **run:** [results-table] add key list with urls ([83784ef](#))
- **run:** add column visibility toggle to run/diff pages ([ab0d28e](#))
- **run:** add tooltips to details/toolbar buttons ([73c2bb5](#))
- **sidebar:** add collapsible links ([1295902](#))
- **sidebar:** show/hide sidebar on `s` keypress ([ef529b8](#))
- **ui:** add dropdown menu component ([cea395f](#))
- **ui:** add skeleton component ([cfd9b98](#))

### ⏪ Reverts

- **log:** [frame] not saving line number on navigations ([f77e166](#))
- **run:** rollback renaming column ids for run table ([ad334d5](#))

### ✅ Tests

- **ci:** fix lint command ([0bf7f43](#))
- **e2e:** add playwright support ([0ec5dfe](#))
- **history:** add some snapshot tests to history ([7aa7dba](#))
- **import:** fix snapshot for overflow table ([a9d5360](#))
- **import:** fix snapshot test for loading table state ([518a2e6](#))
- **log:** remove build target from lib ([fe240a7](#))
- **run:** fix div instead of button when no url present ([63dfee6](#))
- **ui:** [clock] fix timezone issue in CI ([897a578](#))
- **ui:** [icon] fix svgr not loading in vitest ([365b5e7](#))

### 📦 Chores

- **build:** migrate from webpack to vite ([749a97b](#))
- **build:** upgrade vite to v4.3 ([177fd89](#))
- **changelog:** [modal] disable modal until checkbox is ready ([ca82635](#))
- **changelog:** lazy load changelog ([03d0276](#))
- **ci:** add new commit types ([13730fa](#))
- **ci:** fix compare url ([eff2eb6](#))
- **ci:** update pipeline for manual releases ([425702d](#))
- **deploy:** adjust api for new JSON format ([e4713a4](#))
- **env:** move all env configs to bublik app config ([e353093](#))
- **log:** add run id to tab title ([8c88283](#))
- **log:** remove zod schema converting to JSON from production bundle ([24f2b3f](#))
- **nx:** upgrade nx to 16.2.1 ([6184eaf](#))
- **release:** v0.16.0 ([8d0b1cd](#))
- **test:** update snapshots ([4839df8](#))

## [0.15.0](#) (2023-05-18)

### 📝 Documentation

- **config:** adjust docs to new build pipeline ([216af6a](#))

### 📦 Chores

- **build:** migrate from webpack to vite ([749a97b](#))
- **build:** upgrade vite to v4.3 ([177fd89](#))
- **changelog:** lazy load changelog ([03d0276](#))
- **ci:** add new commit types ([13730fa](#))
- **ci:** fix compare url ([eff2eb6](#))
- **ci:** update pipeline for manual releases ([425702d](#))
- **env:** move all env configs to bublik app config ([e353093](#))
- **log:** add run id to tab title ([8c88283](#))
- **test:** update snapshots ([4839df8](#))

### 💅 Polish

- **animation:** [dialog] add animation to dialog content ([cf17bf6](#))
- **changelog:** add confetti explosion on new release ([645202e](#))
- **history:** add animation to context menu ([3c7242e](#))
- **import:** fix overflow scrollbars ([16ffa15](#))
- **import:** make modal title bigger ([bb84145](#))
- **run:** uppercase table columns ([abcf61b](#))
- **tooltip:** change shadow ([46e3238](#))

### ✅ Tests

- **ci:** fix lint command ([0bf7f43](#))
- **e2e:** add playwright support ([0ec5dfe](#))
- **history:** add some snapshot tests to history ([7aa7dba](#))
- **import:** fix snapshot for overflow table ([a9d5360](#))
- **import:** fix snapshot test for loading table state ([518a2e6](#))
- **log:** remove build target from lib ([fe240a7](#))
- **run:** fix div instead of button when no url present ([63dfee6](#))

### ♻ Code Refactoring

- **run:** change displayed run columns ([1896f7e](#))
- **ui:** replace all skeletons with component ([96b32ba](#))

### ⏪ Reverts

- **run:** rollback renaming column ids for run table ([ad334d5](#))

### 👷‍ Build System

- **size:** extract echarts chunk manulally to reduce size ([ba312fe](#))
- **vite:** add ability to specify remote JSON logs storage ([6f915d4](#))

### 🔧 Continuous Integration | CI

- **build:** skip changelog for beta releases ([72801ed](#))

### 🚀 New Feature

- **ci:** add changelog to the ui ([#434](#)) ([a7109ff](#))
- **faq:** add latest tag info ([cbe7b4e](#))
- **formatting:** convert formatting to use tabs ([4b348d1](#))
- **log:** add experimental support for JSON logs ([677fd29](#))
- **log:** add initial support for displaying log content ([d8ebcb1](#))
- **log:** add pagination support to schema ([6a1af72](#))
- **log:** add pagination support to schema ([36706ae](#))
- **run:** [results-table] add key list with urls ([83784ef](#))
- **run:** add column visibility toggle to run/diff pages ([ab0d28e](#))
- **sidebar:** add collapsible links ([1295902](#))
- **sidebar:** show/hide sidebar on `s` keypress ([ef529b8](#))
- **ui:** add dropdown menu component ([cea395f](#))
- **ui:** add skeleton component ([cfd9b98](#))

### 🐛 Bug Fix

- **history:** lazy loading modules ([5f9e6ed](#))
- **runs:** date range picker no label warning ([4b9f05f](#))
- **runs:** importing from lazy loaded module ([4c8fe1a](#))

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
