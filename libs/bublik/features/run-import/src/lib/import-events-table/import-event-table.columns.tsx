/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';

import { LogEvent } from '@/shared/types';
import { config } from '@/bublik/config';
import { Badge, cva, Icon } from '@/shared/tailwind-ui';
import { formatTimeToDot } from '@/shared/utils';

import { FACILITY_MAP, SEVERITY_MAP } from '../utils';
import { getSeverityBgColor } from './import-event-table-utils';
import { useImportLog } from './import-log.component';

export const statusBadgeStyles = cva({
	base: [
		'inline-flex',
		'px-2',
		'text-xs',
		'font-semibold',
		'leading-5',
		'rounded',
		'items-center'
	],
	variants: {
		expected: { true: ['bg-badge-3', 'text-text-expected'], false: '' },
		unexpected: { true: ['bg-badge-5', 'text-text-unexpected'], false: '' }
	},
	compoundVariants: [
		{ expected: false, unexpected: false, className: 'bg-badge-10' }
	]
});

export const columns: ColumnDef<LogEvent>[] = [
	{
		id: 'ACTIONS',
		header: 'Actions',
		accessorKey: 'celery_task',
		cell: (cell) => {
			const taskId = cell.getValue<LogEvent['celery_task']>();
			// eslint-disable-next-line
			const { toggle } = useImportLog();

			if (!taskId) return null;

			return (
				<div className="flex flex-col justify-center gap-1">
					<button
						onClick={toggle(taskId)}
						className="relative inline-flex items-center justify-start px-2 w-fit transition-all appearance-none select-none whitespace-nowrap text-primary bg-primary-wash rounded-md gap-1 h-[1.625rem] border-2 border-transparent hover:border-[#94b0ff]"
					>
						<Icon name="BoxArrowRight" />
						<span>Logs</span>
					</button>
					<a
						href={`${config.oldBaseUrl}/flower/task/${taskId}`}
						target="_blank"
						rel="noreferrer"
						className="relative inline-flex items-center justify-start px-2 w-fit transition-all appearance-none select-none whitespace-nowrap text-primary bg-primary-wash rounded-md gap-1 h-[1.625rem] border-2 border-transparent hover:border-[#94b0ff]"
					>
						<Icon name="BoxArrowRight" />
						<span>Flower</span>
					</a>
				</div>
			);
		}
	},
	{
		id: 'EVENT_TYPE',
		header: 'Status',
		accessorKey: 'status',
		cell: (cell) => {
			const value = cell.getValue<LogEvent['status']>();

			return (
				<div
					className={statusBadgeStyles({
						expected: value === 'SUCCESS',
						unexpected: value === 'FAILURE'
					})}
				>
					{value}
				</div>
			);
		}
	},
	{
		header: 'Date',
		accessorKey: 'timestamp',
		cell: (cell) => {
			const date = cell.getValue<LogEvent['timestamp']>();

			if (!date) return null;

			return formatTimeToDot(date);
		}
	},
	{
		header: 'Facility',
		accessorKey: 'facility',
		cell: (cell) => {
			const value = cell.getValue<LogEvent['facility']>();

			if (!value) return null;

			return FACILITY_MAP.has(value) ? FACILITY_MAP.get(value) : value;
		}
	},
	{
		header: 'Severity',
		accessorKey: 'severity',
		cell: (cell) => {
			const value = cell.getValue<LogEvent['severity']>();

			if (!value) return null;

			return (
				<Badge className={getSeverityBgColor(value)}>
					{SEVERITY_MAP.has(value) ? SEVERITY_MAP.get(value) : value}
				</Badge>
			);
		}
	},
	{
		header: 'Message',
		accessorKey: 'error_msg',
		cell: (cell) => {
			const value = cell.getValue<LogEvent['error_msg']>();

			if (!value) return null;

			return value;
		}
	},

	{
		id: 'URI',
		header: 'URL',
		accessorKey: 'uri',
		cell: (cell) => {
			const url = cell.getValue<LogEvent['uri']>();

			if (!z.string().url().safeParse(url).success) return null;

			return (
				<a
					href={url}
					className="hover:underline"
					target="_blank"
					rel="noreferrer"
				>
					{url}
				</a>
			);
		}
	}
];
