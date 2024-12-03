/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useEffect } from 'react';
import { skipToken } from '@reduxjs/toolkit/dist/query';

import { formatTimeToDot } from '@/shared/utils';
import {
	ButtonTw,
	CardHeader,
	cn,
	getBugProps,
	NewBugButton,
	Resizable,
	resizableStyles
} from '@/shared/tailwind-ui';
import {
	useGetLogJsonQuery,
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';
import { RunReportConfigsContainer } from '@/bublik/features/run-report';

import {
	LinkToHistoryContainer,
	LinkToMeasurementsContainer,
	LinkToSourceContainer,
	LogPickerContainer,
	TreeContainer
} from './containers';
import { LinkToRun } from './components';
import { useIsLogLegacy, useLogPage } from './hooks';

function useLogTitle() {
	const { runId, focusId } = useLogPage();
	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);
	const { data: tree } = useGetTreeByRunIdQuery(runId ?? skipToken);

	useEffect(() => {
		if (!details) {
			document.title = 'Log - Bublik';
			return;
		}

		const { main_package: name, start } = details;
		const formattedTime = formatTimeToDot(start);
		const focusedTestName = focusId ? tree?.tree?.[focusId].name : '';

		document.title = `${
			focusedTestName ? `${focusedTestName} - ` : ''
		}${name} | ${formattedTime} | ${runId} | Log - Bublik`;
	}, [details, runId, focusId, tree?.tree]);
}

interface GetFetchOptions {
	runId?: number | string;
	focusId: number | null;
	page: string | null;
	isShowingRunLog: boolean;
}

function getFetchOptions({
	focusId,
	isShowingRunLog,
	runId,
	page
}: GetFetchOptions) {
	return isShowingRunLog
		? { id: runId! }
		: focusId
			? { id: focusId, page }
			: skipToken;
}

export interface LogFeatureProps {
	runId?: string;
	isTreeShown?: boolean;
	children?: ReactNode;
}

function LogFeature(props: LogFeatureProps) {
	useLogTitle();

	const { runId, children, isTreeShown } = props;
	const { isLegacyLog, toggleLog } = useIsLogLegacy();
	const { focusId, page } = useLogPage();

	if (!runId) return null;

	return (
		<>
			{isTreeShown && (
				<Resizable
					{...resizableStyles}
					className="flex overflow-visible"
					enable={{ right: true }}
					defaultSize={{ width: 325, height: '100%' }}
					minWidth={300}
					maxWidth={1000}
				>
					<TreeContainer runId={runId} />
				</Resizable>
			)}
			<div className="flex flex-col flex-grow h-full gap-1 overflow-hidden">
				{children}
				<main className="flex-grow bg-white rounded-md overflow-hidden">
					<CardHeader label="Log">
						<div className="flex items-center gap-2">
							<ButtonTw
								variant="secondary"
								state={isLegacyLog && 'active'}
								size="xss"
								onClick={toggleLog}
							>
								Legacy
							</ButtonTw>
							<LinkToRun runId={runId} />
							<LinkToHistoryContainer runId={runId} focusId={focusId} />
							<LinkToMeasurementsContainer focusId={focusId} />
							<RunReportConfigsContainer runId={runId} />
							<LinkToSourceContainer runId={runId} />
							<NewBug />
						</div>
					</CardHeader>
					<div
						className={cn(
							'overflow-auto relative h-full isolate',
							!isLegacyLog ? 'h-[calc(100%-36px)]' : 'h-[calc(100%-20px)]'
						)}
						key={`${runId}_${focusId}_${page}`}
					>
						<LogPickerContainer />
					</div>
				</main>
			</div>
		</>
	);
}

function NewBug() {
	const { focusId, isShowingRunLog, page, runId } = useLogPage();

	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);
	const { data: tree } = useGetTreeByRunIdQuery(runId ?? skipToken);
	const { data: log } = useGetLogJsonQuery(
		getFetchOptions({ runId, focusId, isShowingRunLog, page })
	);

	if (!details || !tree || !log || !runId) return null;

	return (
		<NewBugButton
			{...getBugProps({
				runId: Number(runId),
				id: focusId ?? Number(runId),
				log,
				tree,
				details
			})}
		/>
	);
}

export { LogFeature };
