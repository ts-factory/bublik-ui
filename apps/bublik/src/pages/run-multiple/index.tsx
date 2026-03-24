/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useMount } from 'react-use';
import { useSearchParams } from 'react-router-dom';
import { BooleanParam, useQueryParam } from 'use-query-params';

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
import { routes } from '@/router';
import { RunReportConfigsContainer } from '@/bublik/features/run-report';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';
import { useGetRunDetailsQuery, usePrefetch } from '@/services/bublik-api';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { NewBugContainer } from '@/bublik/features/log-preview-drawer';
import { LinkWithProject } from '@/bublik/features/projects';
import { BublikEmptyState } from '@/bublik/features/ui-state';

function useIsModeFull() {
	const [isModeFull, setIsModeFull] = useQueryParam('isModeFull', BooleanParam);
	return [isModeFull ?? false, setIsModeFull] as const;
}

function usePrefetchRunDetails(runIds: string[]) {
	const prefetchRunDetails = usePrefetch('getRunDetails');

	useMount(() => runIds.forEach((runId) => prefetchRunDetails(runId)));
}

function useRunStatsMultipleParams() {
	const [searchParams] = useSearchParams();
	const runIds = searchParams.getAll('runIds');
	const selectedRunId = searchParams.get('selected') ?? runIds[0];
	const [isModeFull] = useIsModeFull();

	function getSearchParams(runId: string) {
		const newParams = new URLSearchParams(searchParams);
		newParams.set('selected', runId);
		return newParams;
	}

	return { runIds, selectedRunId, isModeFull, getSearchParams };
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
		<div className="p-2 flex flex-col gap-1">
			<div className="flex gap-2 flex-col bg-white rounded-md">
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
	const { runIds, selectedRunId, getSearchParams } =
		useRunStatsMultipleParams();

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
							to={{
								pathname: '/multiple',
								search: getSearchParams(runId).toString()
							}}
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

	const link = new URL(window.location.href);
	link.searchParams.delete('rowState');

	const handleModeToggle = () => {
		trackEvent(analyticsEventNames.runMultipleModeToggle, {
			enabled: !isModeFull
		});

		setIsModeFull(!isModeFull);
	};

	return (
		<div className="flex h-full gap-3">
			<RunReportConfigsContainer runId={runId} />
			<LinkToSourceContainer runId={runId} />
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject
					to={routes.run({ runId })}
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
					to={routes.log({ runId })}
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
			<RunModeToggle
				isFullMode={isModeFull ?? false}
				onToggleClick={handleModeToggle}
			/>
			<NewBugContainer runId={Number(runId)} resultId={Number(runId)} />
			<CopyShortUrlButtonContainer />
		</div>
	);
}

export { RunMultiplePage };
