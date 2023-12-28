/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useSearchParams } from 'react-router-dom';

import { RunsTableContainer } from '../runs-table';
import { RunsStatsContainer } from '../runs-stats';

export const RunsModePickerContainer = () => {
	const [searchParams] = useSearchParams();

	if (searchParams.get('mode') === 'table') return <RunsTableContainer />;

	if (searchParams.get('mode') === 'charts') return <RunsStatsContainer />;

	return <RunsTableContainer />;
};
