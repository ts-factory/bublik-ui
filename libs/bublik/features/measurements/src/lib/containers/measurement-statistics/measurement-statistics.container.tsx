/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import { MeasurementsRouterParams } from '@/shared/types';

import {
	useGetResultInfoQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';
import { InfoBlock } from '@/shared/charts';
import { CardHeader, Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { HistoryLinkContainer } from '@/bublik/features/history-link';
import { LinkToRun } from './link-to-run';
import { LinkToLog } from './link-to-log';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';

export interface MeasurementStatisticsLoadingProps {
	runId: string;
	resultId: string;
	path?: string;
}

export const MeasurementStatisticsLoading: FC<
	MeasurementStatisticsLoadingProps
> = ({ runId, resultId, path }) => {
	return (
		<div className="flex-shrink-0 w-full bg-white rounded-md">
			<CardHeader label="Test result">
				<div className="flex items-center gap-3">
					<LinkToRun runId={runId} targetIterationId={Number(resultId)} />
					<HistoryLinkContainer
						runId={Number(runId)}
						resultId={Number(resultId)}
						path={path}
					/>
					<LinkToLog runId={runId} resultId={resultId} />
				</div>
			</CardHeader>
			<div className="py-2.5 px-4">
				<Skeleton className="w-full h-full min-h-[86px] rounded" />
			</div>
		</div>
	);
};

export interface MeasurementStatisticsErrorProps {
	error?: unknown;
}

export const MeasurementStatisticsError = ({
	error = {}
}: MeasurementStatisticsErrorProps) => {
	return (
		<div className="flex-shrink-0 w-full bg-white rounded-md">
			<CardHeader label="Test result">
				<div className="flex items-center gap-3"></div>
			</CardHeader>
			<div className="py-2.5 px-4">
				<BublikErrorState
					error={error}
					iconSize={48}
					className="min-h-[140px]"
				/>
			</div>
		</div>
	);
};

export const MeasurementStatisticsEmpty = () => {
	return (
		<BublikEmptyState
			title="No data"
			description="Measurement statistics are not available"
		/>
	);
};

export const MeasurementStatisticsContainer: FC = () => {
	const { resultId, runId } = useParams<MeasurementsRouterParams>();
	const { data, isLoading, error } = useGetResultInfoQuery(
		resultId ?? skipToken
	);
	const { node } = useGetTreeByRunIdQuery(runId ?? skipToken, {
		selectFromResult: (state) => ({
			node: !state.data || !resultId ? undefined : state.data.tree[resultId]
		})
	});

	if (!resultId || !runId) {
		return (
			<BublikEmptyState
				title="No data"
				description="Run id or result id is missing"
			/>
		);
	}

	if (error) return <MeasurementStatisticsError error={error} />;

	if (isLoading) {
		return (
			<MeasurementStatisticsLoading
				runId={runId}
				resultId={resultId}
				path={node?.path ?? undefined}
			/>
		);
	}

	if (!data) return <MeasurementStatisticsEmpty />;

	const {
		name,
		obtained_result: { result_type },
		parameters,
		has_error
	} = data;

	return (
		<div className="flex-shrink-0 w-full bg-white rounded-md">
			<CardHeader label="Test result">
				<div className="flex items-center gap-3">
					<LinkToRun runId={runId} targetIterationId={Number(resultId)} />
					<HistoryLinkContainer
						runId={Number(runId)}
						resultId={Number(resultId)}
						path={node?.path ?? undefined}
					/>
					<LinkToLog runId={runId} resultId={resultId} />
					<CopyShortUrlButtonContainer />
				</div>
			</CardHeader>
			<div className="py-2.5 px-4">
				<InfoBlock
					name={name}
					obtainedResult={result_type}
					parameters={parameters}
					isError={has_error}
				/>
			</div>
		</div>
	);
};
