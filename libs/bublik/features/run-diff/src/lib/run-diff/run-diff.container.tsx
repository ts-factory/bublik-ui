/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useCallback } from 'react';
import { ExpandedState, Row, VisibilityState } from '@tanstack/react-table';
import { JsonParam, withDefault, useQueryParam } from 'use-query-params';

import { MergedRunDataWithDiff } from './run-diff.types';
import { useRunDiffState } from './run-diff.container.hooks';
import { ResultDiffContainer } from '../result-diff';
import {
	RunDiff,
	RunDiffEmpty,
	RunDiffError,
	RunDiffLoading
} from './run-diff.component';

const ExpandedParam = withDefault(JsonParam, { '0': true });
const ColumnVisibilityParam = withDefault(JsonParam, {
	TOTAL_LEFT: false,
	TOTAL_RIGHT: false,
	RUN_LEFT: false,
	RUN_RIGHT: false,
	ABNORMAL_LEFT: false,
	ABNORMAL_RIGHT: false
});

export interface RunDiffContainerProps {
	/** Run ID of the left run */
	leftRunId: string;
	/** Run ID of the right run */
	rightRunId: string;
}

export const RunDiffContainer: FC<RunDiffContainerProps> = (props) => {
	const { leftData, rightData, isLoading, error } = useRunDiffState(props);
	const [expanded, setExpanded] = useQueryParam<ExpandedState>(
		'expanded',
		ExpandedParam
	);
	const [columnVisibility, setColumnVisibility] =
		useQueryParam<VisibilityState>('columnVisibility', ColumnVisibilityParam);

	const renderSubComponent = useCallback(
		({ row }: { row: Row<MergedRunDataWithDiff> }) => (
			<ResultDiffContainer row={row} />
		),
		[]
	);

	if (error) return <RunDiffError error={error} />;

	if (isLoading) return <RunDiffLoading />;

	if (!leftData || !rightData) return <RunDiffEmpty />;

	return (
		<RunDiff
			leftRoot={leftData[0]}
			rightRoot={rightData[0]}
			renderSubComponent={renderSubComponent}
			expanded={expanded}
			onExpandedChange={setExpanded}
			columnVisibility={columnVisibility}
			onColumnVisibilityChange={setColumnVisibility}
		/>
	);
};
