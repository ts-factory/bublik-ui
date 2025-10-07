/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { memo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { routes } from '@/router';
import { usePrefetchImmediately } from '@/services/bublik-api';
import {
	ButtonTw,
	cn,
	ErrorPage,
	Icon,
	ScrollToTopPage
} from '@/shared/tailwind-ui';
import { LinkToSourceContainer } from '@/bublik/features/link-to-source';
import { RunDetailsContainer } from '@/bublik/features/run-details';
import {
	RunDetailsDiffContainer,
	RunDiffContainer
} from '@/bublik/features/run-diff';
import {
	LinkWithProject,
	useTabTitleWithPrefix
} from '@/bublik/features/projects';

export interface RunDiffHeaderProps {
	leftRunId: string;
	rightRunId: string;
}

const RunDiffHeader = memo(({ leftRunId, rightRunId }: RunDiffHeaderProps) => {
	const [selected, setSelected] = useState<'left' | 'right' | 'diff' | null>(
		null
	);

	usePrefetchImmediately('getRunDetails', rightRunId);
	usePrefetchImmediately('getRunDetails', leftRunId);
	usePrefetchImmediately('getRunTableByRunId', {
		runId: leftRunId
	});
	usePrefetchImmediately('getRunTableByRunId', {
		runId: rightRunId
	});
	usePrefetchImmediately('getRunSource', leftRunId);
	usePrefetchImmediately('getRunSource', rightRunId);

	const handleExpandClick = (leftOrRight: 'left' | 'right' | 'diff') => () =>
		selected === leftOrRight ? setSelected(null) : setSelected(leftOrRight);

	return (
		<header className="flex flex-col mb-1 bg-white rounded min-h-[260px]">
			<div className="flex justify-between border-b border-border-primary h-9">
				<div className="flex items-center gap-4 px-4 border-r border-border-primary">
					<ButtonTw size="xss" asChild variant="secondary">
						<LinkWithProject to={routes.run({ runId: leftRunId })}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Run
						</LinkWithProject>
					</ButtonTw>
					<ButtonTw size="xss" asChild variant="secondary">
						<LinkWithProject to={routes.log({ runId: leftRunId })}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Log
						</LinkWithProject>
					</ButtonTw>
					<LinkToSourceContainer runId={leftRunId} />
				</div>
				<div className="flex items-center gap-4 px-4 border-l border-r border-border-primary">
					<ButtonTw
						variant="secondary"
						state={selected === 'left' && 'active'}
						size="xss"
						onClick={handleExpandClick('left')}
					>
						Left Full Info
					</ButtonTw>
					<ButtonTw
						variant="secondary"
						state={selected === 'diff' && 'active'}
						size="xss"
						onClick={handleExpandClick('diff')}
					>
						Info Diff
					</ButtonTw>
					<ButtonTw
						variant="secondary"
						state={selected === 'right' && 'active'}
						size="xss"
						onClick={handleExpandClick('right')}
					>
						Right Full Info
					</ButtonTw>
				</div>
				<div className="flex items-center gap-4 px-4 border-l border-border-primary">
					<ButtonTw variant="secondary" size="xss" asChild>
						<LinkWithProject to={routes.run({ runId: rightRunId })}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Run
						</LinkWithProject>
					</ButtonTw>
					<ButtonTw variant="secondary" size="xss" asChild>
						<LinkWithProject to={routes.log({ runId: rightRunId })}>
							<Icon name="BoxArrowRight" className="mr-1.5" />
							Log
						</LinkWithProject>
					</ButtonTw>
					<LinkToSourceContainer runId={rightRunId} />
				</div>
			</div>
			<div
				className={cn(
					selected == null ? 'grid grid-cols-2 flex-grow' : 'flex flex-grow'
				)}
			>
				{selected === 'left' || selected == null ? (
					<div className="flex flex-1 border-r border-border-primary">
						<RunDetailsContainer
							runId={leftRunId}
							isFullMode={selected === 'left'}
						/>
					</div>
				) : null}
				{selected === 'right' || selected == null ? (
					<div className="flex flex-1">
						<RunDetailsContainer
							runId={rightRunId}
							isFullMode={selected === 'right'}
						/>
					</div>
				) : null}
				{selected === 'diff' ? (
					<RunDetailsDiffContainer
						leftRunId={leftRunId}
						rightRunId={rightRunId}
					/>
				) : null}
			</div>
		</header>
	);
});

export const RunDiffPage = () => {
	const [searchParams] = useSearchParams();

	const leftRunId = searchParams.get('left');
	const rightRunId = searchParams.get('right');

	useTabTitleWithPrefix(`Diff - ${leftRunId} | ${rightRunId} - Bublik`);

	if (!leftRunId || !rightRunId) {
		return (
			<ErrorPage
				label="No selected runs"
				message="You need to select two runs for comparison"
				actions={
					<ButtonTw
						asChild
						variant="primary"
						size="md"
						rounded="lg"
						className="w-full py-2.5"
					>
						<LinkWithProject to="/runs">Go to runs</LinkWithProject>
					</ButtonTw>
				}
			/>
		);
	}

	return (
		<div className="p-2">
			<RunDiffHeader leftRunId={leftRunId} rightRunId={rightRunId} />
			<RunDiffContainer leftRunId={leftRunId} rightRunId={rightRunId} />
			<ScrollToTopPage offset={158} />
		</div>
	);
};
