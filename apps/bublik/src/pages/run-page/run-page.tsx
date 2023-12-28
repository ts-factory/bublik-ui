/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { RunPageParams } from '@/shared/types';
import { useCopyToClipboard } from '@/shared/hooks';
import { routes } from '@/router';
import {
	RunModeToggle,
	CardHeader,
	ScrollToTopPage,
	toast,
	Icon,
	Tooltip,
	ButtonTw
} from '@/shared/tailwind-ui';
import { DiffFormContainer } from '@/bublik/features/run-diff';
import { DefineCompromiseContainer } from '@/bublik/features/compromised-form';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import { RunTableContainer } from '@/bublik/features/run';
import { usePrefetchLogPage } from '@/services/bublik-api';
import { useAuth } from '@/bublik/features/auth';

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
	const { isLoading, isAdmin } = useAuth();

	const handleCopyRunId = () => copy(runId);

	return (
		<header className="flex flex-col bg-white rounded min-h-[260px]">
			<CardHeader label="Info">
				<div className="flex h-full gap-3">
					{isLoading ? null : (
						<>
							<RunModeToggle
								isFullMode={isModeFull}
								onToggleClick={() => setIsModeFull(!isModeFull)}
							/>
							<Tooltip content="Copy identifier for comparison">
								<ButtonTw
									variant="secondary"
									size="xss"
									onClick={handleCopyRunId}
								>
									<Icon
										name="PaperStack"
										size={16}
										className="mr-1 text-primary"
									/>
									Copy ID
								</ButtonTw>
							</Tooltip>
							<DiffFormContainer defaultValues={{ leftRunId: Number(runId) }} />
							{isAdmin ? <DefineCompromiseContainer runId={runId} /> : null}
							<LinkToSourceContainer runId={runId} />
							<ButtonTw asChild variant="secondary" size="xss">
								<Link to={routes.log({ runId })}>
									<Icon name="BoxArrowRight" className="mr-1.5" />
									Log
								</Link>
							</ButtonTw>
						</>
					)}
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
