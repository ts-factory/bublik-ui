/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';
import { getRouteApi } from '@tanstack/react-router';

import { routes } from '@/router';

import {
	ApplyRulesButton,
	RunIssuesTable
} from '@/bublik/features/result-classification';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';
import { LinkWithProject } from '@/bublik/features/projects';
import { LogPreviewContainer } from '@/bublik/features/log-preview-drawer';
import {
	ButtonTw,
	CardHeader,
	Icon,
	RunModeToggle,
	Separator
} from '@/shared/tailwind-ui';

function RunIssuesHeader({ runId }: { runId: number }) {
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
							<Icon name="BoxArrowRight" className="mr-1.5 size-5" />
							Run
						</LinkWithProject>
					</ButtonTw>
					<ButtonTw asChild variant="secondary" size="xss">
						<LinkWithProject to={routes.log({ runId })}>
							<Icon name="BoxArrowRight" className="mr-1.5 size-5" />
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

const runIssuesRoute = getRouteApi('/_app/runs/$runId/issues');

function RunIssuesPage() {
	const { runId } = runIssuesRoute.useParams();
	const { data: details } = useGetRunDetailsQuery(runId);

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
					renderResultPreview={(result, resultRunId) => (
						<LogPreviewContainer
							logName={result.name}
							runId={Number(resultRunId)}
							resultId={result.result_id}
							measurementId={
								result.has_measurements ? result.result_id : undefined
							}
						>
							<ButtonTw variant="secondary" size="xss">
								<Icon name="ExpandSelection" size={20} className="mr-1" />
								Preview
							</ButtonTw>
						</LogPreviewContainer>
					)}
				/>
			</div>
		</div>
	);
}

export { RunIssuesPage };
