/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';

import { MeasurementsRouterParams } from '@/shared/types';

import { getErrorMessage, useGetResultInfoQuery } from '@/services/bublik-api';
import { InfoBlock } from '@/shared/charts';
import { CardHeader, Icon, Skeleton } from '@/shared/tailwind-ui';

import { LinkToHistory } from './link-to-history';
import { LinkToRun } from './link-to-run';
import { LinkToLog } from './link-to-log';
import { CopyShortUrlButtonContainer } from '@/bublik/features/copy-url';

export interface MeasurementStatisticsLoadingProps {
	runId: string;
	resultId: string;
}

export const MeasurementStatisticsLoading: FC<
	MeasurementStatisticsLoadingProps
> = ({ runId, resultId }) => {
	return (
		<div className="flex-shrink-0 w-full bg-white rounded-md">
			<CardHeader label="Test result">
				<div className="flex items-center gap-3">
					<LinkToRun runId={runId} targetIterationId={Number(resultId)} />
					<LinkToHistory runId={runId} resultId={resultId} />
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
	const { status, title, description } = getErrorMessage(error);

	return (
		<div className="flex-shrink-0 w-full bg-white rounded-md">
			<CardHeader label="Test result">
				<div className="flex items-center gap-3"></div>
			</CardHeader>
			<div className="py-2.5 px-4">
				<div className="flex items-center justify-center min-h-[140px]">
					<div className="flex gap-4">
						<Icon
							name="TriangleExclamationMark"
							size={48}
							className="text-text-unexpected"
						/>
						<div>
							<h2 className="text-2xl font-bold">
								{status} {title}
							</h2>
							<p>{description}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export const MeasurementStatisticsEmpty = () => <div>No data</div>;

export const MeasurementStatisticsContainer: FC = () => {
	const { resultId, runId } = useParams<MeasurementsRouterParams>();
	const { data, isLoading, error } = useGetResultInfoQuery(
		resultId ?? skipToken
	);

	if (!resultId || !runId) return <div>No run id or result id</div>;

	if (error) return <MeasurementStatisticsError error={error} />;

	if (isLoading) {
		return <MeasurementStatisticsLoading runId={runId} resultId={resultId} />;
	}

	if (!data) return <MeasurementStatisticsEmpty />;

	const {
		result: {
			name,
			obtained_result: { result_type },
			parameters,
			has_error
		}
	} = data;

	return (
		<div className="flex-shrink-0 w-full bg-white rounded-md">
			<CardHeader label="Test result">
				<div className="flex items-center gap-3">
					<LinkToRun runId={runId} targetIterationId={Number(resultId)} />
					<LinkToHistory runId={runId} resultId={resultId} />
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
