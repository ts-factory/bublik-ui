/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { z } from 'zod';

/**
 * An MCP server a user registered for their own chat runs, as the API is
 * willing to describe it. Header values are write-only: the server stores
 * them encrypted and only ever reports their names.
 */
export const McpServerSchema = z.object({
	id: z.number(),
	name: z.string(),
	/** Derived from the name; prefixes every tool the server exposes. */
	slug: z.string(),
	url: z.string(),
	enabled: z.boolean(),
	header_names: z.array(z.string()),
	created: z.string(),
	updated: z.string()
});

export type McpServer = z.infer<typeof McpServerSchema>;

export interface CreateMcpServerInputs {
	name: string;
	url: string;
	enabled?: boolean;
	/** The full header mapping. */
	headers: Record<string, string>;
}

/**
 * `headers` is merged on the server: a string sets that header, `null`
 * removes it, and headers not mentioned keep their stored value.
 */
export interface UpdateMcpServerInputs {
	id: number;
	body: {
		name?: string;
		url?: string;
		enabled?: boolean;
		headers?: Record<string, string | null>;
	};
}
