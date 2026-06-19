/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useCallback, useMemo } from 'react';
import { useQueryParam, NumberParam, JsonParam } from 'use-query-params';
import { useSessionStorage } from 'react-use';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	bublikAPI,
	ConfigSchemaParams,
	ConfigSchemaParamsSchema,
	EditConfigBody
} from '@/services/bublik-api';
import { toast } from '@/shared/tailwind-ui';

function useConfigPageSearchParams() {
	const [configId, _setConfigId] = useQueryParam('configId', NumberParam);
	const [_newConfigParams, setNewConfigParams] =
		useQueryParam<ConfigSchemaParams | null>('new_config', JsonParam);

	function setConfigId(configId: number | null) {
		setNewConfigParams(null);
		_setConfigId(configId);
	}

	const newConfigParams = useMemo<ConfigSchemaParams>(() => {
		const parsedParams = ConfigSchemaParamsSchema.safeParse(_newConfigParams);

		if (!parsedParams.success) return { type: 'global', name: 'per_conf' };

		return ConfigSchemaParamsSchema.parse(parsedParams.data);
	}, [_newConfigParams]);

	return { configId, setConfigId, newConfigParams, setNewConfigParams };
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
