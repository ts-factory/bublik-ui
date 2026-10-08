/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	bool01,
	defineSearch,
	enumOf,
	passthrough,
	repeatedNum,
	str,
	type InferSearch
} from '@/router';

/**
 * The keys every page carries, declared on the root route
 * so `useSearch` is typed for them everywhere. The sidebar lib decodes `_s`
 * itself and `Layout` parses `hide-sidebar` (`1|true|0|false`) itself.
 *
 * No key is retained across navigations here: `LinkWithProject` and
 * `useNavigateWithProject` re-add `project`, `_s` and `hide-sidebar`
 * explicitly, as today, so links that drop them on purpose keep dropping them.
 */
const rootSearch = defineSearch(
	{
		project: repeatedNum(),
		_s: str(),
		'hide-sidebar': passthrough(),
		'settings-open': bool01(),
		'settings-tab': enumOf(['account', 'appearance', 'beta', 'preferences'])
	},
	{ 'settings-open': false, 'settings-tab': 'account' }
);

type RootSearch = InferSearch<typeof rootSearch>;

export { rootSearch };
export type { RootSearch };
