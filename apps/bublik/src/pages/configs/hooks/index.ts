/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useCallback, useMemo } from 'react';
import { useSessionStorage } from 'react-use';
import { skipToken } from '@reduxjs/toolkit/query';
import { getRouteApi } from '@tanstack/react-router';

import { useSearchWriter } from '@/router';

import {
	bublikAPI,
	ConfigSchemaParams,
	ConfigSchemaParamsSchema,
	EditConfigBody
} from '@/services/bublik-api';
import { toast } from '@/shared/tailwind-ui';

import { DEFAULT_NEW_CONFIG } from '../../../routes/-search/config.search';

const configRoute = getRouteApi('/_app/admin/config');

/**
 * What the create screen is opened with: `new_config` once its schema
 * accepts it (unknown keys stripped), else the global `per_conf` default. A
 * string is a value that was not JSON or that the schema rejected, kept on the
 * URL verbatim (`keepRaw`).
 */
function readNewConfig(value: ConfigSchemaParams | string | undefined) {
	const parsed = ConfigSchemaParamsSchema.safeParse(value);

	return parsed.success ? parsed.data : DEFAULT_NEW_CONFIG;
}

/**
 * The config page's URL state. Every write replaces the entry
 * and keeps the other keys, as use-query-params' `replaceIn` did.
 */
function useConfigPageSearchParams() {
	const write = useSearchWriter();
	const configId = configRoute.useSearch({ select: (s) => s.configId });
	const rawNewConfig = configRoute.useSearch({ select: (s) => s.new_config });
	const newConfigParams = useMemo<ConfigSchemaParams>(
		() => readNewConfig(rawNewConfig),
		[rawNewConfig]
	);

	/** Opens a config (or the create screen for `null`), dropping `new_config` in the same write. */
	const setConfigId = useCallback(
		(id: number | null) =>
			write({ new_config: undefined, configId: id ?? undefined }),
		[write]
	);

	/**
	 * Opens the create screen for `params`, dropping `configId` in the same
	 * write. `new_config` keeps its place when it was on the URL, as the
	 * `setConfigId(null)` + `setNewConfigParams` pair this replaces left it.
	 */
	const openNewConfig = useCallback(
		(params: ConfigSchemaParams) =>
			write({ configId: undefined, new_config: params }),
		[write]
	);

	return { configId, setConfigId, newConfigParams, openNewConfig };
}

function useSavedState(key: string) {
	const [savedValue, setSavedValue] = useSessionStorage<string | undefined>(
		key
	);

	const clearSavedValue = useCallback(() => {
		// react-use's useSessionStorage exposes no dedicated remove; setting the
		// value to undefined makes subsequent reads fall back to the default.
		setSavedValue(undefined);
		// Also remove it synchronously: callers often clear right before the
		// component unmounts (after a save/create that navigates away), so the
		// internal write-on-render effect would never flush the cleared state.
		try {
			window.sessionStorage.removeItem(key);
		} catch {
			// Ignore: storage may be unavailable (private mode / disabled).
		}
	}, [key, setSavedValue]);

	return { savedValue, setSavedValue, clearSavedValue };
}

function useConfigById(configId: number) {
	const configQuery = bublikAPI.useGetConfigByIdQuery({ id: configId });
	const versionsQuery = bublikAPI.useGetAllVersionsOfConfigByIdQuery({
		id: configId
	});
	const schemaQuery = bublikAPI.useGetConfigSchemaQuery(
		configQuery.data
			? { name: configQuery.data.name, type: configQuery.data.type }
			: skipToken
	);
	const [deleteMutation] = bublikAPI.useDeleteConfigByIdMutation();
	const [editMutation] = bublikAPI.useEditConfigByIdMutation();

	async function deleteConfig(id: number) {
		const promise = deleteMutation(id).unwrap();
		toast.promise(promise, {
			success: 'Succesfully deleted config',
			error: 'Failed to delete config',
			loading: 'Deleting config...'
		});
	}

	function updateConfig(params: EditConfigBody) {
		const promise = editMutation({ id: configId, body: params }).unwrap();

		toast.promise(promise, {
			success: 'Succesfully updated config',
			loading: 'Updating config...'
		});

		return promise;
	}

	function markAsCurrent(params: EditConfigBody) {
		const promise = editMutation({ id: configId, body: params }).unwrap();
		toast.promise(promise, {
			success: 'Succesfully activated config',
			error: 'Failed to activate config',
			loading: 'Activating config...'
		});
	}

	return {
		isLoading:
			configQuery.isLoading || versionsQuery.isLoading || schemaQuery.isLoading,
		error: configQuery.error || versionsQuery.error || schemaQuery.error,
		isFetching:
			configQuery.isFetching ||
			versionsQuery.isFetching ||
			schemaQuery.isFetching,
		config: configQuery.data,
		versions: versionsQuery.data,
		schema: schemaQuery.data,
		deleteConfig,
		updateConfig,
		markAsCurrent
	};
}

export { useConfigPageSearchParams, useSavedState, useConfigById };
