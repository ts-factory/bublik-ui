/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createColumnHelper } from '@tanstack/react-table';

import { SingleMeasurementTable } from '@/services/bublik-api';

const helper = createColumnHelper<SingleMeasurementTable>();

export const columns = [
	helper.accessor((d) => ({ tool: d.tool, type: d.type }), {
		id: 'tool_type',
		header: 'Tool & Type',
		cell: (props) => {
			const { tool, type } = props.getValue();

			return (
				<div className="flex gap-2 whitespace-nowrap">
					<span className="text-[0.625rem] leading-[1.125rem] font-semibold">
						{tool}&nbsp;
					</span>
					<span className="text-[0.625rem] leading-[1.125rem] font-medium">
						{type}
					</span>
				</div>
			);
		},
		meta: { className: 'w-0' }
	}),
	helper.accessor('name', {
		header: 'Name',
		cell: (props) => {
			const value = props.getValue();
			return (
				<span className="text-[0.625rem] font-medium leading-[0.75rem]">
					{value}
				</span>
			);
		},
		meta: {}
	}),
	helper.accessor('keys', {
		header: 'Keys',
		cell: (props) => {
			const keys = props.getValue();

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
	}),
	helper.accessor('comments', {
		header: 'Comments',
		cell: (props) => {
			const comments = props.getValue();

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
	}),
	helper.accessor((d) => `${d.value} ${d.units}`, {
		header: 'Value',
		cell: ({ cell, row }) => {
			return (
				<div className="flex items-center gap-3">
					<span className="text-[0.625rem] font-semibold leading-[1.125rem]">
						{row.original.aggr}
					</span>
					<span className="text-[0.625rem] leading-[1.125rem]">
						{cell.getValue()}
					</span>
				</div>
			);
		}
	})
];
