/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, ComponentType } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { z } from 'zod';
import { RocketIcon } from '@radix-ui/react-icons';

import { Facility, LogEventWithChildren, Severity } from '@/shared/types';
import { config } from '@/bublik/config';
import { LinkWithProject } from '@/bublik/features/projects';
import { useImportRunsMutation } from '@/services/bublik-api';
import {
	Badge,
	ButtonTw,
	cn,
	Icon,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import { formatTimeToDot } from '@/shared/utils';
import { routes } from '@/router';

import { SEVERITY_MAP } from '../utils';
import { getSeverityBgColor } from './import-event-table-utils';
import { useImportLog } from './import-log.component';
import { FacilityBadge } from './import-event-table.component';

export function getBgByStatus(status: string): string {
	const statusMap: Record<string, string> = {
		SUCCESS: 'bg-bg-ok',
		FAILURE: 'bg-bg-error',
		STARTED: 'bg-bg-running',
		RECEIVED: 'bg-gray-400'
	};

	return statusMap[status] ?? '';
}

export function getIconByStatus(status: string) {
	const statusMap: Record<
		string,
		ComponentType<Omit<ComponentProps<typeof Icon>, 'name'>>
	> = {
		SUCCESS: (props) => <Icon name="InformationCircleCheckmark" {...props} />,
		FAILURE: (props) => <Icon name="InformationCircleCrossMark" {...props} />,
		STARTED: (props) => <Icon name="Play" {...props} />,
		RECEIVED: (props) => <Icon name="Download" {...props} />
	};

	return statusMap[status];
}

const columnHelper = createColumnHelper<LogEventWithChildren>();

export const columns = [
	columnHelper.accessor('status', {
		id: 'EVENT_TYPE',
		header: '',
		cell: (cell) => {
			const status = cell.getValue();
			const Icon = getIconByStatus(status);

			return (
				<Tooltip content={status} side="right" align="start">
					<div
						className={cn(
							'h-[calc(100%+2px)] w-[24px] flex flex-col items-center',
							cell.row.getIsExpanded() ? 'rounded-tl' : 'rounded-l',
							getBgByStatus(status)
						)}
					>
						<Icon className="mt-3.5 text-white" size={18} />
					</div>
				</Tooltip>
			);
		},
		meta: { className: 'p-0', width: '24px' }
	}),
	columnHelper.accessor('celery_task', {
		id: 'ACTIONS',
		header: () => <span className="pl-2">Actions</span>,
		cell: (cell) => {
			const taskId = cell.getValue();
			// eslint-disable-next-line
			const { toggle } = useImportLog();
			const runId = cell.row.original.run_id;

			if (!taskId) {
				return (
					<div className="flex items-center gap-2 px-2">
						<Tooltip content="No celery task available">
							<Icon
								name="TriangleExclamationMark"
								size={16}
								className="text-warning"
							/>
						</Tooltip>
					</div>
				);
			}

			return (
				<div className="flex flex-col justify-center gap-1 w-fit">
					{runId && (
						<LinkWithProject to={routes.run({ runId })}>
							<ButtonTw
								variant="secondary"
								size="xss"
								className="justify-start"
							>
								<Icon name="BoxArrowRight" size={20} className="mr-1.5" />
								<span>Run</span>
							</ButtonTw>
						</LinkWithProject>
					)}
					<ButtonTw
						variant="secondary"
						size="xss"
						className="justify-start"
						onClick={toggle(taskId, cell.row.original.status === 'STARTED')}
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
		meta: { width: 'min-content' }
	}),
	columnHelper.accessor('timestamp', {
		header: 'Date',
		cell: (cell) => {
			const date = cell.getValue();

			if (!date) return null;

			return formatTimeToDot(date);
		},
		meta: { width: '0.1fr' }
	}),
	columnHelper.accessor('facility', {
		header: () => <span className="pl-2">Facility</span>,
		cell: (cell) => {
			const facility = cell.getValue();

			return <FacilityBadge facility={facility} />;
		},
		meta: { width: '0.1fr' }
	}),
	columnHelper.accessor('severity', {
		header: () => <span className="pl-2">Severity</span>,
		cell: (cell) => {
			const value = cell.getValue();

			if (!value) return null;

			return (
				<Badge className={getSeverityBgColor(value)}>
					{SEVERITY_MAP.has(value)
						? SEVERITY_MAP.get(value)?.toUpperCase()
						: value.toUpperCase()}
				</Badge>
			);
		},
		meta: { width: '0.1fr' }
	}),
	columnHelper.accessor('error_msg', {
		header: 'Message',
		cell: (cell) => {
			const value = cell.getValue();

			if (!value) return null;

			return <span className="whitespace-pre-wrap font-mono">{value}</span>;
		},
		meta: { width: '1fr' }
	}),
	columnHelper.accessor('uri', {
		id: 'URI',
		header: 'URL',
		cell: (cell) => {
			const url = cell.getValue();

			if (!z.string().url().safeParse(url).success) return null;

			return (
				<a
					href={url}
					className="hover:underline whitespace-pre-wrap text-primary"
					target="_blank"
					rel="noreferrer"
				>
					{url}
				</a>
			);
		},
		meta: { width: '1fr' }
	}),
	columnHelper.display({
		id: 'expand',
		cell: ({ row }) => {
			const isError =
				row.original.severity === Severity.ERROR &&
				row.original.facility === Facility.ImportRuns;

			// eslint-disable-next-line react-hooks/rules-of-hooks
			const [importRuns] = useImportRunsMutation();

			return (
				<div className="flex items-center gap-2 w-full justify-end">
					{isError ? (
						<ButtonTw
							variant="secondary"
							size="xss"
							onClick={async () => {
								const promise = importRuns([
									{ force: true, url: row.original.uri, range: null }
								]);

								toast.promise(promise, {
									success: 'Triggered re-import successfully',
									error: 'Failed to trigger re-import'
								});

								await promise;
							}}
						>
							<Icon name="Refresh" size={20} className="mr-1.5" />
							<span>Try Again</span>
						</ButtonTw>
					) : null}
					<Tooltip content="Expand/Collapse">
						<button
							className={cn(
								'grid place-items-center p-1 rounded-md hover:bg-primary-wash text-primary',
								row.getIsExpanded() &&
									'bg-primary text-white hover:text-white hover:bg-primary',
								!row.getCanExpand() && 'hidden'
							)}
							onClick={() => row.toggleExpanded()}
						>
							<Icon
								name="ArrowShortTop"
								className={cn(
									'size-5',
									'rotate-90',
									row.getIsExpanded() && 'rotate-180'
								)}
							/>
						</button>
					</Tooltip>
				</div>
			);
		},
		meta: { width: 'min-content' }
	})
];
