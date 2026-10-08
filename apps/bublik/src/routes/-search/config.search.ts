/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	defineSearch,
	json,
	keepRaw,
	num,
	validated,
	type InferSearch
} from '@/router';
import {
	ConfigSchemaParamsSchema,
	type ConfigSchemaParams
} from '@/services/bublik-api';

/**
 * `/admin/config`. `new_config` describes the config being
 * created. A value that is not JSON or that its zod schema rejects stays on
 * the URL as its raw string (`keepRaw`, pinned by
 * `admin-configs.feature`); a reader treats a string as "use the global
 * `per_conf` default".
 */
const configSearch = defineSearch(
	{
		configId: num(),
		new_config: keepRaw(
			validated(json<ConfigSchemaParams>(), ConfigSchemaParamsSchema)
		)
	},
	{ new_config: { type: 'global', name: 'per_conf' } }
);

type ConfigSearch = InferSearch<typeof configSearch>;

export { configSearch };
export type { ConfigSearch };
