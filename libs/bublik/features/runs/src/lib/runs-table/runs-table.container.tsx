/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useState } from 'react';
import { OnChangeFn } from '@tanstack/react-table';
import { useSearchParams } from 'react-router-dom';

import { useGetRunsTablePageQuery } from '@/services/bublik-api';
import { useUserPreferences } from '@/bublik/features/user-preferences';

import {
	useRunsGlobalFilter,
	useRunsPagination,
	useRunsQuery,
	useRunsSelection
} from '../hooks';
import {
	RunsTable,
	RunsTableLoading,
	RunsTableError,
	RunsTableEmpty
} from './runs-table.component';
import { applyRunDataToSearchParams } from '../runs-form/runs-form.utils';
import { RunCommentEditorContainer } from './run-comment-editor.container';

interface EditedComment {
	runId: number;
	/** The comment as the runs list has it. */
	comment: string;
}

export const RunsTableContainer = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const { userPreferences } = useUserPreferences();
	const { pagination, handlePaginationChange } = useRunsPagination();
	const { localGlobalFilter, handleGlobalFilterChange } = useRunsGlobalFilter();
	const {
		rowSelection,
		addSelection,
		removeSelection,
		replaceSelection,
		compareIds
	} = useRunsSelection();
	const autoApplyBadgeFilters = userPreferences.runs.autoApplyBadgeFilters;
	const handleTableGlobalFilterChange: OnChangeFn<string[]> = useCallback(
		(updater) => {
			const nextGlobalFilter =
				typeof updater === 'function' ? updater(localGlobalFilter) : updater;

			handleGlobalFilterChange(nextGlobalFilter);

			if (!autoApplyBadgeFilters) return;

			// The new run data fetch by themselves; invalidating too would first
			// refetch the old ones, before the new URL is read.
			setSearchParams(
				applyRunDataToSearchParams(searchParams, nextGlobalFilter),
				{
					replace: true
				}
			);
		},
		[
			autoApplyBadgeFilters,
			handleGlobalFilterChange,
			localGlobalFilter,
			searchParams,
			setSearchParams
		]
	);

	// One drawer for the table, outside its rows: kept after it closes, so it
	// can slide out.
	const [editedComment, setEditedComment] = useState<EditedComment | null>(
		null
	);
	const [isCommentEditorOpen, setIsCommentEditorOpen] = useState(false);
	const handleEditComment = useCallback((runId: number, comment: string) => {
		setEditedComment({ runId, comment });
		setIsCommentEditorOpen(true);
	}, []);

	const { query } = useRunsQuery();
	const { data, isFetching, isLoading, error } = useGetRunsTablePageQuery(
		query,
		{ refetchOnFocus: true, refetchOnMountOrArgChange: true }
	);

	if (error) return <RunsTableError error={error} />;

	if (isLoading) return <RunsTableLoading count={pagination.pageSize} />;

	if (data && !data.results.length && isFetching) {
		return <RunsTableLoading count={pagination.pageSize} />;
	}

	if (!data || !data.results.length) return <RunsTableEmpty />;

	return (
		<div className={isFetching ? 'pointer-events-none opacity-40' : ''}>
			{editedComment ? (
				<RunCommentEditorContainer
					key={editedComment.runId}
					runId={editedComment.runId}
					listedComment={editedComment.comment}
					open={isCommentEditorOpen}
					onOpenChange={setIsCommentEditorOpen}
				/>
			) : null}
			<RunsTable
				data={data.results}
				pagination={pagination}
				onPaginationChange={handlePaginationChange}
				pageCount={data.pagination.count}
				globalFilter={localGlobalFilter}
				onGlobalFilterChange={handleTableGlobalFilterChange}
				rowSelection={rowSelection}
				addSelection={addSelection}
				removeSelection={removeSelection}
				replaceSelection={replaceSelection}
				selection={compareIds}
				editingCommentRunId={
					isCommentEditorOpen && editedComment ? editedComment.runId : null
				}
				onEditComment={handleEditComment}
			/>
		</div>
	);
};
