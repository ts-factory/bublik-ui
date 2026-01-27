/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { skipToken } from '@reduxjs/toolkit/query';

import { MeasurementsMode } from '@/shared/types';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { routes } from '@/router';
import {
	useGetResultInfoQuery,
	usePrefetchMeasurementsPage
} from '@/services/bublik-api';
import { LinkWithProject } from '@/bublik/features/projects';

export interface LinkToMeasurementsProps {
	focusId?: string | number | null;
}

export const LinkToMeasurementsContainer = ({
	focusId
}: LinkToMeasurementsProps) => {
	const { data, isFetching, isError } = useGetResultInfoQuery(
		focusId ?? skipToken
	);

	const resultId = data?.result_id?.toString();
	const runId = data?.run_id;
	const hasMeasurements = data?.has_measurements;

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
			<LinkWithProject
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
			</LinkWithProject>
		</ButtonTw>
	);
};
