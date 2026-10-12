/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useCallback } from 'react';
import { Row } from '@tanstack/react-table';

import { MergedRunDataWithDiff } from './run-diff.types';
import { useRunDiffState } from './run-diff.container.hooks';
import { ResultDiffContainer } from '../result-diff';
import {
	useCompareColumnVisibility,
	useCompareExpanded
} from '../compare-search';
import {
	RunDiff,
	RunDiffEmpty,
	RunDiffError,
	RunDiffLoading
} from './run-diff.component';

export interface RunDiffContainerProps {
	/** Run ID of the left run */
	leftRunId: string;
	/** Run ID of the right run */
	rightRunId: string;
}

export const RunDiffContainer: FC<RunDiffContainerProps> = (props) => {
	const { leftData, rightData, isLoading, error } = useRunDiffState(props);
	const [expanded, setExpanded] = useCompareExpanded();
	const [columnVisibility, setColumnVisibility] = useCompareColumnVisibility();

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
