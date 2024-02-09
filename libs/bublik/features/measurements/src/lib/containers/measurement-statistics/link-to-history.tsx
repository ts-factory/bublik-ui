/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { stringifySearch } from '@/router';

import {
	useGetHistoryLinkDefaultsQuery,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import { buildQuery } from '@/shared/utils';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { useUserPreferences } from '@/bublik/features/user-preferences';

export interface LinkToHistoryProps {
	runId: string;
	resultId: string;
}

export const LinkToHistory = ({ runId, resultId }: LinkToHistoryProps) => {
	const { data, isFetching, isError } =
		useGetHistoryLinkDefaultsQuery(resultId);
	const { data: runDetails } = useGetRunDetailsQuery(runId);
	const { userPreferences } = useUserPreferences();

	const query = useMemo<string>(() => {
		if (!data || !runDetails) return '';

		const query = buildQuery({ result: data, runDetails });
		const search = new URLSearchParams(stringifySearch(query));
		search.set('mode', userPreferences.history.defaultMode);

		return search.toString();
	}, [data, runDetails, userPreferences.history.defaultMode]);

	const to = { pathname: `/history`, search: query };

	return (
		<ButtonTw
			variant="secondary"
			size="xss"
			state={isFetching ? 'loading' : isError ? 'disabled' : 'default'}
			asChild
		>
			<Link to={to}>
				{isFetching ? (
					<Icon name="ProgressIndicator" className="animate-spin mr-1.5" />
				) : (
					<Icon name="BoxArrowRight" className="mr-1.5" />
				)}
				History
			</Link>
		</ButtonTw>
	);
};
