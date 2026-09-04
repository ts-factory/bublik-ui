/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { Table } from '@tanstack/react-table';

import { Skeleton } from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';

import { ClassificationTable } from '../classification-table/classification-table.component';
import type { ResultRow } from './issue-results-table.types';

export interface IssueResultsTableProps {
	table: Table<ResultRow>;
}

export function IssueResultsTableLoading() {
	return (
		<div className="flex flex-col gap-1 px-4 py-2 border-t border-border-primary">
			{Array.from({ length: 3 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-10 rounded-md" />
			))}
		</div>
	);
}

export function IssueResultsTableError({ error }: { error: unknown }) {
	return <BublikErrorState error={error} className="py-4" />;
}

export function IssueResultsTableEmpty() {
	return <div className="px-4 py-3 text-sm text-text-menu">No results</div>;
}

export function IssueResultsTable({ table }: IssueResultsTableProps) {
	return (
		<div
			className="px-4 py-2 border-t border-border-primary"
			data-testid="issue-results"
		>
			<ClassificationTable
				table={table}
				variant="nested"
				getRowAttributes={(row) => ({
					'data-testid': 'issue-result-row',
					'data-result-id': row.original.result_id
				})}
			/>
		</div>
	);
}
