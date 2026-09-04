/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useParams } from 'react-router-dom';

import {
	ApplyRulesButton,
	RunIssuesTable
} from '@/bublik/features/result-classification';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { LinkWithProject } from '@/bublik/features/projects';
import { BublikEmptyState } from '@/bublik/features/ui-state';
import { routes } from '@/router';
import {
	ButtonTw,
	CardHeader,
	Icon,
	RunModeToggle,
	Separator
} from '@/shared/tailwind-ui';
import { RunPageParams } from '@/shared/types';

function RunIssuesHeader({ runId }: { runId: string }) {
	const [isFullMode, setIsFullMode] = useState(false);

	return (
		<header className="flex flex-col bg-white rounded shrink-0">
			<CardHeader label="Info">
				<div className="flex h-full gap-3">
					<RunModeToggle
						isFullMode={isFullMode}
						onToggleClick={() => setIsFullMode((prev) => !prev)}
					/>
					<Separator orientation="vertical" className="h-5 self-center" />
					<ButtonTw asChild variant="secondary" size="xss">
						<LinkWithProject to={routes.run({ runId })}>
							<Icon name="PieChart" size={16} className="mr-1.5" />
							Run
						</LinkWithProject>
					</ButtonTw>
					<ButtonTw asChild variant="secondary" size="xss">
						<LinkWithProject to={routes.log({ runId })}>
							<Icon name="BoxArrowRight" size={16} className="mr-1.5" />
							Log
						</LinkWithProject>
					</ButtonTw>
					<Separator orientation="vertical" className="h-5 self-center" />
					<CopyShortUrlButtonContainer />
				</div>
			</CardHeader>
			<RunDetailsContainer runId={runId} isFullMode={isFullMode} />
		</header>
	);
}

function RunIssuesPage() {
	const { runId } = useParams<RunPageParams>();
	const { data: details } = useGetRunDetailsQuery(
		runId ? Number(runId) : skipToken
	);

	if (!runId) {
		return <BublikEmptyState title="No data" description="Run ID is missing" />;
	}

	const projectId = details?.project_id;

	return (
		<div
			className="flex flex-col h-full gap-1 p-2"
			data-testid="run-issues-page"
		>
			<RunIssuesHeader runId={runId} />
			<div className="flex flex-col flex-1 min-h-0 bg-white rounded">
				<RunIssuesTable
					runId={runId}
					projectId={projectId}
					toolbarActions={
						<ApplyRulesButton runId={runId} projectId={projectId} />
					}
				/>
			</div>
		</div>
	);
}

export { RunIssuesPage };
