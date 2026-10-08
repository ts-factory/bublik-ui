/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { InferSearch } from '@/router';

import { defineClassificationSearch } from './classification.search';

/** `/issues`: every issue of the project. */
const issuesSearch = defineClassificationSearch({
	facets: ['state', 'categories', 'rules'],
	pageSize: 100,
	sort: [{ id: 'results', desc: true }]
});

type IssuesSearch = InferSearch<typeof issuesSearch>;

export { issuesSearch };
export type { IssuesSearch };
