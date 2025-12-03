/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	HistoryMode,
	RunDataResults,
	RunDetailsAPIResponse
} from '@/shared/types';
import { useGetRunDetailsQuery, usePrefetch } from '@/services/bublik-api';
import { routes } from '@/router';
import { Icon } from '@/shared/tailwind-ui';
import { useUserPreferences } from '@/bublik/features/user-preferences';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';
import { LinkWithProject } from '@/bublik/features/projects';

import { LinkToHistory } from './link-to-history';

export interface ResultLinksProps {
	runId: string;
	resultId: number;
	result: RunDataResults;
	runInfo: RunDetailsAPIResponse;
	userPreferredHistoryMode?: HistoryMode;
	hasMeasurements?: boolean;
	onMeasurementLinkMouseEnter?: () => void;
	onLogLinkMouseEnter?: () => void;
	showLinkToRun?: boolean;
}

export const ResultLinks = (props: ResultLinksProps) => {
	const {
		runId,
		resultId,
		hasMeasurements,
		result,
		runInfo,
		userPreferredHistoryMode = 'linear',
		onLogLinkMouseEnter,
		onMeasurementLinkMouseEnter,
		showLinkToRun = false
	} = props;

	return (
		<div className="flex flex-col justify-start gap-3 text-primary text-[0.6875rem] font-semibold leading-[0.875rem]">
			<ul className="flex flex-col items-start gap-3">
				{showLinkToRun ? (
					<li className="pl-2">
						<LinkWithProject
							className="flex items-center w-full gap-1"
							to={routes.run({ runId, targetIterationId: resultId })}
						>
							<Icon name="Paper" className="size-5" />
							Run {runId}
						</LinkWithProject>
					</li>
				) : null}
				<li className="pl-2">
					<LinkWithProject
						className="flex items-center w-full gap-1"
						onMouseEnter={onLogLinkMouseEnter}
						to={routes.log({ runId, focusId: resultId })}
					>
						<Icon name="BoxArrowRight" className="grid place-items-center" />
						Log
					</LinkWithProject>
				</li>
				<li className="pl-0.5">
					<LinkToHistory
						result={result}
						runDetails={runInfo}
						userPreferredHistoryMode={userPreferredHistoryMode}
					/>
				</li>
				{hasMeasurements && (
					<li className="pl-2">
						<LinkWithProject
							className="flex items-center gap-1"
							to={routes.measurements({ runId, resultId })}
							onMouseEnter={onMeasurementLinkMouseEnter}
						>
							<Icon name="BoxArrowRight" className="grid place-items-center" />
							Result
						</LinkWithProject>
					</li>
				)}
				<li className="pl-2">
					<LogPreviewContainer
						logName={result.name}
						resultId={resultId}
						runId={Number(runId)}
						measurementId={hasMeasurements ? Number(resultId) : undefined}
					>
						<button className="flex items-center w-full gap-1">
							<Icon
								name="ExpandSelection"
								size={20}
								className="grid place-items-center"
							/>
							<span>Preview</span>
						</button>
					</LogPreviewContainer>
				</li>
			</ul>
		</div>
	);
};

export interface ActionLinksProps {
	runId: string;
	resultId: number;
	result: RunDataResults;
	showLinkToRun?: boolean;
}

export const ResultLinksContainer = (props: ActionLinksProps) => {
	const { runId, resultId, result, showLinkToRun = false } = props;
	const { has_measurements: hasMeasurements } = result;
	const { data: runInfo } = useGetRunDetailsQuery(runId);
	const { userPreferences } = useUserPreferences();

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
			userPreferredHistoryMode={userPreferences.history.defaultMode}
			hasMeasurements={hasMeasurements}
			onLogLinkMouseEnter={handleLogLinkMouseEnter}
			onMeasurementLinkMouseEnter={handleMeasurementLinkMouseEnter}
			showLinkToRun={showLinkToRun}
		/>
	);
};
