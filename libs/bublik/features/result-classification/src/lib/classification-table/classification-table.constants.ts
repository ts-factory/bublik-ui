/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { config } from '@/bublik/config';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 75, 100] as const;

export const DEFAULT_PAGE_SIZE = 25;

export const KEY = {
	PAGE: 'page',
	PAGE_SIZE: 'pageSize',
	SEARCH: 'q',
	SORT: 'sort'
} as const;

export const SORT_NONE = 'none';

export const DELIMITER = config.queryDelimiter;
