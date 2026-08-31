/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	applyServerErrors,
	flattenMessages,
	serverErrorText,
	type ServerFieldError
} from './server-errors';

import type { ClassifyForm, ClassifyFormValues } from './classify-form';

/**
 * Classify's half of the error mapping. The recursion that reads Django's
 * nested `{"messages": ...}` envelope lives in `server-errors.ts` — shared with
 * the issue and rule drawers, which hit the same shape. What is specific here
 * is the vocabulary: which request-body path belongs to which control, and that
 * a bare `issue` error means different things under `new` and `existing`.
 */

/** Re-exported so existing importers and specs keep their entry points. */
export { flattenMessages, type ServerFieldError };

/**
 * A failure raised on this side of the wire, shaped like the payload the server
 * would have sent. Lets `applyClassifyErrors` and `classifyErrorText` render it
 * through the same path as a real rejection instead of growing a second one.
 */
export class ClassifyRequestError extends Error {
	readonly status = 400;
	readonly data: { messages: string[] };

	constructor(message: string) {
		super(message);
		this.name = 'ClassifyRequestError';
		this.data = { messages: [message] };
	}
}

/** Request-body paths the form has a field for. */
const FIELD_BY_PATH: Record<string, keyof ClassifyFormValues> = {
	'issue.bug_key': 'bugKey',
	'issue.title': 'title',
	category: 'category',
	scope: 'scope',
	expected: 'expected'
};

/** Readable stand-ins for the wire names, for messages that land on `root`. */
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
	// A bare `issue` error is about the picked issue only when there is one to
	// pick; under `new` it is about the object as a whole, which no single
	// field owns.
	if (path === 'issue') return mode === 'existing' ? 'issueId' : null;

	return FIELD_BY_PATH[path] ?? null;
}

/**
 * Puts each server message on the field that caused it, so the drawer behaves
 * like every other form in the app. Anything without a field — `matcher.*`, an
 * unknown key, a bare list — goes to `root`, which the form renders as an
 * alert above the first section.
 */
export function applyClassifyErrors(error: unknown, form: ClassifyForm): void {
	const mode = form.getValues('mode');

	applyServerErrors(error, form, {
		fieldForPath: (path) => fieldForPath(path, mode),
		labelByPath: LABEL_BY_PATH
	});
}

/** The same messages as one string, for the toast. */
export function classifyErrorText(error: unknown): string {
	return serverErrorText(error, LABEL_BY_PATH);
}
