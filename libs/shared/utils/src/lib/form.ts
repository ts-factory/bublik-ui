/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { z } from 'zod';

const ErrorSchema = z.object({
	type: z.string(),
	message: z.record(z.array(z.string()).or(z.string()))
});

const JustError = z.object({ message: z.string() });

const FormResponseSchema = z.object({
	status: z.string().or(z.number()),
	data: z.union([ErrorSchema, JustError])
});

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
	if (
		typeof error === 'object' &&
		error &&
		'status' in error &&
		Number(error.status) >= 500
	) {
		try {
			const jsonString = JSON.stringify(error, null, 2);
			config.handle.setError('root', { type: 'json', message: jsonString });
		} catch (e) {
			config.handle.setError('root', { message: 'Unknown error!' });
		}
		return;
	}

	if (StringErrorSchema.safeParse(error).success) {
		const parsedError = error as z.infer<typeof StringErrorSchema>;

		config.handle.setError('root', getError(parsedError.data));
		return;
	}

	try {
		const parsed = FormResponseSchema.parse(error);

		if (typeof parsed.data.message === 'string') {
			config.handle.setError('root', { message: parsed.data.message });
			return;
		}

		Object.entries(parsed.data.message).forEach(([key, error]) => {
			const formError = getError(error);

			config.handle.setError(key as Path<TFieldValues>, formError);
			config.onSetError?.(key as Path<TFieldValues>, formError, config.handle);
		});
	} catch (e: unknown) {
		config.handle.setError('root', { message: 'Unknown error!' });
	}
};
