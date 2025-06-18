/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, ComponentType } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { RocketIcon } from '@radix-ui/react-icons';

import { Facility, LogEvent } from '@/shared/types';
import { config } from '@/bublik/config';
import { Badge, ButtonTw, cn, cva, Icon, Tooltip } from '@/shared/tailwind-ui';
import { formatTimeToDot } from '@/shared/utils';

import { FACILITY_MAP, SEVERITY_MAP } from '../utils';
import { getSeverityBgColor } from './import-event-table-utils';
import { useImportLog } from './import-log.component';

export const statusBadgeStyles = cva({
	base: [
		'inline-flex',
		'px-2 py-0.5',
		'text-xs',
		'font-semibold',
		'leading-5',
		'rounded',
		'items-center'
	],
	variants: {
		expected: { true: ['bg-badge-3', 'text-text-expected'] },
		unexpected: { true: ['bg-badge-5', 'text-text-unexpected'] }
	},
	compoundVariants: [
		{ expected: false, unexpected: false, className: 'bg-badge-10' }
	]
});

function getBgByStatus(status: string): string {
	const statusMap: Record<string, string> = {
		SUCCESS: 'bg-bg-ok',
		FAILURE: 'bg-bg-error',
		STARTED: 'bg-bg-running',
		RECEIVED: 'bg-gray-400'
	};

	return statusMap[status] ?? '';
}

function getIconByStatus(status: string) {
	const statusMap: Record<
		string,
		ComponentType<Omit<ComponentProps<typeof Icon>, 'name'>>
	> = {
		SUCCESS: (props) => <Icon name="InformationCircleCheckmark" {...props} />,
		FAILURE: (props) => <Icon name="InformationCircleCrossMark" {...props} />,
		STARTED: (props) => <Icon name="ProgressIndicator" {...props} />,
		RECEIVED: (props) => <Icon name="Download" {...props} />
	};

	return statusMap[status];
}

export const columns: ColumnDef<LogEvent>[] = [
	{
		id: 'EVENT_TYPE',
		header: '',
		accessorKey: 'status',
		cell: (cell) => {
			const status = cell.getValue<LogEvent['status']>();
			const Icon = getIconByStatus(status);

			return (
				<Tooltip content={status ?? '1'} side="right" align="start">
					<div
						className={cn(
							'h-[calc(100%+2px)] rounded-l w-[24px] flex flex-col items-center -translate-x-px -translate-y-px',
							getBgByStatus(status)
						)}
					>
						<Icon className="mt-3.5 text-white" size={18} />
					</div>
				</Tooltip>
			);
		},
		meta: { className: 'w-px p-0' }
	},
	{
		id: 'ACTIONS',
		header: () => <span className="pl-2">Actions</span>,
		accessorKey: 'celery_task',
		cell: (cell) => {
			const taskId = cell.getValue<LogEvent['celery_task']>();
			// eslint-disable-next-line
			const { toggle } = useImportLog();

			if (!taskId) return null;

			return (
				<div className="flex flex-col justify-center gap-1 w-fit">
					<ButtonTw
						variant="secondary"
						size="xss"
						className="justify-start"
						onClick={toggle(taskId)}
					>
						<Icon name="Paper" size={20} className="mr-1.5" />
						<span>Log</span>
					</ButtonTw>
					<ButtonTw
						variant="secondary"
						size="xss"
						className="justify-start"
						asChild
					>
						<a
							href={`${config.oldBaseUrl}/flower/task/${taskId}`}
							target="_blank"
							rel="noreferrer"
						>
							<RocketIcon className="mr-1.5 size-4" />
							<span>Task</span>
						</a>
					</ButtonTw>
				</div>
			);
		},
		meta: { className: 'w-px' }
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
		header: () => <span className="pl-2">Facility</span>,
		accessorKey: 'facility',
		cell: (cell) => {
			const value = cell.getValue<LogEvent['facility']>();

			const facilityStyles = cva({
				base: [
					'inline-flex',
					'items-center',
					'w-fit',
					'py-0.5',
					'px-2',
					'rounded',
					'border',
					'border-transparent',
					'leading-[1.125rem]',
					'text-[0.75rem]',
					'font-medium',
					'transition-colors'
				],
				variants: {
					variant: {
						[Facility.ImportRuns]: ['bg-blue-100', 'text-blue-800'],
						[Facility.MetaCaterigozation]: ['bg-purple-100', 'text-purple-800'],
						[Facility.AddTags]: ['bg-green-100', 'text-green-800'],
						[Facility.Celery]: ['bg-amber-100', 'text-amber-800']
					}
				}
			});

			if (!value) return null;

			const facility = FACILITY_MAP.has(value)
				? FACILITY_MAP.get(value)
				: value;

			return (
				<span className={facilityStyles({ variant: value })}>
					{facility?.toUpperCase()}
				</span>
			);
		}
	},
	{
		header: () => <span className="pl-2">Severity</span>,
		accessorKey: 'severity',
		cell: (cell) => {
			const value = cell.getValue<LogEvent['severity']>();

			if (!value) return null;

			return (
				<Badge className={getSeverityBgColor(value)}>
					{SEVERITY_MAP.has(value)
						? SEVERITY_MAP.get(value)?.toUpperCase()
						: value.toUpperCase()}
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

			return <span className="whitespace-pre-wrap font-mono">{value}</span>;
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
					className="hover:underline whitespace-pre-wrap"
					target="_blank"
					rel="noreferrer"
				>
					{url}
				</a>
			);
		}
	}
];
