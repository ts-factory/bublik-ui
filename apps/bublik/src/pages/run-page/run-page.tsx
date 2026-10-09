/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { DefineCompromiseContainer } from '@/bublik/features/compromised-form';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';
import {
	GlobalRequirementsProvider,
	RunTableContainer
} from '@/bublik/features/run';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import {
	ApplyRulesButton,
	ResultSelectionProvider,
	RunIssuesButton
} from '@/bublik/features/result-classification';
import { DiffFormContainer } from '@/bublik/features/run-diff';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { usePrefetchLogPage } from '@/services/bublik-api';
import {
	ButtonTw,
	CardHeader,
	Icon,
	RunModeToggle,
	ScrollToTopPage,
	Separator
} from '@/shared/tailwind-ui';
import { LogPageMode } from '@/shared/types';
import { RunReportConfigsContainer } from '@/bublik/features/run-report';
import { NewBugContainer } from '@/bublik/features/log-preview-drawer';
import { LinkWithProject } from '@/bublik/features/projects';
const runRoute = getRouteApi('/_app/runs/$runId/');

interface RunLinkProps {
	runId: number;
}

/** The log of the whole run, in the full layout (as `routes.log` wrote it). */
function RunLogLink({ runId }: RunLinkProps) {
	return (
		<ButtonTw asChild variant="secondary" size="xss">
			<LinkWithProject
				to="/log/$runId"
				params={{ runId }}
				search={{ mode: LogPageMode.TreeAndInfoAndLog }}
				onClick={() => {
					trackEvent(analyticsEventNames.runOpenLogClick, {
						source: 'header'
					});
				}}
			>
				<Icon name="BoxArrowRight" className="mr-1.5" />
				Log
			</LinkWithProject>
		</ButtonTw>
	);
}

export interface RunHeaderProps {
	runId: number;
}

const RunHeader = ({ runId }: RunHeaderProps) => {
	const [isModeFull, setIsModeFull] = useState(false);

	const handleModeToggle = () => {
		trackEvent(analyticsEventNames.runModeToggle, {
			enabled: !isModeFull
		});

		setIsModeFull((prev) => !prev);
	};

	return (
		<header className="flex flex-col bg-bg-primary rounded">
			<CardHeader label="Info">
				<div className="flex h-full gap-3">
					<RunModeToggle
						isFullMode={isModeFull}
						onToggleClick={handleModeToggle}
					/>
					<Separator orientation="vertical" className="h-5 self-center" />
					<DiffFormContainer defaultValues={{ leftRunId: String(runId) }} />
					<RunReportConfigsContainer runId={runId} />
					<LinkToSourceContainer runId={runId} />
					<RunLogLink runId={runId} />
					<Separator orientation="vertical" className="h-5 self-center" />
					<DefineCompromiseContainer runId={runId} />
					<NewBugContainer runId={runId} resultId={runId} />
					<RunIssuesButton runId={runId} />
					<ApplyRulesButton runId={runId} />
					<Separator orientation="vertical" className="h-5 self-center" />
					<CopyShortUrlButtonContainer />
				</div>
			</CardHeader>
			<RunDetailsContainer runId={runId} isFullMode={isModeFull} />
		</header>
	);
};

export const RunPage = () => {
	const { runId } = runRoute.useParams();
	usePrefetchLogPage({ runId });

	return (
		<div className="flex flex-col gap-1 p-2">
			<RunHeader runId={runId} />
			<GlobalRequirementsProvider>
				{/* One selection across every open result table, so results of
				    several tests go into one bulk classification. */}
				<ResultSelectionProvider>
					{/* The run table, shared with /multiple, takes the ids as strings */}
					<RunTableContainer runId={String(runId)} />
				</ResultSelectionProvider>
			</GlobalRequirementsProvider>
			<ScrollToTopPage offset={158} />
		</div>
	);
};

export { RunLogLink };
