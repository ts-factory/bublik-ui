/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';

import { useGetIssueRulesQuery } from '@/services/bublik-api';
import type { TestOption } from '@/shared/types';

/**
 * The largest page the API will serve — `DefaultPageNumberPagination.
 * max_page_size` is 10000. Asked for in one request rather than walked, because
 * this is a stopgap and a paging loop would outlive it.
 */
const ALL = 10000;

/**
 * Tests the client can both name **and** identify.
 *
 * `IssueRule.test` is a mandatory FK, so authoring a rule needs a test id — and
 * no endpoint returns one. `/history/test_search_options` returns bare strings
 * (`HistoryService.get_test_search_options`), which name a test without
 * identifying it. What *does* carry both is `/issue_rules/`: every rule
 * serializes `test` and `test_name` side by side.
 *
 * So this reads the rule list and folds it into the picker's options. The
 * consequence is honest and worth stating in the UI: a test that has never been
 * ruled on anywhere cannot be picked, because nothing has ever told this client
 * its id.
 *
 * **[needs backend]** `GET /api/v2/tests/picker/?search=&project=` returning
 * `[{id, name}]`, mirroring `IssuePickerViewSet`. When it lands, this hook is
 * the only thing that changes — `TestPicker` takes options and does not care
 * where they came from.
 */
export function useKnownTests(projectId?: number): {
	options: TestOption[];
	isLoading: boolean;
} {
	// Deliberately its own request rather than a read of whatever page a table
	// happens to hold: the picker must offer every known test, not the hundred
	// the user is currently looking at.
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
