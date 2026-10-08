/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

import { defineSearch, json, str, type InferSearch } from '@/router';

/**
 * `/compare`. `left` and `right` are run ids written by links
 * only; the page shows its error state without them. Both table states are
 * plain JSON, not compressed; the diff table starts with its TOTAL, RUN and
 * ABNORMAL columns hidden.
 */
const compareSearch = defineSearch(
	{
		left: str(),
		right: str(),
		expanded: json<Record<string, boolean>>(),
		columnVisibility: json<VisibilityState>()
	},
	{
		expanded: { '0': true },
		columnVisibility: {
			TOTAL_LEFT: false,
			TOTAL_RIGHT: false,
			RUN_LEFT: false,
			RUN_RIGHT: false,
			ABNORMAL_LEFT: false,
			ABNORMAL_RIGHT: false
		}
	}
);

type CompareSearch = InferSearch<typeof compareSearch>;

export { compareSearch };
export type { CompareSearch };
