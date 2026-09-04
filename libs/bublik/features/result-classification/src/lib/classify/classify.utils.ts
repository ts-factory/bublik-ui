/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	applyServerErrors,
	flattenMessages,
	serverErrorText,
	type ServerFieldError
} from '../shared/server-errors.utils';

import type {
	ClassifyForm,
	ClassifyFormValues
} from './classify-form.component';

export { flattenMessages, type ServerFieldError };

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
