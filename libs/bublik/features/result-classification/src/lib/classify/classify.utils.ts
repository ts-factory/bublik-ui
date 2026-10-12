/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	applyServerErrors,
	flattenMessages,
	serverErrorText,
	type ServerFieldError
} from '../shared/server-errors.utils';

import type { ClassifyScope, IssueCategory } from '@/shared/types';

import {
	CATEGORY_META,
	DISPOSITION_META
} from '../classification/classification.constants';
import { dispositionKey } from '../classification/classification.utils';
import type { ClassifyForm, ClassifyFormValues } from './classify-form.types';

export { flattenMessages, type ServerFieldError };

/**
 * The success toast's two lines. The first names the verdict as the drawer
 * showed it; the second says what it did to the counts, which is the one thing
 * the row itself cannot say until it re-renders.
 */
export function classifiedToast(input: {
	category: IssueCategory;
	expected: boolean | null;
	scope: ClassifyScope;
}): { title: string; description: string } {
	const disposition = DISPOSITION_META[dispositionKey(input.expected)];
	const effect =
		input.expected === true
			? 'No longer counts as unexpected while the issue is open.'
			: input.expected === false
			? 'Still counts as unexpected.'
			: 'Marked only: still counts as unexpected.';
	const reach =
		input.scope === 'future'
			? 'Future matching results inherit it.'
			: 'This result only.';

	return {
		title: `Classified as ${CATEGORY_META[
			input.category
		].displayValue.toLowerCase()} — ${disposition.label.toLowerCase()}`,
		description: `${effect} ${reach}`
	};
}

export class ClassifyRequestError extends Error {
	readonly status = 400;
	readonly data: { messages: string[] };

	constructor(message: string) {
		super(message);
		this.name = 'ClassifyRequestError';
		this.data = { messages: [message] };
	}
}

const FIELD_BY_PATH: Record<string, keyof ClassifyFormValues> = {
	'issue.bug_key': 'bugKey',
	'issue.title': 'title',
	category: 'category',
	scope: 'scope',
	expected: 'expected'
};

const LABEL_BY_PATH: Record<string, string> = {
	'issue.bug_key': 'Bug key',
	'issue.title': 'Title',
	'issue.description': 'Description',
	// Filled in from the result's project, so the user has nothing to fix; it
	// still has to reach the root error instead of vanishing.
	'issue.project': 'Project',
	'issue.non_field_errors': 'Issue',
	issue: 'Issue',
	category: 'Category',
	scope: 'Scope',
	expected: 'Expected'
};

function fieldForPath(
	path: string,
	mode: ClassifyFormValues['mode']
): keyof ClassifyFormValues | null {
	if (path === 'issue') return mode === 'existing' ? 'issueId' : null;

	return FIELD_BY_PATH[path] ?? null;
}

export function applyClassifyErrors(error: unknown, form: ClassifyForm): void {
	const mode = form.getValues('mode');

	applyServerErrors(error, form, {
		fieldForPath: (path) => fieldForPath(path, mode),
		labelByPath: LABEL_BY_PATH
	});
}

export function classifyErrorText(error: unknown): string {
	return serverErrorText(error, LABEL_BY_PATH);
}
