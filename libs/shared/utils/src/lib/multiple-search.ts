/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	bool01,
	defineSearch,
	repeated,
	str,
	type InferSearch
} from '@/router';

import { RUN_TABLE_SHAPE } from './run-search';

/**
 * `/multiple`: the pinned runs, the one shown, the mode, and
 * the whole run table state for the table it renders.
 */
const multipleSearch = defineSearch(
	{
		...RUN_TABLE_SHAPE,
		runIds: repeated(),
		selected: str(),
		isModeFull: bool01()
	},
	{ isModeFull: false }
);

type MultipleSearch = InferSearch<typeof multipleSearch>;

export { multipleSearch };
export type { MultipleSearch };
