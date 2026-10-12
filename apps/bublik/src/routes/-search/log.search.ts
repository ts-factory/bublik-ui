/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	boolTrue,
	defineSearch,
	enumOf,
	num,
	str,
	type InferSearch
} from '@/router';

/**
 * `/log/$runId`, also attached to the legacy `/log/$runId/$old`
 * redirect so the search it forwards is typed. No read-time defaults: an
 * absent or unknown `mode` renders the log on its own, an absent `page` is
 * the first page unless "all pages" is remembered in localStorage, and an
 * absent `focusId` is the whole run. `page` is a string because `0` means
 * every page at once and page one is never written. `experimental` is
 * deprecated: still read, only ever deleted.
 */
const logSearch = defineSearch({
	focusId: num(),
	lineNumber: str(),
	mode: enumOf(['log', 'infoAndlog', 'treeAndinfoAndlog', 'treeAndlog']),
	page: str(),
	legacy: boolTrue(),
	experimental: str()
});

type LogSearch = InferSearch<typeof logSearch>;

export { logSearch };
export type { LogSearch };
