/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, ComponentType } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { z } from 'zod';
import { RocketIcon } from '@radix-ui/react-icons';

import { ImportTaskRow } from '@/shared/types';
import { config } from '@/bublik/config';
import { LinkWithProject } from '@/bublik/features/projects';
import { getErrorMessage, useImportRunsMutation } from '@/services/bublik-api';
import { useCopyToClipboard } from '@/shared/hooks';
import { ButtonTw, cn, Icon, toast, Tooltip } from '@/shared/tailwind-ui';
import { parseDetailDate } from '@/shared/utils';
import { routes } from '@/router';

import { useImportLog } from './import-log.component';
import { StatusBadge } from './import-event-table.component';

export function getBgByStatus(status: string): string {
	const statusMap: Record<string, string> = {
		SUCCESS: 'bg-bg-ok',
		FAILURE: 'bg-bg-error',
		RUNNING: 'bg-bg-running',
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
		RUNNING: (props) => <Icon name="Play" {...props} />,
		RECEIVED: (props) => <Icon name="Download" {...props} />
	};

	return statusMap[status];
}

const columnHelper = createColumnHelper<ImportTaskRow>();

const IMPORT_RETRY_ERROR_FALLBACK = 'Failed to trigger re-import';

export function getImportRetryErrorMessage(error: unknown): string {
	return getErrorMessage(error).description || IMPORT_RETRY_ERROR_FALLBACK;
}

interface ActionCellProps {
	taskId?: string | null;
	runId?: number | null;
	status?: string;
}

function ActionsCell(props: ActionCellProps) {
	const { runId, taskId, status } = props;
	const { toggle } = useImportLog();

	if (!taskId) {
		return (
			<div className="flex items-center gap-2 px-2">
				<Tooltip content="No celery task available">
					<Icon
						name="TriangleExclamationMark"
						size={20}
						className="text-text-unexpected"
					/>
				</Tooltip>
			</div>
		);
	}

	return (
		<div className="flex flex-col justify-center gap-1 w-fit">
			{runId && (
				<LinkWithProject to={routes.run({ runId })}>
					<ButtonTw variant="secondary" size="xss" className="justify-start">
						<Icon name="BoxArrowRight" size={20} className="mr-1.5" />
						<span>Run</span>
					</ButtonTw>
				</LinkWithProject>
			)}
			<ButtonTw
				variant="secondary"
				size="xss"
				className="justify-start"
				onClick={toggle(taskId, status === 'RUNNING')}
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
}

function formatRuntime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '-';

	const totalCentiseconds = Math.round(seconds * 100);
	const hrs = Math.floor(totalCentiseconds / 360000);
	const mins = Math.floor((totalCentiseconds % 360000) / 6000);
	const secs = Math.floor((totalCentiseconds % 6000) / 100);
	const centiseconds = totalCentiseconds % 100;

	return [
		hrs.toString().padStart(2, '0'),
		mins.toString().padStart(2, '0'),
		`${secs.toString().padStart(2, '0')}.${centiseconds
			.toString()
			.padStart(2, '0')}`
	].join(':');
}

interface CopyableValueProps {
	value?: string | number | null;
	label: string;
}

function CopyableValue({ value, label }: CopyableValueProps) {
	const [, copy] = useCopyToClipboard();
	const canCopy = value !== null && value !== undefined;

	const handleCopy = () => {
		if (!canCopy) return;

		copy(String(value)).then((success) => {
			if (success) {
				toast.success(`Copied ${label.toLowerCase()} to clipboard`);
			} else {
				toast.error(`Failed to copy ${label.toLowerCase()}`);
			}
		});
	};

	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 font-medium',
				canCopy && 'cursor-pointer hover:text-primary group'
			)}
			onClick={(event) => {
				event.stopPropagation();
				handleCopy();
			}}
		>
			{value ?? '-'}
			{canCopy ? (
				<Icon
					name="PaperStack"
					size={14}
					className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
				/>
			) : null}
		</span>
	);
}

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
		cell: (cell) => (
			<ActionsCell
				taskId={cell.getValue()}
				runId={cell.row.original.run_id ?? undefined}
				status={cell.row.original.status}
			/>
		),
		meta: { width: 'min-content' }
	}),
	columnHelper.accessor('job_id', {
		header: 'Job Id',
		cell: (cell) => <CopyableValue label="Job ID" value={cell.getValue()} />,
		meta: { width: 'max-content' }
	}),
	columnHelper.accessor('status', {
		header: () => <span className="pl-2.5">Status</span>,
		cell: (cell) => {
			const status = cell.getValue();
			return <StatusBadge status={status} />;
		},
		meta: { width: 'min-content' }
	}),
	columnHelper.accessor('started_at', {
		header: 'Started At',
		cell: (cell) => {
			const date = cell.getValue();
			if (!date) return null;
			return parseDetailDate(date);
		},
		meta: { width: 'max-content' }
	}),
	columnHelper.accessor('run_source_url', {
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
		meta: { width: 'minmax(280px, max-content)' }
	}),
	columnHelper.accessor('runtime', {
		header: 'Runtime',
		cell: (cell) => {
			const value = cell.getValue();
			if (value == null) return null;
			return <span>{formatRuntime(value)}</span>;
		},
		meta: {
			className: 'justify-end text-right tabular-nums',
			width: 'minmax(6.75rem, max-content)'
		}
	}),
	columnHelper.accessor('error_msg', {
		header: 'Error',
		cell: (cell) => {
			const value = cell.getValue();
			if (!value) return null;
			return (
				<span className="whitespace-pre-wrap font-mono text-xs text-red-600">
					{value}
				</span>
			);
		},
		meta: { width: 'minmax(220px, 1.35fr)' }
	}),
	columnHelper.display({
		id: 'expand',
		cell: ({ row }) => {
			const isError = row.original.status === 'FAILURE';

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
									{
										force: true,
										url: row.original.run_source_url,
										range: null
									}
								]).unwrap();

								toast.promise(promise, {
									success: 'Triggered re-import successfully',
									error: getImportRetryErrorMessage
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
