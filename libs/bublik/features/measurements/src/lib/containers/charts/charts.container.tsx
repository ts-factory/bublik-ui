/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useCallback } from 'react';

import {
	getErrorMessage,
	useGetSingleMeasurementQuery
} from '@/services/bublik-api';
import {
	Chart,
	getRow,
	scrollToRow,
	highlightRow,
	getColorByIdx,
	ChartPointClickHandler
} from '@/shared/charts';

import { Skeleton, Icon, cn, useSidebar } from '@/shared/tailwind-ui';

export const ChartsEmpty = () => <div>Chart is empty</div>;

export const ChartsLoading = ({ layout }: { layout: ChartsTiling }) => {
	return (
		<ul className={layout === 'mosaic' ? 'chart-mosaic' : undefined}>
			<li className="py-2.5 px-4">
				<Skeleton className="h-[334px] rounded" />
			</li>
			<li className="py-2.5 px-4">
				<Skeleton className="h-[334px] rounded" />
			</li>
			<li className="py-2.5 px-4">
				<Skeleton className="h-[334px] rounded" />
			</li>
			<li className="py-2.5 px-4">
				<Skeleton className="h-[334px] rounded" />
			</li>
		</ul>
	);
};

export interface ChartsErrorProps {
	error: unknown;
}

export const ChartsError: FC<ChartsErrorProps> = ({ error = {} }) => {
	const { status, title, description } = getErrorMessage(error);

	return (
		<div className="flex items-center justify-center gap-4 mx-4 my-20">
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
	);
};

export type ChartsTiling = 'row' | 'mosaic';

export interface ChartsProps {
	layout: ChartsTiling;
	resultId: string;
	isLockedMode?: boolean;
}

export const ChartsContainer: FC<ChartsProps> = ({
	resultId,
	layout,
	isLockedMode
}) => {
	const { isSidebarOpen } = useSidebar();
	const { data, isLoading, error } = useGetSingleMeasurementQuery(resultId);

	const handleChartPointClick: ChartPointClickHandler = useCallback(
		({ dataIndex, chartId }) => {
			const el = getRow(dataIndex, chartId);

			if (!el) return;

			scrollToRow(el, isLockedMode);
			highlightRow(el);
		},
		[isLockedMode]
	);

	if (isLoading) return <ChartsLoading layout={layout} />;

	if (error) return <ChartsError error={error} />;

	if (!data) return <ChartsEmpty />;

	if (layout === 'mosaic') {
		return (
			<div
				className={cn(
					'[&>li]:border-b [&>li]:border-border-primary',
					isSidebarOpen
						? 'min-[1465px]:chart-mosaic'
						: 'min-[1368px]:chart-mosaic'
				)}
			>
				{data.map((plot, idx) => {
					return (
						<div className="py-2.5 px-4" key={plot.id}>
							<Chart
								id={plot.id}
								plot={plot}
								onChartPointClick={handleChartPointClick}
								color={getColorByIdx(idx)}
							/>
						</div>
					);
				})}
			</div>
		);
	}

	return (
		<div className="flex flex-col children-but-last:border-b children-but-last:border-b-border-primary">
			{data.map((plot, idx) => {
				return (
					<div className="py-2.5 px-4" key={plot.id}>
						<Chart
							id={plot.id}
							plot={plot}
							onChartPointClick={handleChartPointClick}
							color={getColorByIdx(idx)}
						/>
					</div>
				);
			})}
		</div>
	);
};
