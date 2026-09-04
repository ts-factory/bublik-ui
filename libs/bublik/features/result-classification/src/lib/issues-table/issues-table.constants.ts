/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

export const COLUMN_ID = {
	STATUS: 'status',
	ACTIONS: 'actions',
	KEY: 'key',
	ISSUE: 'issue',
	DESCRIPTION: 'description',
	CREATED: 'created',
	STATE: 'state',
	PROJECT: 'issue_project',
	CATEGORIES: 'categories',
	RULES: 'rules'
} as const;

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.CREATED]: false
};

export const COLUMN_VISIBILITY_KEY = 'issues';

export const FILTER_KEYS = [
	COLUMN_ID.STATE,
	COLUMN_ID.PROJECT,
	COLUMN_ID.CATEGORIES,
	COLUMN_ID.RULES
] as const;

export const DEFAULT_PAGE_SIZE = 100;
