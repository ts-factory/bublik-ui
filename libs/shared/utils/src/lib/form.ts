/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { z } from 'zod';

const ErrorSchema = z.object({
	type: z.string(),
	message: z.record(z.array(z.string()).or(z.string()))
});

const JustError = z.object({ message: z.string() });

const NewErrorSchema = z.object({
	messages: z.union([
		z.array(z.string()),
		z.record(z.array(z.string()).or(z.string()))
	])
});

const FormResponseSchema = z.union([
	z.object({
		status: z.string().or(z.number()),
		data: z.union([ErrorSchema, JustError])
	}),
	z.object({
		status: z.string().or(z.number()),
		data: NewErrorSchema
	})
]);

const StringErrorSchema = z.object({
	status: z.string().or(z.number()),
	data: z.string()
});

type SetErrorsOnFormConfig<TFieldValues extends FieldValues = FieldValues> = {
	handle: UseFormReturn<TFieldValues>;
	onSetError?: (
		key: Path<TFieldValues>,
		error: ReturnType<typeof getError>,
		handle: UseFormReturn<TFieldValues>
	) => void;
};

const getError = (e: string | string[]) => {
	const message = Array.isArray(e) ? e?.[0] : e;

	return { type: 'custom', message };
};

export const setErrorsOnForm = <TFieldValues extends FieldValues = FieldValues>(
	error: unknown,
	config: SetErrorsOnFormConfig<TFieldValues>
) => {
	const stringResult = StringErrorSchema.safeParse(error);
	if (stringResult.success) {
		config.handle.setError('root', getError(stringResult.data.data));
		return;
	}

	const formResult = FormResponseSchema.safeParse(error);
	if (!formResult.success) {
		if (
			typeof error === 'object' &&
			error &&
			'status' in error &&
			typeof error.status === 'number' &&
			error.status >= 500
		) {
			try {
				const jsonString = JSON.stringify(error, null, 2);
				config.handle.setError('root', { type: 'json', message: jsonString });
			} catch (e) {
				config.handle.setError('root', { message: 'Unknown error!' });
			}
			return;
		}
		config.handle.setError('root', { message: 'Unknown error!' });
		return;
	}

	const parsed = formResult.data;

	if ('message' in parsed.data && typeof parsed.data.message === 'string') {
		config.handle.setError('root', getError(parsed.data.message));
		return;
	}

	if ('messages' in parsed.data) {
		const messages = parsed.data.messages;

		if (Array.isArray(messages)) {
			config.handle.setError('root', getError(messages[0] || 'Unknown error!'));
			return;
		}

		Object.entries(messages).forEach(([key, error]) => {
			const formError = getError(error as string | string[]);

			config.handle.setError(key as Path<TFieldValues>, formError);
			config.onSetError?.(key as Path<TFieldValues>, formError, config.handle);
		});
		return;
	}

	if ('message' in parsed.data && typeof parsed.data.message === 'object') {
		Object.entries(parsed.data.message).forEach(([key, error]) => {
			const formError = getError(error as string | string[]);

			config.handle.setError(key as Path<TFieldValues>, formError);
			config.onSetError?.(key as Path<TFieldValues>, formError, config.handle);
		});
		return;
	}

	config.handle.setError('root', { message: 'Unknown error!' });
};
