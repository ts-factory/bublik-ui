/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { z } from 'zod';

const HttpErrorSchema = z.object({
	status: z.number(),
	data: z.unknown()
});

export type BublikHttpError = z.infer<typeof HttpErrorSchema>;

const FetchErrorSchema = z.object({
	status: z.literal('FETCH_ERROR'),
	data: z.unknown(),
	error: z.string()
});

export type BublikFetchError = z.infer<typeof FetchErrorSchema>;

const ParsingErrorSchema = z.object({
	status: z.literal('PARSING_ERROR'),
	originalStatus: z.number(),
	data: z.unknown(),
	error: z.string()
});

export type BublikParsingError = z.infer<typeof ParsingErrorSchema>;

const TimeoutErrorSchema = z.object({
	status: z.literal('TIMEOUT_ERROR'),
	error: z.string(),
	data: z.unknown()
});

const ValidationErrorSchema = z.object({
	status: z.number(),
	data: z.object({
		type: z.literal('ValidationError'),
		message: z.record(z.array(z.string()))
	})
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export type BublikTimeoutError = z.infer<typeof TimeoutErrorSchema>;

const CustomErrorSchema = z.object({
	status: z.literal('CUSTOM_ERROR'),
	data: z.unknown(),
	error: z.string()
});

export type BublikCustomError = z.infer<typeof CustomErrorSchema>;

const BublikApiCustomErrorSchema = z.object({
	status: z.number(),
	data: z.object({
		type: z.string(),
		message: z.string()
	})
});

const BublikAPISimpleErrorSchema = z.object({
	status: z.number(),
	data: z.object({ message: z.string() })
});

export type BublikAPISimpleError = z.infer<typeof BublikAPISimpleErrorSchema>;

const BublikApiAuthError = z.union([
	z.object({ status: z.number(), data: z.object({ message: z.string() }) }),
	z.object({
		status: z.number(),
		data: z.object({ message: z.string(), error: z.string() })
	})
]);

export type BublikBublikApiCustomError = z.infer<
	typeof BublikApiCustomErrorSchema
>;

const BublikErrorSchema = z.object({
	status: z.string().or(z.number()),
	title: z.string(),
	description: z.string()
});

export type BublikError = z.infer<typeof BublikErrorSchema>;

const HistoryParsingErrorSchema = z.object({
	status: z.string().or(z.number()),
	data: z.object({
		type: z.literal('ParseException'),
		message: z.array(z.string())
	})
});

export const BublikParsableErrorSchema = z.union([
	HttpErrorSchema,
	FetchErrorSchema,
	ParsingErrorSchema,
	TimeoutErrorSchema,
	CustomErrorSchema,
	BublikApiCustomErrorSchema,
	BublikErrorSchema,
	BublikApiAuthError,
	HistoryParsingErrorSchema,
	ValidationErrorSchema,
	BublikAPISimpleErrorSchema
]);

export const isHistoryParsingError = (
	error: unknown
): error is z.infer<typeof HistoryParsingErrorSchema> => {
	return HistoryParsingErrorSchema.safeParse(error).success;
};

export const isValidationError = (
	error: unknown
): error is z.infer<typeof ValidationErrorSchema> => {
	return ValidationErrorSchema.safeParse(error).success;
};

export const isBublikAuthError = (
	error: unknown
): error is z.infer<typeof BublikApiAuthError> => {
	return BublikApiAuthError.safeParse(error).success;
};

export const isBublikError = (
	error: unknown
): error is z.infer<typeof BublikErrorSchema> => {
	return BublikErrorSchema.safeParse(error).success;
};

export const isBublikApiSimpleError = (
	error: unknown
): error is z.infer<typeof BublikAPISimpleErrorSchema> => {
	return BublikAPISimpleErrorSchema.safeParse(error).success;
};

export const isHttpError = (
	error: unknown
): error is z.infer<typeof HttpErrorSchema> => {
	return HttpErrorSchema.safeParse(error).success;
};

export const isFetchError = (
	error: unknown
): error is z.infer<typeof FetchErrorSchema> => {
	return FetchErrorSchema.safeParse(error).success;
};

export const isParsingError = (
	error: unknown
): error is z.infer<typeof ParsingErrorSchema> => {
	return ParsingErrorSchema.safeParse(error).success;
};

export const isTimeoutError = (
	error: unknown
): error is z.infer<typeof TimeoutErrorSchema> => {
	return TimeoutErrorSchema.safeParse(error).success;
};

export const isCustomError = (
	error: unknown
): error is z.infer<typeof CustomErrorSchema> => {
	return CustomErrorSchema.safeParse(error).success;
};

export const isBublikApiCustomError = (
	error: unknown
): error is z.infer<typeof BublikApiCustomErrorSchema> => {
	return BublikApiCustomErrorSchema.safeParse(error).success;
};

export const isBublikParsableError = (
	error: unknown
): error is z.infer<typeof BublikParsableErrorSchema> => {
	return BublikParsableErrorSchema.safeParse(error).success;
};
