/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
import { MeasurementsTable } from '@/shared/charts';
import { Skeleton } from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

export const TableLoading = () => (
	<div className="p-4">
		<Skeleton className="w-full min-h-[700px] rounded" />
	</div>
);

export const TableEmpty = () => {
	return (
		<BublikEmptyState title="No data" description="Table is empty" hideIcon />
	);
};

export interface TableErrorProps {
	error: unknown;
}

export const TableError = ({ error }: TableErrorProps) => {
	return <BublikErrorState error={error} iconSize={48} className="my-20" />;
};

export interface TablesProps {
	resultId: string;
}

export function TablesContainer(props: TablesProps) {
	const { resultId } = props;
	const { data, isLoading, error } = useGetSingleMeasurementQuery(resultId);

	if (isLoading) return <TableLoading />;

	if (error) return <TableError error={error} />;

	if (!data) return <TableEmpty />;

	return (
		<div className="">
			<MeasurementsTable data={data.tables} />
		</div>
	);
}
