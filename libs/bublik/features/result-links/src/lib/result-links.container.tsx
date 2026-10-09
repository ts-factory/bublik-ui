/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import {
	HistoryMode,
	LogPageMode,
	MeasurementsMode,
	RunDataResults
} from '@/shared/types';
import { usePrefetch } from '@/services/bublik-api';
import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useUserPreferences } from '@/bublik/features/user-preferences';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';
import { TypedLinkWithProject } from '@/bublik/features/projects';

import {
	HistoryLinkContainer,
	HistoryLinkIssue
} from '@/bublik/features/history-link';
import { historyLinkIssues } from '@/bublik/features/result-classification';

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
	historyIssues?: HistoryLinkIssue[];
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
		path,
		historyIssues
	} = props;

	// Every link is the button the History link is, so they all answer a
	// hover the same way and stand the same height; the extra-small button
	// is as tall as the result badge's line, which keeps the first link
	// level with the test name and the badge across the row.
	return (
		<div className="flex flex-col justify-start gap-3 text-primary text-[0.6875rem] font-semibold leading-[0.875rem]">
			<ul className="flex flex-col items-start gap-2 pl-0.5">
				{showLinkToRun ? (
					<li>
						<ButtonTw variant="secondary" size="xss" asChild>
							<TypedLinkWithProject
								className="gap-1"
								to="/runs/$runId"
								params={{ runId }}
								// As `routes.run` wrote it: no key for a zero id
								search={{ targetIterationId: resultId || undefined }}
								onClick={() => onLinkClick?.('run')}
							>
								<Icon name="Paper" className="size-5" />
								Run {runId}
							</TypedLinkWithProject>
						</ButtonTw>
					</li>
				) : null}
				<li>
					<ButtonTw variant="secondary" size="xss" asChild>
						<TypedLinkWithProject
							className="gap-1"
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
					</ButtonTw>
				</li>
				<li>
					<HistoryLinkContainer
						runId={runId}
						result={result}
						runTags={result.run_tags}
						userPreferredHistoryMode={userPreferredHistoryMode}
						path={path}
						issues={historyIssues}
					/>
				</li>
				{hasMeasurements && (
					<li>
						<ButtonTw variant="secondary" size="xss" asChild>
							<TypedLinkWithProject
								className="gap-1"
								to="/runs/$runId/results/$resultId/measurements"
								params={{ runId, resultId }}
								// Written explicitly, as `routes.measurements` did
								search={{ mode: MeasurementsMode.Default }}
								onMouseEnter={onMeasurementLinkMouseEnter}
								onClick={() => onLinkClick?.('result')}
							>
								<Icon
									name="BoxArrowRight"
									className="grid place-items-center"
								/>
								Result
							</TypedLinkWithProject>
						</ButtonTw>
					</li>
				)}
				<li>
					<LogPreviewContainer
						logName={result.name}
						resultId={resultId}
						runId={runId}
						measurementId={hasMeasurements ? resultId : undefined}
					>
						<ButtonTw
							variant="secondary"
							size="xss"
							className="gap-1"
							onClick={() => onLinkClick?.('preview')}
						>
							<Icon
								name="ExpandSelection"
								size={20}
								className="grid place-items-center"
							/>
							<span>Preview</span>
						</ButtonTw>
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
	historyIssues?: HistoryLinkIssue[];
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

	const historyIssues = useMemo(
		() => historyLinkIssues(result.issues),
		[result.issues]
	);

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
			historyIssues={historyIssues}
		/>
	);
};
