/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetImportEventLogQuery } from '@/services/bublik-api';
import { ImportTaskRow } from '@/shared/types';

const ACTIVE_IMPORTS_PAGE_SIZE = 20;
const ACTIVE_POLLING_INTERVAL_MS = 5000;
const IDLE_POLLING_INTERVAL_MS = 15000;

interface UseActiveImportsOptions {
	enabled: boolean;
}

interface UseActiveImportsResult {
	imports: ImportTaskRow[];
	total: number;
}

function byStartedAtDesc(a: ImportTaskRow, b: ImportTaskRow): number {
	return (b.started_at ?? '').localeCompare(a.started_at ?? '');
}

function useActiveImports({
	enabled
}: UseActiveImportsOptions): UseActiveImportsResult {
	const [hasActive, setHasActive] = useState(false);
	const options = {
		pollingInterval: hasActive
			? ACTIVE_POLLING_INTERVAL_MS
			: IDLE_POLLING_INTERVAL_MS,
		skipPollingIfUnfocused: true
	};

	const { data: running } = useGetImportEventLogQuery(
		enabled
			? { status: 'RUNNING', page_size: ACTIVE_IMPORTS_PAGE_SIZE }
			: skipToken,
		options
	);
	const { data: queued } = useGetImportEventLogQuery(
		enabled
			? { status: 'RECEIVED', page_size: ACTIVE_IMPORTS_PAGE_SIZE }
			: skipToken,
		options
	);

	const total = enabled
		? (running?.pagination.count ?? 0) + (queued?.pagination.count ?? 0)
		: 0;

	useEffect(() => setHasActive(total > 0), [total]);

	const imports = useMemo(() => {
		if (!enabled) return [];

		return [
			...[...(running?.results ?? [])].sort(byStartedAtDesc),
			...[...(queued?.results ?? [])].sort(byStartedAtDesc)
		];
	}, [enabled, running, queued]);

	return { imports, total };
}

export { useActiveImports };
export type { UseActiveImportsOptions, UseActiveImportsResult };
