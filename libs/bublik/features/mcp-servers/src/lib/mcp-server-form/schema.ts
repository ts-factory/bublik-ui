/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { z } from 'zod';

/** RFC 7230 `token`: what a header field name may consist of. */
const HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

const HeaderRowSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, 'Header name is required')
			.regex(HEADER_NAME_PATTERN, 'Invalid header name'),
		value: z
			.string()
			.refine((value) => !/[\r\n]/.test(value), 'No line breaks allowed'),
		existing: z.boolean()
	})
	.refine((row) => row.existing || row.value.length > 0, {
		message: 'Value is required',
		path: ['value']
	});

export const McpServerFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1, 'Name must be provided!')
			.max(64, 'Name must be 64 characters or fewer'),
		url: z
			.string()
			.trim()
			.min(1, 'URL must be provided!')
			.refine(
				(url) => /^https?:\/\/\S+$/i.test(url),
				'URL must start with http:// or https://'
			),
		headers: z.array(HeaderRowSchema)
	})
	.superRefine((values, ctx) => {
		const seen = new Set<string>();

		values.headers.forEach((row, index) => {
			const key = row.name.trim().toLowerCase();

			if (seen.has(key)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'Header is given more than once',
					path: ['headers', index, 'name']
				});
			}

			seen.add(key);
		});
	});

export type McpServerFormValues = z.infer<typeof McpServerFormSchema>;
