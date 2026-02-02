/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useSearchParams } from 'react-router-dom';

import { RunsTableContainer } from '../runs-table';
import { RunsStatsContainer } from '../runs-stats';

export const RunsModePickerContainer = () => {
	const [searchParams] = useSearchParams();

	if (searchParams.get('mode') === 'table') return <RunsTableContainer />;

	if (searchParams.get('mode') === 'charts') return <RunsStatsContainer />;

	return <RunsTableContainer />;
};
