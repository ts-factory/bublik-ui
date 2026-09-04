/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { VisibilityState } from '@tanstack/react-table';

export const COLUMN_ID = {
	STATUS: 'status',
	PROJECT: 'rule_project',
	ACTIONS: 'actions',
	TEST: 'test',
	KEY: 'key',
	ISSUE: 'issue',
	ISSUE_STATE: 'issueState',
	CATEGORY: 'category',
	DISPOSITION: 'disposition',
	SCOPE: 'scope',
	ACTIVE: 'active',
	TAGS: 'tags',
	VERDICTS: 'verdicts',
	PARAMETERS: 'parameters'
} as const;

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
	[COLUMN_ID.ACTIVE]: false
};

export const FILTER_KEYS = [
	COLUMN_ID.PROJECT,
	COLUMN_ID.ISSUE_STATE,
	COLUMN_ID.CATEGORY,
	COLUMN_ID.DISPOSITION,
	COLUMN_ID.ACTIVE,
	COLUMN_ID.TAGS,
	COLUMN_ID.VERDICTS,
	COLUMN_ID.PARAMETERS
] as const;

export const ACTIVE_ORDER = ['true', 'false'] as const;

export type ActiveKey = (typeof ACTIVE_ORDER)[number];

export const COLUMN_VISIBILITY_KEY = {
	ALL_RULES: 'issue-rules-all-v2',
	ONE_ISSUE: 'issue-rules-v2'
} as const;

export const DEFAULT_PAGE_SIZE = 100;
