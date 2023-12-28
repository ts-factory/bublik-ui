/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { Link } from 'react-router-dom';

import { DetailsAPIResponse, RunDataResults } from '@/shared/types';
import { useGetRunDetailsQuery, usePrefetch } from '@/services/bublik-api';
import { routes } from '@/router';
import { Icon } from '@/shared/tailwind-ui';

import { LinkToHistory } from './link-to-history';

export interface ResultLinksProps {
	runId: string;
	resultId: number;
	result: RunDataResults;
	runInfo: DetailsAPIResponse;
	hasMeasurements?: boolean;
	onMeasurementLinkMouseEnter?: () => void;
	onLogLinkMouseEnter?: () => void;
}

export const ResultLinks = (props: ResultLinksProps) => {
	const {
		runId,
		resultId,
		hasMeasurements,
		result,
		runInfo,
		onLogLinkMouseEnter,
		onMeasurementLinkMouseEnter
	} = props;

	return (
		<div className="flex flex-col justify-start gap-3 text-primary text-[0.6875rem] font-semibold leading-[0.875rem]">
			<ul className="flex flex-col items-start gap-3">
				<li className="pl-2">
					<Link
						className="flex items-center w-full gap-1"
						onMouseEnter={onLogLinkMouseEnter}
						to={routes.log({ runId, focusId: resultId })}
					>
						<Icon name="BoxArrowRight" className="grid place-items-center" />
						Log
					</Link>
				</li>
				<li className="pl-2">
					<LinkToHistory result={result} runDetails={runInfo} />
				</li>
				{hasMeasurements && (
					<li className="pl-2">
						<Link
							className="flex items-center gap-1"
							to={routes.measurements({ runId, resultId })}
							onMouseEnter={onMeasurementLinkMouseEnter}
						>
							<Icon name="BoxArrowRight" className="grid place-items-center" />
							Measure
						</Link>
					</li>
				)}
			</ul>
		</div>
	);
};

export interface ActionLinksProps {
	runId: string;
	resultId: number;
	result: RunDataResults;
}

export const ResultLinksContainer: FC<ActionLinksProps> = ({
	runId,
	resultId,
	result
}) => {
	const { has_measurements: hasMeasurements } = result;
	const { data: runInfo } = useGetRunDetailsQuery(runId);

	const prefetchLogURL = usePrefetch('getLogUrlByResultId');
	const prefetchHistory = usePrefetch('getHistoryLinkDefaults');
	const prefetchMeasurements = usePrefetch('getSingleMeasurement');
	const prefetchMeasurementsHeader = usePrefetch('getResultInfo');

	const handleLogLinkMouseEnter = () => {
		prefetchLogURL(resultId);
		prefetchHistory(resultId);
	};

	const handleMeasurementLinkMouseEnter = () => {
		prefetchMeasurements(resultId);
		prefetchMeasurementsHeader(resultId);
	};

	if (!runInfo) return null;

	return (
		<ResultLinks
			resultId={resultId}
			runId={runId}
			runInfo={runInfo}
			result={result}
			hasMeasurements={hasMeasurements}
			onLogLinkMouseEnter={handleLogLinkMouseEnter}
			onMeasurementLinkMouseEnter={handleMeasurementLinkMouseEnter}
		/>
	);
};
