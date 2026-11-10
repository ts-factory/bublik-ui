/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { LinkWithProject } from '@/bublik/features/projects';
import { cn, HoverCard, Icon } from '@/shared/tailwind-ui';
import { ImportTaskEventLog, ImportTaskRow } from '@/shared/types';
import { parseDetailDate } from '@/shared/utils';

import { StatusBadge } from '../import-events-table/import-event-table.component';

function getImportLogUrl(taskId: string): string {
	return `/admin/import?taskId=${encodeURIComponent(taskId)}&poll=1`;
}

function getLatestMessage(row: ImportTaskRow): string | null {
	const latest = row.event_logs.reduce<ImportTaskEventLog | null>(
		(acc, log) => (!acc || log.timestamp > acc.timestamp ? log : acc),
		null
	);

	return latest?.msg ?? null;
}

interface ImportActivityItemProps {
	row: ImportTaskRow;
}

function ImportActivityItem({ row }: ImportActivityItemProps) {
	const startedAt = parseDetailDate(row.started_at ?? undefined);
	const message = getLatestMessage(row);

	const content = (
		<>
			<div className="flex items-center gap-2 min-w-0">
				<StatusBadge status={row.status} className="flex-shrink-0" />
				<span
					className="text-[0.8125rem] leading-5 truncate"
					title={row.run_source_url}
				>
					{row.run_source_url}
				</span>
			</div>
			{startedAt ? (
				<span className="text-xs text-text-menu">Started {startedAt}</span>
			) : null}
			{message ? (
				<span className="text-xs text-text-menu truncate" title={message}>
					{message}
				</span>
			) : null}
		</>
	);

	const className = 'flex flex-col gap-0.5 rounded-md px-2 py-1.5 min-w-0';

	return (
		<li data-testid="import-activity-item" data-status={row.status}>
			{row.celery_task ? (
				<LinkWithProject
					to={getImportLogUrl(row.celery_task)}
					className={cn(className, 'hover:bg-primary-wash')}
				>
					{content}
				</LinkWithProject>
			) : (
				<div className={className}>{content}</div>
			)}
		</li>
	);
}

interface ImportActivityListProps {
	imports: ImportTaskRow[];
	total: number;
}

function ImportActivityList({ imports, total }: ImportActivityListProps) {
	const hiddenCount = total - imports.length;

	return (
		<div
			className="w-80 bg-white rounded-lg shadow-popover p-2 flex flex-col gap-1"
			data-testid="import-activity-list"
		>
			<span className="px-2 pt-1 text-[0.6875rem] font-semibold uppercase text-text-menu">
				Imports in progress · {total}
			</span>
			<ul className="flex flex-col max-h-80 overflow-y-auto">
				{imports.map((row) => (
					<ImportActivityItem key={row.job_id} row={row} />
				))}
			</ul>
			{hiddenCount > 0 ? (
				<span className="px-2 text-xs text-text-menu">
					and {hiddenCount} more
				</span>
			) : null}
			<LinkWithProject
				to="/admin/import"
				className="px-2 py-1 text-xs text-primary hover:underline"
			>
				All imports
			</LinkWithProject>
		</div>
	);
}

interface ImportActivityIndicatorProps extends ImportActivityListProps {
	isSidebarOpen: boolean;
}

function ImportActivityIndicator({
	imports,
	total,
	isSidebarOpen
}: ImportActivityIndicatorProps) {
	const label = `${total} ${total === 1 ? 'import' : 'imports'} in progress`;

	return (
		<HoverCard
			content={<ImportActivityList imports={imports} total={total} />}
			side="right"
			sideOffset={8}
			openDelay={150}
		>
			<LinkWithProject
				to="/admin/import"
				aria-label={label}
				data-testid="import-activity-indicator"
				className={cn(
					'grid place-items-center rounded-full bg-white text-primary flex-shrink-0',
					isSidebarOpen
						? 'size-5 mr-1'
						: 'absolute left-[23px] top-[1px] size-3.5 z-10'
				)}
			>
				<Icon
					name="InformationCircleProgress"
					className="size-full animate-spin"
				/>
			</LinkWithProject>
		</HoverCard>
	);
}

export { ImportActivityIndicator, ImportActivityList, getImportLogUrl };
