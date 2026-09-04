/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { config } from '@/bublik/config';

/** Mirrors `DEFAULT_PAGE_SIZES` in the shared `Pagination` component. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 75, 100] as const;

export const DEFAULT_PAGE_SIZE = 25;

/**
 * The URL keys this state owns. Facet columns add one key each, named after
 * the column id, so a column id and a query param are the same string.
 */
export const KEY = {
	PAGE: 'page',
	PAGE_SIZE: 'pageSize',
	SEARCH: 'q',
	SORT: 'sort'
} as const;

/** Distinguishes "sorted by nothing" from "sorting untouched". */
export const SORT_NONE = 'none';

/** Multi-valued facets are `;`-joined, as the rest of the app writes lists. */
export const DELIMITER = config.queryDelimiter;
