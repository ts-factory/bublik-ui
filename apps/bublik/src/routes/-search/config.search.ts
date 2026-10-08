/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { defineSearch, json, num, validated, type InferSearch } from '@/router';
import {
	ConfigSchemaParamsSchema,
	type ConfigSchemaParams
} from '@/services/bublik-api';

/**
 * `/admin/config`. `new_config` describes the config being
 * created; a value its zod schema rejects reads as absent, so the page sees
 * the global `per_conf` default without the URL being rewritten.
 */
const configSearch = defineSearch(
	{
		configId: num(),
		new_config: validated(json<ConfigSchemaParams>(), ConfigSchemaParamsSchema)
	},
	{ new_config: { type: 'global', name: 'per_conf' } }
);

type ConfigSearch = InferSearch<typeof configSearch>;

export { configSearch };
export type { ConfigSearch };
