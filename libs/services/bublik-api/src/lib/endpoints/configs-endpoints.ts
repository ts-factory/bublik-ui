/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';
import { z } from 'zod';

const ConfigParamsSchema = z.object({ id: z.number() });

type ConfigParams = z.infer<typeof ConfigParamsSchema>;

export const ConfigTypeSchema = z.enum(['global', 'report']);

const CreateConfigBodySchema = z.object({
	type: ConfigTypeSchema,
	name: z.string().min(1),
	description: z.string(),
	is_active: z.boolean(),
	content: z.any()
});

export const ConfigSchemaParamsSchema = z
	.object({
		type: ConfigTypeSchema,
		name: z.string().min(1)
	})
	.or(
		z.object({
			type: ConfigTypeSchema
		})
	);

export type ConfigSchemaParams = z.infer<typeof ConfigSchemaParamsSchema>;

type CreateConfigParams = z.infer<typeof CreateConfigBodySchema>;

const EditConfigBodySchema = z.object({
	description: z.string().min(1),
	content: z.string().min(1),
	is_active: z.boolean()
});

const EditConfigByIdParamsSchema = z.object({
	id: z.number(),
	body: EditConfigBodySchema
});

type EditConfigByIdParams = z.infer<typeof EditConfigByIdParamsSchema>;

const ConfigListResponseSchema = z.object({
	id: z.number(),
	type: ConfigTypeSchema,
	name: z.string(),
	description: z.string(),
	is_active: z.boolean(),
	created: z.string(),
	version: z.number()
});

export type ConfigItem = z.infer<typeof ConfigListResponseSchema>;

const ConfigSchema = z.object({
	created: z.string(),
	type: ConfigTypeSchema,
	name: z.string(),
	id: z.number(),
	version: z.number(),
	is_active: z.boolean(),
	description: z.string(),
	user: z.number(),
	content: z.record(z.unknown())
});

type Config = z.infer<typeof ConfigSchema>;

const ConfigVersionSchema = z.object({
	type: ConfigTypeSchema,
	name: z.string(),
	all_config_versions: z.array(
		z.object({
			id: z.number(),
			is_active: z.boolean(),
			description: z.string(),
			created: z.string(),
			version: z.number()
		})
	)
});

export type ConfigVersionResponse = z.infer<typeof ConfigVersionSchema>;

export const configsEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getListOfConfigs: build.query<ConfigItem[], void>({
			query: () => ({ url: withApiV2('/config'), cache: 'no-cache' }),
			providesTags: [BUBLIK_TAG.Config]
		}),
		getConfigById: build.query<Config, ConfigParams>({
			query: (params) => ({
				url: withApiV2(`/config/${params.id}`),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Config]
		}),
		getConfigSchema: build.query<Record<string, unknown>, ConfigSchemaParams>({
			query: (params) => ({
				url: withApiV2(
					`/config/schema/?${new URLSearchParams(
						Object.entries(params)
					).toString()}`,
					true
				)
			}),
			providesTags: [BUBLIK_TAG.Config]
		}),
		getAllVersionsOfConfigById: build.query<
			ConfigVersionResponse,
			ConfigParams
		>({
			query: (params) => ({
				url: withApiV2(`/config/${params.id}/all_versions`),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Config]
		}),
		createConfig: build.mutation<Config, CreateConfigParams>({
			query: (params) => ({
				url: withApiV2('/config'),
				method: 'POST',
				body: params
			}),
			invalidatesTags: [BUBLIK_TAG.Config]
		}),
		editConfigById: build.mutation<Config, EditConfigByIdParams>({
			query: (params) => ({
				url: withApiV2(`/config/${params.id}`),
				body: params.body,
				method: 'PATCH'
			}),
			invalidatesTags: [BUBLIK_TAG.Config]
		}),
		deleteConfigById: build.mutation<void, number>({
			query: (configId) => ({
				url: withApiV2(`/config/${configId}`),
				method: 'DELETE'
			}),
			invalidatesTags: [BUBLIK_TAG.Config]
		}),
		markConfigAsCurrent: build.mutation<Config, ConfigParams>({
			query: (params) => ({
				url: withApiV2(`/config/${params.id}/change_status`),
				method: 'PATCH'
			}),
			invalidatesTags: [BUBLIK_TAG.Config]
		}),
		migrateGlobalConfig: build.mutation<Config, void>({
			query: () => ({
				url: withApiV2(`/config/create_by_per_conf`),
				method: 'POST'
			}),
			invalidatesTags: [BUBLIK_TAG.Config]
		})
	})
};
