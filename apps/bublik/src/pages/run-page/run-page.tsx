/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { DefineCompromiseContainer } from '@/bublik/features/compromised-form';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';
import { RunTableContainer } from '@/bublik/features/run';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import { DiffFormContainer } from '@/bublik/features/run-diff';
import { routes } from '@/router';
import { usePrefetchLogPage } from '@/services/bublik-api';
import { useCopyToClipboard } from '@/shared/hooks';
import {
	ButtonTw,
	CardHeader,
	Icon,
	RunModeToggle,
	ScrollToTopPage,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import { RunPageParams } from '@/shared/types';
import { RunReportConfigsContainer } from '@/bublik/features/run-report';

export interface RunHeaderProps {
	runId: string;
}

const RunHeader = ({ runId }: RunHeaderProps) => {
	const [isModeFull, setIsModeFull] = useState(false);
	const [, copy] = useCopyToClipboard({
		onSuccess: () =>
			toast.success('Copied run ID to clipboard', { position: 'top-center' }),
		onError: () =>
			toast.error('Failed to copy run ID', { position: 'top-center' })
	});

	const handleCopyRunId = () => copy(runId);

	return (
		<header className="flex flex-col bg-white rounded min-h-[260px]">
			<CardHeader label="Info">
				<div className="flex h-full gap-3">
					<RunModeToggle
						isFullMode={isModeFull}
						onToggleClick={() => setIsModeFull(!isModeFull)}
					/>
					<Tooltip content="Copy identifier for comparison">
						<ButtonTw variant="secondary" size="xss" onClick={handleCopyRunId}>
							<Icon name="PaperStack" size={16} className="mr-1 text-primary" />
							Copy ID
						</ButtonTw>
					</Tooltip>
					<DiffFormContainer defaultValues={{ leftRunId: Number(runId) }} />
					<RunReportConfigsContainer runId={runId} />
					<DefineCompromiseContainer runId={runId} />
					<LinkToSourceContainer runId={runId} />
					<ButtonTw asChild variant="secondary" size="xss">
						<Link to={routes.log({ runId })}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Log
						</Link>
					</ButtonTw>
				</div>
			</CardHeader>
			<RunDetailsContainer runId={runId} isFullMode={isModeFull} />
		</header>
	);
};

export const RunPage = () => {
	const { runId } = useParams<RunPageParams>();
	usePrefetchLogPage({ runId });

	if (!runId) return <div>No run ID!</div>;

	return (
		<div className="flex flex-col gap-1 p-2">
			<RunHeader runId={runId} />
			<RunTableContainer runId={runId} />
			<ScrollToTopPage offset={158} />
		</div>
	);
};
