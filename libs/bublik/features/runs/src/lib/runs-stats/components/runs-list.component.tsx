/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps } from 'react';

import { useGetRunDetailsQuery } from '@/services/bublik-api';
import {
	cn,
	Dialog,
	getRunStatusInfo,
	Icon,
	ModalContent,
	Skeleton
} from '@/shared/tailwind-ui';
import { parseDetailDate } from '@/shared/utils';

import { useRunsStats } from '../runs-stats.hooks';
import { RunLinks } from '../../runs-table/columns';

interface RunsListModal {
	open: ComponentProps<typeof Dialog>['open'];
	onOpenChange: ComponentProps<typeof Dialog>['onOpenChange'];
	ids: string[];
}

export const RunsListModal = ({ ids, open, onOpenChange }: RunsListModal) => {
	const { queryData } = useRunsStats();

	if (!queryData || !ids.length) return null;

	const filteredResults = queryData.results.filter((f) =>
		ids.includes(String(f.id))
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<ModalContent className="bg-white rounded-lg p-4 overflow-auto relative max-w-2xl">
				<button
					aria-label="Close modal"
					className="rounded-md hover:bg-primary-wash p-1 absolute right-4 top-4 text-text-menu hover:text-primary"
					onClick={() => onOpenChange?.(false)}
				>
					<Icon name="Cross" size={14} />
				</button>
				<h2 className="text-2xl font-bold leading-tight tracking-tight text-text-primary mb-2.5">
					Run List
				</h2>
				<ul className="flex flex-col gap-4">
					{filteredResults.map((result) => (
						<li key={result.id}>
							<RunsListModalItemContainer runId={String(result.id)} />
						</li>
					))}
				</ul>
			</ModalContent>
		</Dialog>
	);
};

export interface RunsListModalItemContainerProps {
	runId: string;
}

const RunsListModalItemContainer = ({
	runId
}: RunsListModalItemContainerProps) => {
	const query = useGetRunDetailsQuery(runId);

	if (query.error) {
		return <div>Something went wrong!</div>;
	}

	if (query.isLoading) {
		return <Skeleton className="rounded-md w-full h-16" />;
	}

	if (!query.data) {
		return <div>No data present!</div>;
	}

	const { bg, color, icon } = getRunStatusInfo(query.data.conclusion);

	return (
		<div className="flex">
			<div
				className={cn('grid place-items-center rounded-l-md w-6', bg, color)}
			>
				{icon}
			</div>
			<div className="flex items-center justify-between flex-1 gap-4 py-1 pl-2 pr-4 border-r rounded-r-md border-y border-border-primary">
				<div className="flex flex-col justify-center">
					<div className="flex items-center">
						<span className="col-start-1 row-1 text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
							Name:
						</span>
						&nbsp;
						<span className="col-start-3 row-1 text-[0.6875rem] font-medium leading-[0.875rem]">
							{query.data.main_package}
						</span>
					</div>
					<div className="flex items-center">
						<span className="col-start-1 row-1 text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
							Start:
						</span>
						&nbsp;
						<span className="col-start-3 row-1 text-[0.6875rem] font-medium leading-[0.875rem]">
							{parseDetailDate(query.data.start)}
						</span>
					</div>
				</div>
				<div>
					<RunLinks runId={Number(runId)} />
				</div>
			</div>
		</div>
	);
};
