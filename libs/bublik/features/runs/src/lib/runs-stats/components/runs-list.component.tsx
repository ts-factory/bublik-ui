/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import {
	cn,
	DrawerContent,
	DrawerFormHeader,
	DrawerRoot,
	getRunStatusInfo,
	Skeleton
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import { parseDetailDate } from '@/shared/utils';

import { RunLinks } from '../../runs-table/columns';

interface RunsListDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	ids: string[];
}

export const RunsListDrawer = (props: RunsListDrawerProps) => {
	const { ids, open, onOpenChange, title, description } = props;

	return (
		<DrawerRoot open={open} onOpenChange={onOpenChange}>
			<DrawerContent
				portal
				className="w-screen max-w-2xl flex flex-col"
				data-testid="runs-stats-drawer"
			>
				<div className="px-6 py-4 border-b border-border-primary shrink-0">
					<DrawerFormHeader
						name={title}
						description={description}
						onClose={() => onOpenChange(false)}
					/>
				</div>
				<ul className="flex flex-col gap-2 p-6 overflow-auto">
					{ids.map((id) => (
						<li key={id}>
							<RunsListItemContainer runId={id} />
						</li>
					))}
				</ul>
			</DrawerContent>
		</DrawerRoot>
	);
};

export interface RunsListItemContainerProps {
	runId: string;
}

const RunsListItemContainer = ({ runId }: RunsListItemContainerProps) => {
	const query = useGetRunDetailsQuery(runId);

	if (query.error) {
		return (
			<BublikErrorState
				error={query.error}
				className="h-16 rounded-md border border-border-primary"
				iconSize={16}
			/>
		);
	}

	if (query.isLoading) {
		return <Skeleton className="rounded-md w-full h-16" />;
	}

	if (!query.data) {
		return (
			<BublikEmptyState
				title="No data"
				description="Run details are unavailable"
				className="h-16 rounded-md border border-border-primary"
				contentClassName="px-2"
				hideIcon
				titleClassName="mt-0 text-xs"
				descriptionClassName="text-xs"
			/>
		);
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
