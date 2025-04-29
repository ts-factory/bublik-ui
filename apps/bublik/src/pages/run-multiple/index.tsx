import { Link, useSearchParams } from 'react-router-dom';
import { BooleanParam, useQueryParam } from 'use-query-params';
import { useMount } from 'react-use';

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

	if (!runIds.length) return <div>No run ids found!</div>;

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
						<Link
							to={{
								pathname: '/multiple',
								search: getSearchParams(runId).toString()
							}}
							replace
						>
							<Icon name="Paper" className="size-5 mr-1.5" />
							<span>Run {runId}</span>
						</Link>
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

	return (
		<div className="flex h-full gap-3">
			<RunReportConfigsContainer runId={runId} />
			<LinkToSourceContainer runId={runId} />
			<ButtonTw asChild variant="secondary" size="xss">
				<Link to={routes.run({ runId })}>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</Link>
			</ButtonTw>
			<ButtonTw asChild variant="secondary" size="xss">
				<Link to={routes.log({ runId })}>
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</Link>
			</ButtonTw>
			<RunModeToggle
				isFullMode={isModeFull ?? false}
				onToggleClick={() => setIsModeFull(!isModeFull)}
			/>
			<NewBugContainer runId={Number(runId)} resultId={Number(runId)} />
			<CopyShortUrlButtonContainer />
		</div>
	);
}

export { RunMultiplePage };
