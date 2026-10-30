/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import {
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { AccessToken } from '@/shared/types';
import { useIsScrollbarVisible } from '@/shared/hooks';
import { Pagination, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import {
	ClassificationFooter,
	ClassificationRange,
	ClassificationTable
} from '@/bublik/features/result-classification';

import { columns, PINNED_LAST_COLUMNS } from './tokens-table.columns';

export const TokensTableLoading = () => {
	return (
		<div className="flex flex-col gap-1 p-2">
			{Array.from({ length: 4 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-[34px] rounded-md" />
			))}
		</div>
	);
};

interface TokensTableErrorProps {
	error: unknown;
}

export const TokensTableError = ({ error = {} }: TokensTableErrorProps) => {
	return <BublikErrorState error={error} className="h-64" />;
};

export const TokensTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No access tokens"
			description="No user has created an access token yet."
			className="h-64"
		/>
	);
};

interface TokensTableProps {
	tokens: AccessToken[];
}

/** Every user's tokens, for the admin page; a user's own are a list in settings. */
export const TokensTable = ({ tokens }: TokensTableProps) => {
	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();

	const table = useReactTable<AccessToken>({
		initialState: {
			pagination: { pageIndex: 0, pageSize: 25 },
			sorting: [{ id: 'created', desc: true }]
		},
		data: tokens,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel()
	});

	const { pagination } = table.getState();

	function scrollToTop() {
		scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
	}

	return (
		<div className="flex flex-col flex-1 min-h-0">
			<div
				ref={scrollRef}
				className="flex-1 min-h-0 overflow-auto rounded-t bg-bg-body"
			>
				<ClassificationTable
					table={table}
					stickyHeader
					endGutter
					gutterBefore={PINNED_LAST_COLUMNS}
					scrollRef={scrollRef}
					testId="access-tokens-table"
				/>
			</div>
			<ClassificationFooter isScrollable={isScrollable}>
				<ClassificationRange
					matchedCount={tokens.length}
					pageIndex={pagination.pageIndex}
					pageSize={pagination.pageSize}
					noun="token"
				/>
				<Pagination
					className="ml-auto"
					variant="compact"
					totalCount={tokens.length}
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
