/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	HistoryMode,
	LogPageMode,
	MeasurementsMode,
	RunDataResults
} from '@/shared/types';
import { usePrefetch } from '@/services/bublik-api';
import { Icon } from '@/shared/tailwind-ui';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useUserPreferences } from '@/bublik/features/user-preferences';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';
import { TypedLinkWithProject } from '@/bublik/features/projects';

import { HistoryLinkContainer } from '@/bublik/features/history-link';

export interface ResultLinksProps {
	runId: number;
	resultId: number;
	result: RunDataResults;
	userPreferredHistoryMode?: HistoryMode;
	hasMeasurements?: boolean;
	onMeasurementLinkMouseEnter?: () => void;
	onLogLinkMouseEnter?: () => void;
	onLinkClick?: (action: string) => void;
	showLinkToRun?: boolean;
	path?: string;
}

export const ResultLinks = (props: ResultLinksProps) => {
	const {
		runId,
		resultId,
		hasMeasurements,
		result,
		userPreferredHistoryMode = 'linear',
		onLogLinkMouseEnter,
		onMeasurementLinkMouseEnter,
		onLinkClick,
		showLinkToRun = false,
		path
	} = props;

	return (
		<div className="flex flex-col justify-start gap-3 text-primary text-[0.6875rem] font-semibold leading-[0.875rem]">
			<ul className="flex flex-col items-start gap-3">
				{showLinkToRun ? (
					<li className="pl-2">
						<TypedLinkWithProject
							className="flex items-center w-full gap-1"
							to="/runs/$runId"
							params={{ runId }}
							// As `routes.run` wrote it: no key for a zero id
							search={{ targetIterationId: resultId || undefined }}
							onClick={() => onLinkClick?.('run')}
						>
							<Icon name="Paper" className="size-5" />
							Run {runId}
						</TypedLinkWithProject>
					</li>
				) : null}
				<li className="pl-2">
					<TypedLinkWithProject
						className="flex items-center w-full gap-1"
						onMouseEnter={onLogLinkMouseEnter}
						onClick={() => onLinkClick?.('log')}
						to="/log/$runId"
						params={{ runId }}
						// `routes.log`: the result focused, the full layout
						search={{
							focusId: resultId || undefined,
							mode: LogPageMode.TreeAndInfoAndLog
						}}
					>
						<Icon name="BoxArrowRight" className="grid place-items-center" />
						Log
					</TypedLinkWithProject>
				</li>
				<li className="pl-0.5">
					<HistoryLinkContainer
						runId={runId}
						result={result}
						userPreferredHistoryMode={userPreferredHistoryMode}
						path={path}
					/>
				</li>
				{hasMeasurements && (
					<li className="pl-2">
						<TypedLinkWithProject
							className="flex items-center gap-1"
							to="/runs/$runId/results/$resultId/measurements"
							params={{ runId, resultId }}
							// Written explicitly, as `routes.measurements` did
							search={{ mode: MeasurementsMode.Default }}
							onMouseEnter={onMeasurementLinkMouseEnter}
							onClick={() => onLinkClick?.('result')}
						>
							<Icon name="BoxArrowRight" className="grid place-items-center" />
							Result
						</TypedLinkWithProject>
					</li>
				)}
				<li className="pl-2">
					<LogPreviewContainer
						logName={result.name}
						resultId={resultId}
						runId={runId}
						measurementId={hasMeasurements ? resultId : undefined}
					>
						<button
							className="flex items-center w-full gap-1"
							onClick={() => onLinkClick?.('preview')}
						>
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
	runId: number;
	resultId: number;
	result: RunDataResults;
	showLinkToRun?: boolean;
	path?: string;
}

export const ResultLinksContainer = (props: ActionLinksProps) => {
	const { runId, resultId, result, showLinkToRun = false, path } = props;
	const { has_measurements: hasMeasurements } = result;
	const { userPreferences } = useUserPreferences();

	const prefetchLogURL = usePrefetch('getLogUrlByResultId');
	const prefetchMeasurements = usePrefetch('getSingleMeasurement');
	const prefetchResultInfo = usePrefetch('getResultInfo');

	const handleLogLinkMouseEnter = () => {
		prefetchLogURL(resultId);
		prefetchResultInfo(resultId);
	};

	const handleMeasurementLinkMouseEnter = () => {
		prefetchMeasurements(resultId);
		prefetchResultInfo(resultId);
	};

	const handleLinkClick = (action: string) => {
		trackEvent(analyticsEventNames.resultTableLinkClick, { action });
	};

	return (
		<ResultLinks
			resultId={resultId}
			runId={runId}
			result={result}
			userPreferredHistoryMode={userPreferences.history.defaultMode}
			hasMeasurements={hasMeasurements}
			onLogLinkMouseEnter={handleLogLinkMouseEnter}
			onMeasurementLinkMouseEnter={handleMeasurementLinkMouseEnter}
			showLinkToRun={showLinkToRun}
			path={path}
			onLinkClick={handleLinkClick}
		/>
	);
};
