/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import {
	getErrorMessage,
	useGetSingleMeasurementQuery
} from '@/services/bublik-api';
import { MeasurementsTable } from '@/shared/charts';
import { Icon, Skeleton } from '@/shared/tailwind-ui';

export const TableLoading = () => (
	<div className="p-4">
		<Skeleton className="w-full min-h-[700px] rounded" />
	</div>
);

export const TableEmpty = () => <div>Table is empty</div>;

export interface TableErrorProps {
	error: unknown;
}

export const TableError = ({ error }: TableErrorProps) => {
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

export interface TablesProps {
	resultId: string;
	isLockedMode?: boolean;
	chartsHeight?: number;
}

export const TablesContainer: FC<TablesProps> = ({
	resultId,
	isLockedMode,
	chartsHeight
}) => {
	const { data, isLoading, error } = useGetSingleMeasurementQuery(resultId);

	if (isLoading) return <TableLoading />;

	if (error) return <TableError error={error} />;

	if (!data) return <TableEmpty />;

	return (
		<MeasurementsTable
			data={data}
			isLockedMode={isLockedMode}
			chartsHeight={chartsHeight}
		/>
	);
};
