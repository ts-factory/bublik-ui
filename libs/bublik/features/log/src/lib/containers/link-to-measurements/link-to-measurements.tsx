/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { skipToken } from '@reduxjs/toolkit/query';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { MeasurementsMode } from '@/shared/types';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import {
	useGetResultInfoQuery,
	usePrefetchMeasurementsPage
} from '@/services/bublik-api';
import { TypedLinkWithProject } from '@/bublik/features/projects';

export interface LinkToMeasurementsProps {
	focusId?: string | number | null;
}

export interface LinkToMeasurementsComponentProps {
	runId: number;
	resultId: number;
	state: 'loading' | 'disabled' | 'default';
}

/** The "Result" button: the result's measurements page, `mode=default`. */
export const LinkToMeasurements = ({
	runId,
	resultId,
	state
}: LinkToMeasurementsComponentProps) => {
	return (
		<ButtonTw asChild variant="secondary" size="xss" state={state}>
			<TypedLinkWithProject
				to="/runs/$runId/results/$resultId/measurements"
				params={{ runId, resultId }}
				// Written explicitly, as `routes.measurements` did
				search={{ mode: MeasurementsMode.Default }}
				onClick={() => {
					trackEvent(analyticsEventNames.logLinkToMeasurementsClick, {
						source: 'log_toolbar'
					});
				}}
			>
				{state === 'loading' ? (
					<Icon name="ProgressIndicator" className="mr-1.5 animate-spin" />
				) : (
					<Icon name="BoxArrowRight" className="mr-1.5" />
				)}
				Result
			</TypedLinkWithProject>
		</ButtonTw>
	);
};

export const LinkToMeasurementsContainer = ({
	focusId
}: LinkToMeasurementsProps) => {
	const { data, isFetching, isError } = useGetResultInfoQuery(
		focusId ?? skipToken
	);

	const resultId = data?.result_id;
	const runId = data?.run_id;
	const hasMeasurements = data?.has_measurements;

	usePrefetchMeasurementsPage({ resultId: resultId?.toString() });

	if (resultId === undefined || runId === undefined) return;

	return (
		<LinkToMeasurements
			runId={runId}
			resultId={resultId}
			state={
				isFetching
					? 'loading'
					: isError || !hasMeasurements
					? 'disabled'
					: 'default'
			}
		/>
	);
};
