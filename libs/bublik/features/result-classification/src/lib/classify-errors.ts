/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { z } from 'zod';

import { getErrorMessage } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

import type { ClassifyForm, ClassifyFormValues } from './classify-form';

/**
 * Django's `custom_exception_handler` wraps every serializer error as
 * `{"messages": ...}` and `normalize_error_details` recurses, so a nested
 * serializer produces a nested payload:
 *
 *     {"messages": {"issue": {"bug_key": ["Bug key must be in ref://TRACKER/KEY form."]}}}
 *
 * The shared parsers — `setErrorsOnForm` in `@/shared/utils` and
 * `getErrorMessage` in `@/services/bublik-api` — only model one level of
 * nesting, so this payload falls past both and degrades to "Bad request" /
 * "Unknown error!". Classify is the one endpoint that nests (its `issue` field
 * runs `IssueSerializer` inside `validate_issue`), so the recursion lives here
 * and the shared helpers stay as the fallback for every other shape.
 */

type ServerMessages = string | string[] | { [key: string]: ServerMessages };

const ServerMessagesSchema: z.ZodType<ServerMessages> = z.lazy(() =>
	z.union([
		z.string(),
		z.array(z.string()),
		z.record(z.string(), ServerMessagesSchema)
	])
);

const ServerErrorSchema = z.object({
	status: z.union([z.string(), z.number()]),
	data: z.object({ messages: ServerMessagesSchema })
});

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

export interface ServerFieldError {
	/** Dotted path into the request body, e.g. `issue.bug_key`. */
	path: string;
	message: string;
}

/**
 * Walks the payload into flat `path -> message` pairs. Only the first message
 * of a list survives, which is the same collapse `getError` in
 * `@/shared/utils`'s `form.ts` applies — a field shows one error at a time.
 */
export function flattenMessages(
	messages: ServerMessages,
	prefix = ''
): ServerFieldError[] {
	if (typeof messages === 'string') {
		return [{ path: prefix, message: messages }];
	}

	if (Array.isArray(messages)) {
		const first = messages[0];

		return first ? [{ path: prefix, message: first }] : [];
	}

	return Object.entries(messages).flatMap(([key, value]) =>
		flattenMessages(value, prefix ? `${prefix}.${key}` : key)
	);
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

function describe({ path, message }: ServerFieldError): string {
	if (!path) return message;

	return `${LABEL_BY_PATH[path] ?? path}: ${message}`;
}

/**
 * Puts each server message on the field that caused it, so the drawer behaves
 * like every other form in the app. Anything without a field — `matcher.*`, an
 * unknown key, a bare list — goes to `root`, which the form renders as an
 * alert above the first section.
 */
export function applyClassifyErrors(error: unknown, form: ClassifyForm): void {
	const parsed = ServerErrorSchema.safeParse(error);

	if (!parsed.success) {
		setErrorsOnForm<ClassifyFormValues>(error, { handle: form });
		return;
	}

	const entries = flattenMessages(parsed.data.data.messages);

	if (!entries.length) {
		form.setError('root', { type: 'custom', message: 'Unknown error!' });
		return;
	}

	const mode = form.getValues('mode');
	const rootMessages: string[] = [];

	entries.forEach((entry) => {
		const field = fieldForPath(entry.path, mode);

		if (field) {
			form.setError(field, { type: 'custom', message: entry.message });
			return;
		}

		rootMessages.push(describe(entry));
	});

	if (rootMessages.length) {
		form.setError('root', {
			type: 'custom',
			message: rootMessages.join('\n')
		});
	}
}

/**
 * The same messages as one string, for the toast. Falls back to the shared
 * `getErrorMessage` for the shapes it already handles (transport failures,
 * HTTP codes with no body).
 */
export function classifyErrorText(error: unknown): string {
	const parsed = ServerErrorSchema.safeParse(error);

	if (parsed.success) {
		const entries = flattenMessages(parsed.data.data.messages);

		if (entries.length) return entries.map(describe).join('\n');
	}

	const message = getErrorMessage(error);

	return `${message.title}\n${message.description}`;
}
