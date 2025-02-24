/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/dist/query';

import {
	useGetResultInfoQuery,
	usePrefetchMeasurementsPage
} from '@/services/bublik-api';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { routes } from '@/router';
import { MeasurementsMode } from '@/shared/types';

export interface LinkToMeasurementsProps {
	focusId?: string | number | null;
}

export const LinkToMeasurementsContainer: FC<LinkToMeasurementsProps> = ({
	focusId
}) => {
	const { data, isFetching, isError } = useGetResultInfoQuery(
		focusId ?? skipToken
	);

	const resultId = data?.result?.result_id?.toString();
	const runId = data?.result?.run_id;
	const hasMeasurements = data?.result?.has_measurements;

	usePrefetchMeasurementsPage({ resultId });

	if (!resultId || !runId) return;

	return (
		<ButtonTw
			asChild
			variant="secondary"
			size="xss"
			state={
				isFetching
					? 'loading'
					: isError || !hasMeasurements
					? 'disabled'
					: 'default'
			}
		>
			<Link
				to={routes.measurements({
					resultId,
					runId,
					mode: MeasurementsMode.Default
				})}
			>
				{isFetching ? (
					<Icon name="ProgressIndicator" className="mr-1.5 animate-spin" />
				) : (
					<Icon name="BoxArrowRight" className="mr-1.5" />
				)}
				Result
			</Link>
		</ButtonTw>
	);
};
