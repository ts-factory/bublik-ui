/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useMount } from 'react-use';
import { getRouteApi } from '@tanstack/react-router';

import { useSearchWriter } from '@/router';
import { LogPageMode } from '@/shared/types';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import {
	RunTableContainer,
	GlobalRequirementsProvider
} from '@/bublik/features/run';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import {
	ButtonTw,
	CardHeader,
	Icon,
	RunModeToggle
} from '@/shared/tailwind-ui';
import { RunReportConfigsContainer } from '@/bublik/features/run-report';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';
import { useGetRunDetailsQuery, usePrefetch } from '@/services/bublik-api';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { NewBugContainer } from '@/bublik/features/log-preview-drawer';
import { LinkWithProject } from '@/bublik/features/projects';
import { BublikEmptyState } from '@/bublik/features/ui-state';

const multipleRoute = getRouteApi('/_app/_runs/multiple');

const NO_RUN_IDS: string[] = [];

/**
 * The run details mode (`isModeFull`, `1`/`0`, compact by default) and its
 * setter, a replace that merges as use-query-params' `replaceIn` did.
 */
function useIsModeFull() {
	const isModeFull = multipleRoute.useSearch({
		select: (search): boolean => search.isModeFull ?? false
	});
	const writeSearch = useSearchWriter();
	const setIsModeFull = useCallback(
		(enabled: boolean) => writeSearch({ isModeFull: enabled }),
		[writeSearch]
	);

	return [isModeFull, setIsModeFull] as const;
}

function usePrefetchRunDetails(runIds: string[]) {
	const prefetchRunDetails = usePrefetch('getRunDetails');

	useMount(() => runIds.forEach((runId) => prefetchRunDetails(runId)));
}

/** The pinned runs (`runIds`, repeated) and the one shown (`selected`, else the first). */
function useRunStatsMultipleParams() {
	const runIds = multipleRoute.useSearch({
		select: (search): string[] => search.runIds ?? NO_RUN_IDS
	});
	const selected = multipleRoute.useSearch({
		select: (search): string | null => search.selected ?? null
	});
	const selectedRunId = selected ?? runIds[0];
	const [isModeFull] = useIsModeFull();

	return { runIds, selectedRunId, isModeFull };
}

function RunMultiplePage() {
	const { runIds, selectedRunId, isModeFull } = useRunStatsMultipleParams();

	usePrefetchRunDetails(runIds);

	if (!runIds.length) {
		return (
			<BublikEmptyState title="No data" description="Run IDs are missing" />
		);
	}

	return (
		<div className="p-2 flex flex-col gap-1" data-testid="run-multiple-page">
			<div className="flex gap-2 flex-col bg-bg-primary rounded-md">
				<CardHeader label={<RunDetailsHeaderLabel />}>
					<RunHeaderDetails runId={selectedRunId} />
				</CardHeader>
				{runIds.map((runId) =>
					selectedRunId === runId ? (
						<RunDetailsContainer
							key={runId}
							runId={runId}
							isFullMode={isModeFull}
						/>
					) : null
				)}
			</div>
			<GlobalRequirementsProvider>
				<RunTableContainer runId={runIds} />
			</GlobalRequirementsProvider>
		</div>
	);
}

function RunDetailsHeaderLabel() {
	const { runIds, selectedRunId } = useRunStatsMultipleParams();

	const handleRunSelect = (runId: string) => {
		trackEvent(analyticsEventNames.runMultipleSelectedRunChange, {
			fromRunId: selectedRunId,
			toRunId: runId
		});
	};

	return (
		<div className="flex items-center gap-4">
			<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
				Runs
			</span>
			<div className="flex items-center gap-1">
				{runIds.map((runId) => (
					<ButtonTw
						key={runId}
						variant="secondary"
						size="xss"
						rounded="md"
						state={selectedRunId === runId ? 'active' : 'default'}
						asChild
					>
						<LinkWithProject
							to="/multiple"
							// Every key of the page kept, `selected` set in place
							search={(prev) => ({ ...prev, selected: runId })}
							onClick={() => handleRunSelect(runId)}
							replace
						>
							<Icon name="Paper" className="size-5 mr-1.5" />
							<span>Run {runId}</span>
						</LinkWithProject>
					</ButtonTw>
				))}
			</div>
		</div>
	);
}

interface RunHeaderDetailsProps {
	runId: string;
}

function RunHeaderDetails({ runId }: RunHeaderDetailsProps) {
	const { data } = useGetRunDetailsQuery(runId);
	const [isModeFull, setIsModeFull] = useIsModeFull();

	if (!data) return null;

	const handleModeToggle = () => {
		trackEvent(analyticsEventNames.runMultipleModeToggle, {
			enabled: !isModeFull
		});

		setIsModeFull(!isModeFull);
	};

	return (
		<div className="flex h-full gap-3">
			<RunReportConfigsContainer runId={data.id} />
			<LinkToSourceContainer runId={runId} />
			<RunMultipleNavigationLinks runId={data.id} />
			<RunModeToggle isFullMode={isModeFull} onToggleClick={handleModeToggle} />
			<NewBugContainer runId={data.id} resultId={data.id} />
			<CopyShortUrlButtonContainer />
		</div>
	);
}

interface RunMultipleNavigationLinksProps {
	runId: number;
}

/** The selected run's own page and its log (as `routes.run`/`routes.log` wrote them). */
function RunMultipleNavigationLinks({
	runId
}: RunMultipleNavigationLinksProps) {
	return (
		<>
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject
					to="/runs/$runId"
					params={{ runId }}
					onClick={() => {
						trackEvent(analyticsEventNames.runMultipleNavigationClick, {
							action: 'run'
						});
					}}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</LinkWithProject>
			</ButtonTw>
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject
					to="/log/$runId"
					params={{ runId }}
					search={{ mode: LogPageMode.TreeAndInfoAndLog }}
					onClick={() => {
						trackEvent(analyticsEventNames.runMultipleNavigationClick, {
							action: 'log'
						});
					}}
				>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</LinkWithProject>
			</ButtonTw>
		</>
	);
}

export {
	RunDetailsHeaderLabel,
	RunMultipleNavigationLinks,
	RunMultiplePage,
	useIsModeFull
};
