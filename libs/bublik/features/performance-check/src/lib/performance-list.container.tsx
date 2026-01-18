/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { useGetPerformanceTimeoutsQuery } from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';

import {
	PerformanceList,
	PerformanceListEmpty,
	PerformanceListError,
	PerformanceListLoading
} from './performance-list.component';

function PerformanceListContainer() {
	const { projectIds } = useProjectSearch();
	const { data, isLoading, error } = useGetPerformanceTimeoutsQuery(
		{ projects: projectIds },
		{ refetchOnMountOrArgChange: true }
	);

	if (isLoading) return <PerformanceListLoading />;

	if (error) return <PerformanceListError error={error} />;

	if (!data || !data.length) return <PerformanceListEmpty />;

	return <PerformanceList urls={data} />;
}

export { PerformanceListContainer };
