/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row } from '@tanstack/react-table';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetResultsTableQuery } from '@/services/bublik-api';
import { BublikEmptyState } from '@/bublik/features/ui-state';

import {
	MergedRunDataWithDiff,
	RunDataWithDiff
} from '../run-diff/run-diff.types';
import {
	ResultDiff,
	ResultDiffEmpty,
	ResultDiffError,
	ResultDiffLoading
} from './index';

const getQueries = ({
	left,
	right
}: {
	left: RunDataWithDiff | null;
	right: RunDataWithDiff | null;
}) => {
	const leftQuery =
		left?.parent_id && left?.name
			? {
					parentId: left.parent_id,
					testName: left.name,
					requests: {
						TOTAL: { results: [], resultProperties: [] }
					}
			  }
			: undefined;

	const rightQuery =
		right?.parent_id && right?.name
			? {
					parentId: right.parent_id,
					testName: right.name,
					requests: {
						TOTAL: { results: [], resultProperties: [] }
					}
			  }
			: undefined;

	return { leftQuery, rightQuery };
};

const useResultDiffState = ({
	left,
	right
}: {
	left: RunDataWithDiff | null;
	right: RunDataWithDiff | null;
}) => {
	const { leftQuery, rightQuery } = getQueries({ left, right });

	const {
		data: leftData,
		isLoading: isLeftLoading,
		isError: isLeftErrorLoading,
		error: leftError
	} = useGetResultsTableQuery(leftQuery || skipToken);
	const {
		data: rightData,
		isLoading: isRightLoading,
		isError: isRightErrorLoading,
		error: rightError
	} = useGetResultsTableQuery(rightQuery || skipToken);

	return {
		leftData,
		rightData,
		isLoading: isLeftLoading || isRightLoading,
		isError: isLeftErrorLoading || isRightErrorLoading,
		error: leftError ?? rightError
	};
};

export interface ResultDiffContainerProps {
	row: Row<MergedRunDataWithDiff>;
}

export const ResultDiffContainer: FC<ResultDiffContainerProps> = ({ row }) => {
	const {
		leftData = [],
		rightData = [],
		isError,
		isLoading,
		error
	} = useResultDiffState(row.original);
	const [searchParams] = useSearchParams();

	const leftRunId = searchParams.get('left');
	const rightRunId = searchParams.get('right');

	if (!leftRunId || !rightRunId) {
		return (
			<BublikEmptyState title="No data" description="Run IDs are missing" />
		);
	}

	if (isError) return <ResultDiffError error={error} />;

	if (isLoading) {
		return <ResultDiffLoading count={25} />;
	}

	if (!leftData || !rightData) return <ResultDiffEmpty />;

	return (
		<ResultDiff
			left={leftData}
			right={rightData}
			leftRunId={leftRunId}
			rightRunId={rightRunId}
		/>
	);
};
