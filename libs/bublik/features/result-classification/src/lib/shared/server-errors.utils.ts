/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { getErrorMessage } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

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
	path: string;
	message: string;
}

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
	fieldForPath: (path: string) => Path<T> | null;
	labelByPath?: Record<string, string>;
}

function describe(
	{ path, message }: ServerFieldError,
	labelByPath: Record<string, string> = {}
): string {
	if (!path) return message;

	return `${labelByPath[path] ?? path}: ${message}`;
}

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

export function notifyError(error: unknown): string {
	const message = getErrorMessage(error);

	return `${message.title}\n${message.description}`;
}
