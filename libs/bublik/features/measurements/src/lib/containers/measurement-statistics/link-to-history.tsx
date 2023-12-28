/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { stringifySearch } from '@/router';

import {
	useGetHistoryLinkDefaultsQuery,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import { buildQuery } from '@/shared/utils';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';

export interface LinkToHistoryProps {
	runId: string;
	resultId: string;
}

export const LinkToHistory: FC<LinkToHistoryProps> = ({ runId, resultId }) => {
	const { data, isFetching, isError } =
		useGetHistoryLinkDefaultsQuery(resultId);
	const { data: runDetails } = useGetRunDetailsQuery(runId);

	const query = useMemo<string>(() => {
		if (!data || !runDetails) return '';

		const query = buildQuery({ result: data, runDetails });

		return stringifySearch(query);
	}, [data, runDetails]);

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
