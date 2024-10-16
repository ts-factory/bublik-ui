/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';

import { MeasurementPlot } from '@/shared/types';
import { SingleMeasurementTable } from '@/services/bublik-api';

export const columns: ColumnDef<SingleMeasurementTable>[] = [
	{
		accessorFn: (d) => ({ tool: d.tool, type: d.type }),
		id: 'tool-type',
		header: 'Tool & Type',
		cell: (props) => {
			const { tool, type } = props.getValue<{ tool: string; type: string }>();

			return (
				<div className="flex items-center gap-2">
					<span className="text-[0.625rem] leading-[1.125rem] font-semibold">
						{tool}&nbsp;
					</span>
					<span className="text-[0.625rem] leading-[1.125rem] font-medium">
						{type}
					</span>
				</div>
			);
		}
	},
	{
		accessorKey: 'name',
		header: 'Name'
	},
	{
		accessorKey: 'aggr',
		header: 'Aggr'
	},
	{
		accessorKey: 'units',
		header: 'Units'
	},
	{
		accessorKey: 'value',
		header: 'Value'
	},
	{
		accessorKey: 'keys',
		header: 'Keys',
		cell: (props) => {
			const keys = props.getValue<MeasurementPlot['keys']>();

			return (
				<div className="flex flex-col gap-2 py-2">
					{keys.map((key) => (
						<span
							key={key}
							className="text-[0.625rem] font-medium leading-[0.75rem]"
						>
							{key}
						</span>
					))}
				</div>
			);
		}
	},
	{
		accessorKey: 'comments',
		header: 'Comments',
		cell: (props) => {
			const comments = props.getValue<MeasurementPlot['comments']>();

			return (
				<div className="flex flex-col gap-2 py-2">
					{comments.map((comment) => (
						<span
							key={comment}
							className="text-[0.625rem] font-medium leading-[0.75rem]"
						>
							{comment}
						</span>
					))}
				</div>
			);
		}
	}
];
