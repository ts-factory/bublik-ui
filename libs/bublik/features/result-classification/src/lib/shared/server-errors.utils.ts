/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { getErrorMessage } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

/**
 * Django's `custom_exception_handler` wraps every serializer error as
 * `{"messages": ...}` and `normalize_error_details` recurses, so a nested
 * serializer produces a nested payload:
 *
 *     {"messages": {"issue": {"bug_key": ["Bug key must be in ref://TRACKER/KEY form."]}}}
 *
 * The shared parsers — `setErrorsOnForm` in `@/shared/utils` and
 * `getErrorMessage` in `@/services/bublik-api` — only model one level of
 * nesting, so a payload like that falls past both and degrades to "Bad request"
 * / "Unknown error!".
 *
 * This module owns the recursion. Every classification form routes through it:
 * `classify-errors.ts` supplies the classify endpoint's maps, the issue and
 * rule drawers supply theirs. The shared helpers stay as the fallback for
 * shapes this does not recognise — transport failures, HTTP codes with no body.
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

export interface ServerErrorMaps<T extends FieldValues> {
	/**
	 * Request-body path -> the form field that owns it. Returning `null` sends
	 * the message to `root` instead, which is right for anything the form has no
	 * single control for.
	 */
	fieldForPath: (path: string) => Path<T> | null;
	/** Readable stand-ins for the wire names, for messages that land on `root`. */
	labelByPath?: Record<string, string>;
}

function describe(
	{ path, message }: ServerFieldError,
	labelByPath: Record<string, string> = {}
): string {
	if (!path) return message;

	return `${labelByPath[path] ?? path}: ${message}`;
}

/**
 * Puts each server message on the field that caused it, so a drawer behaves
 * like every other form in the app. Anything without a field — an unknown key,
 * a bare list — goes to `root`, which the forms render as an alert above the
 * first section.
 */
export function applyServerErrors<T extends FieldValues>(
	error: unknown,
	form: UseFormReturn<T>,
	maps: ServerErrorMaps<T>
): void {
	const parsed = ServerErrorSchema.safeParse(error);

	if (!parsed.success) {
		setErrorsOnForm<T>(error, { handle: form });
		return;
	}

	const entries = flattenMessages(parsed.data.data.messages);

	if (!entries.length) {
		form.setError('root', { type: 'custom', message: 'Unknown error!' });
		return;
	}

	const rootMessages: string[] = [];

	entries.forEach((entry) => {
		const field = maps.fieldForPath(entry.path);

		if (field) {
			form.setError(field, { type: 'custom', message: entry.message });
			return;
		}

		rootMessages.push(describe(entry, maps.labelByPath));
	});

	if (rootMessages.length) {
		form.setError('root', {
			type: 'custom',
			message: rootMessages.join('\n')
		});
	}
}

/**
 * The same messages as one string, for a toast. Falls back to the shared
 * `getErrorMessage` for the shapes it already handles.
 */
export function serverErrorText(
	error: unknown,
	labelByPath?: Record<string, string>
): string {
	const parsed = ServerErrorSchema.safeParse(error);

	if (parsed.success) {
		const entries = flattenMessages(parsed.data.data.messages);

		if (entries.length) {
			return entries.map((entry) => describe(entry, labelByPath)).join('\n');
		}
	}

	return notifyError(error);
}

/**
 * The one-string form of a rejection, for `toast.promise`'s `error` slot.
 *
 * Was written out three times — `issue-actions.tsx`, `issue-rules-table.tsx`
 * and inline in the run table — which is two too many for four lines that must
 * agree on how a failure reads.
 */
export function notifyError(error: unknown): string {
	const message = getErrorMessage(error);

	return `${message.title}\n${message.description}`;
}
