/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMemo } from 'react';
import { useRouter, type ParsedLocation } from '@tanstack/react-router';

import { joinTo } from '@/router';

interface RunsSelectionUrls {
	/** `/compare?left=…&right=…`, for exactly two selected runs. */
	compareUrl: string | null;
	/** `/multiple?runIds=…&runIds=…`, for two selected runs or more. */
	multipleUrl: string | null;
}

/** A built location as a basepath-free URL (its `href` carries the basepath). */
const urlOf = ({ pathname, searchStr }: ParsedLocation): string =>
	joinTo({ to: pathname, search: searchStr });

/**
 * Where the selected runs open side by side, as basepath-free URLs: the
 * targets are typed against the route tree and the router writes their query
 * strings through the `/compare` and `/multiple` codecs (`left`/`right` raw,
 * `runIds` one key per id), in selection order.
 */
function useRunsSelectionUrls(selectedRunIds: string[]): RunsSelectionUrls {
	const router = useRouter();

	return useMemo(() => {
		const [left, right] = selectedRunIds;

		return {
			compareUrl:
				selectedRunIds.length === 2
					? urlOf(
							router.buildLocation({ to: '/compare', search: { left, right } })
					  )
					: null,
			multipleUrl:
				selectedRunIds.length >= 2
					? urlOf(
							router.buildLocation({
								to: '/multiple',
								search: { runIds: selectedRunIds }
							})
					  )
					: null
		};
	}, [router, selectedRunIds]);
}

export { useRunsSelectionUrls };
export type { RunsSelectionUrls };
