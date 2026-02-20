/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import { DefineCompromiseContainer } from '@/bublik/features/compromised-form';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';
import {
	GlobalRequirementsProvider,
	RunTableContainer,
	useRunSidebarState
} from '@/bublik/features/run';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import { DiffFormContainer } from '@/bublik/features/run-diff';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { routes } from '@/router';
import { usePrefetchLogPage } from '@/services/bublik-api';
import {
	ButtonTw,
	CardHeader,
	Icon,
	RunModeToggle,
	ScrollToTopPage
} from '@/shared/tailwind-ui';
import { RunPageParams } from '@/shared/types';
import { RunReportConfigsContainer } from '@/bublik/features/run-report';
import { NewBugContainer } from '@/bublik/features/log-preview-drawer';
import { LinkWithProject } from '@/bublik/features/projects';
import { BublikEmptyState } from '@/bublik/features/ui-state';

export interface RunHeaderProps {
	runId: string;
}

const RunHeader = ({ runId }: RunHeaderProps) => {
	const [isModeFull, setIsModeFull] = useState(false);

	const link = new URL(window.location.href);
	link.searchParams.delete('rowState');

	return (
		<header className="flex flex-col bg-white rounded">
			<CardHeader label="Info">
				<div className="flex h-full gap-3">
					<RunModeToggle
						isFullMode={isModeFull}
						onToggleClick={() => setIsModeFull(!isModeFull)}
					/>
					<DefineCompromiseContainer runId={runId} />
					<DiffFormContainer defaultValues={{ leftRunId: runId }} />
					<RunReportConfigsContainer runId={runId} />
					<LinkToSourceContainer runId={runId} />
					<ButtonTw asChild variant="secondary" size="xss">
						<LinkWithProject to={routes.log({ runId })}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Log
						</LinkWithProject>
					</ButtonTw>
					<NewBugContainer runId={Number(runId)} resultId={Number(runId)} />
					<CopyShortUrlButtonContainer />
				</div>
			</CardHeader>
			<RunDetailsContainer runId={runId} isFullMode={isModeFull} />
		</header>
	);
};

export const RunPage = () => {
	const { runId } = useParams<RunPageParams>();
	const location = useLocation();
	const { setLastVisited } = useRunSidebarState();
	usePrefetchLogPage({ runId });

	useEffect(() => {
		if (runId) {
			setLastVisited('details', location.pathname + location.search, runId);
		}
	}, [runId, location.pathname, location.search, setLastVisited]);

	if (!runId) {
		return <BublikEmptyState title="No data" description="Run ID is missing" />;
	}

	return (
		<div className="flex flex-col gap-1 p-2">
			<RunHeader runId={runId} />
			<GlobalRequirementsProvider>
				<RunTableContainer runId={runId} />
			</GlobalRequirementsProvider>
			<ScrollToTopPage offset={158} />
		</div>
	);
};
