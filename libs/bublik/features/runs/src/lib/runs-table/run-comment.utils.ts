/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { RunsData } from '@/shared/types';

/** The run's comment, or an empty string for a run without one. */
function runCommentOf(run: Pick<RunsData, 'comment'>): string {
	return run.comment?.trim() ?? '';
}

const HEADING = /^#{1,6}\s+/;

/** The comment's first line with text, for a one-line preview. */
function runCommentPreview(comment: string): {
	text: string;
	isHeading: boolean;
} {
	const line =
		comment
			.split('\n')
			.map((candidate) => candidate.trim())
			.find(Boolean) ?? '';

	return { text: line, isHeading: HEADING.test(line) };
}

export { runCommentOf, runCommentPreview };
