/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import { runCommentOf, runCommentPreview } from './run-comment.utils';

describe('runCommentOf', () => {
	it('is the comment of the run', () => {
		expect(runCommentOf({ comment: ' Link flap\n' })).toBe('Link flap');
	});

	it('is empty for a run without a comment', () => {
		expect(runCommentOf({ comment: null })).toBe('');
		expect(runCommentOf({ comment: '  ' })).toBe('');
	});

	it('is empty when the backend does not list comments', () => {
		expect(runCommentOf({})).toBe('');
	});
});

describe('runCommentPreview', () => {
	it('is the first line with text', () => {
		expect(runCommentPreview('\n  \nfirst\nsecond')).toEqual({
			text: 'first',
			isHeading: false
		});
	});

	it('marks a heading line', () => {
		expect(runCommentPreview('## Link flap\ntext')).toEqual({
			text: '## Link flap',
			isHeading: true
		});
	});
});
