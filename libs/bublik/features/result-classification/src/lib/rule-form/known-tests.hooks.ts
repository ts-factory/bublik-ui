/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';

import { useGetIssueRulesQuery } from '@/services/bublik-api';
import type { TestOption } from '@/shared/types';

const ALL = 10000;

export function useKnownTests(projectId?: number): {
	options: TestOption[];
	isLoading: boolean;
} {
	const { data, isFetching } = useGetIssueRulesQuery({
		projectId,
		page: 1,
		pageSize: ALL
	});

	const options = useMemo(() => {
		const byId = new Map<number, string>();

		data?.results.forEach((rule) => {
			if (rule.test == null) return;

			byId.set(rule.test, rule.test_name ?? `#${rule.test}`);
		});

		return [...byId]
			.map(([id, name]) => ({ id, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [data]);

	return { options, isLoading: isFetching };
}
