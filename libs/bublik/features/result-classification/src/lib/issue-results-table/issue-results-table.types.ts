/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ReactNode, RefObject } from 'react';
import type { RunDataResults } from '@/shared/types';

export type ResultRow = RunDataResults;

/**
 * A row's preview trigger, supplied by the page. The log preview drawer lives
 * in a feature that itself depends on this one, so this table cannot import
 * it — the page, which can, hands the button in.
 */
export type RenderResultPreview = (
	result: ResultRow,
	runId: number | string
) => ReactNode;

export interface IssueResultsProps {
	renderResultPreview?: RenderResultPreview;
	/** The scroller these results are a sub-row of; pins the header under it. */
	scrollRef?: RefObject<HTMLElement>;
	issueId: number;
	projectId?: number;
	runId?: number | string;
}
