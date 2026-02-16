/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useEffect, useRef } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useLocation } from 'react-router-dom';

import { formatTimeToDot } from '@/shared/utils';
import {
	ButtonTw,
	CardHeader,
	cn,
	Resizable,
	resizableStyles,
	ScrollToTop
} from '@/shared/tailwind-ui';
import {
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';
import { RunReportConfigsContainer } from '@/bublik/features/run-report';
import { LogAttachmentsContainer } from '@/bublik/features/log-artifacts';
import { NewBugContainer } from '@/bublik/features/log-preview-drawer';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

import {
	LinkToMeasurementsContainer,
	LogPickerContainer,
	TreeContainer
} from './containers';
import { HistoryLinkContainer } from '@/bublik/features/history-link';
import { LinkToRun } from './components';
import { useIsLogLegacy, useLogPage } from './hooks';
import { useLogSidebarState } from './sidebar';
import { LogSidebarMode } from '@/bublik/features/sidebar';

function useLogTitle() {
	const { runId, focusId } = useLogPage();
	const { data: details } = useGetRunDetailsQuery(runId ?? skipToken);
	const { data: tree } = useGetTreeByRunIdQuery(runId ?? skipToken);

	const formattedTime = details?.start ? formatTimeToDot(details.start) : '';
	const focusedTestName = focusId ? tree?.tree?.[focusId]?.name : '';

	useTabTitleWithPrefix([
		focusedTestName,
		details?.main_package,
		formattedTime,
		runId,
		'Log - Bublik'
	]);
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
	const { focusId, page, mode } = useLogPage();
	const location = useLocation();
	const { setLastVisited } = useLogSidebarState();

	useEffect(() => {
		if (runId) {
			const logMode: LogSidebarMode = (mode ||
				'treeAndinfoAndlog') as LogSidebarMode;
			setLastVisited(logMode, location.pathname + location.search, runId);
		}
	}, [runId, mode, location.pathname, location.search, setLastVisited]);

	const { node } = useGetTreeByRunIdQuery(runId ?? skipToken, {
		selectFromResult: (state) => ({
			node: !state.data || !focusId ? undefined : state.data.tree[focusId]
		})
	});

	const isTestNode = node?.entity === 'test';
	const validResultId = isTestNode && focusId ? Number(focusId) : undefined;
	const disableHistoryLink = !isTestNode;

	const containerRef = useRef<HTMLDivElement>(null);

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
								Legacy Log
							</ButtonTw>
							<LogAttachmentsContainer
								runId={Number(runId)}
								focusId={focusId}
							/>
							<LinkToRun runId={runId} targetIterationId={focusId} />
							<HistoryLinkContainer
								runId={Number(runId)}
								resultId={validResultId}
								disabled={disableHistoryLink}
								path={node?.path ?? undefined}
							/>
							<LinkToMeasurementsContainer focusId={focusId} />
							<RunReportConfigsContainer runId={runId} />
							<LinkToSourceContainer runId={runId} />
							<NewBugContainer
								key={`${runId}_${focusId}`}
								resultId={focusId ?? Number(runId)}
								runId={Number(runId)}
							/>
						</div>
					</CardHeader>
					<div
						className={cn(
							'overflow-auto relative h-full isolate',
							!isLegacyLog ? 'h-[calc(100%-36px)]' : 'h-[calc(100%-20px)]'
						)}
						ref={containerRef}
						key={`${runId}_${focusId}_${page}`}
					>
						<LogPickerContainer />
						<ScrollToTop
							className="fixed z-40 bottom-8 right-12"
							containerRef={containerRef}
						/>
					</div>
				</main>
			</div>
		</>
	);
}

export { LogFeature };
