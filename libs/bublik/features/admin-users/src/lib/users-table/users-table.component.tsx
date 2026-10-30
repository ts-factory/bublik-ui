/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { User } from '@/shared/types';
import { useIsScrollbarVisible } from '@/shared/hooks';
import { Pagination, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import {
	ClassificationFooter,
	ClassificationRange,
	ClassificationTable
} from '@/bublik/features/result-classification';

import { columns, PINNED_LAST_COLUMNS } from './users-table.columns';

export const UsersTableLoading = () => {
	return (
		<div className="flex flex-col gap-1 p-2">
			{Array.from({ length: 25 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-[34px] rounded-md" />
			))}
		</div>
	);
};

interface UsersTableErrorProps {
	error: unknown;
}

export const UsersTableError = (props: UsersTableErrorProps) => {
	const { error = {} } = props;

	return <BublikErrorState error={error} className="flex-1" />;
};

export const UsersTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No results"
			description="No results found"
			className="flex-1"
			iconClassName="text-text-unexpected"
		/>
	);
};

interface UsersTableProps {
	users: User[];
}

export const UsersTable = (props: UsersTableProps) => {
	const { users } = props;
	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();

	const table = useReactTable<User>({
		initialState: {
			pagination: { pageIndex: 0, pageSize: 25 },
			sorting: [{ id: 'email', desc: true }]
		},
		data: users,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});

	const { pagination } = table.getState();

	function scrollToTop() {
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<div ref={scrollRef} className="flex-1 min-h-0 overflow-auto bg-bg-body">
				<ClassificationTable
					table={table}
					stickyHeader
					endGutter
					gutterBefore={PINNED_LAST_COLUMNS}
					scrollRef={scrollRef}
					testId="users-table"
				/>
			</div>
			<ClassificationFooter isScrollable={isScrollable}>
				<ClassificationRange
					matchedCount={users.length}
					pageIndex={pagination.pageIndex}
					pageSize={pagination.pageSize}
					noun="user"
				/>
				<Pagination
					className="ml-auto"
					variant="compact"
					totalCount={users.length}
					pageSize={pagination.pageSize}
					currentPage={pagination.pageIndex + 1}
					onPageChange={(page) => {
						table.setPageIndex(page - 1);
						scrollToTop();
					}}
					onPageSizeChange={(pageSize) => {
						table.setPageSize(pageSize);
						scrollToTop();
					}}
				/>
			</ClassificationFooter>
		</div>
	);
};
