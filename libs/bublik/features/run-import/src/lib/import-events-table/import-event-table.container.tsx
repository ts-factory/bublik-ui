/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, useEffect, useState } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { JsonParam, useQueryParam, withDefault } from 'use-query-params';
import { ExpandedState, PaginationState } from '@tanstack/react-table';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { ImportTaskFilters } from '@/shared/types';
import { useGetImportEventLogQuery } from '@/services/bublik-api';
import { cn, Tooltip } from '@/shared/tailwind-ui';

import {
	ImportEventTable,
	ImportEventTableEmpty,
	ImportEventTableError,
	ImportEventTableLoading
} from './import-event-table.component';
import { ImportRunFilterForm } from '../import-run-filter-form';

const FilterParams = withDefault(JsonParam, {
	job: undefined,
	run: undefined,
	url: undefined,
	celery_task: undefined,
	status: undefined
});

const PaginationParam = withDefault(JsonParam, {
	pageIndex: 0,
	pageSize: 25
});

const IMPORT_EVENTS_POLLING_INTERVAL_MS = 5000;

interface ImportEventsRefreshCountdown {
	remainingSeconds: number;
	progress: number;
	status: 'disabled' | 'fetching' | 'waiting';
}

interface UseImportEventsRefreshCountdownParams {
	enabled: boolean;
	fulfilledTimeStamp?: number;
	intervalMs: number;
	isFetching: boolean;
}

function useImportEventsRefreshCountdown(
	params: UseImportEventsRefreshCountdownParams
): ImportEventsRefreshCountdown {
	const { enabled, fulfilledTimeStamp, intervalMs, isFetching } = params;
	const [now, setNow] = useState(() => Date.now());
	const [enabledTimeStamp, setEnabledTimeStamp] = useState<number>();

	useEffect(() => {
		if (!enabled) {
			setEnabledTimeStamp(undefined);
			return;
		}

		const startedAt = Date.now();

		setEnabledTimeStamp(startedAt);
		setNow(startedAt);

		const intervalId = window.setInterval(() => {
			setNow(Date.now());
		}, 250);

		return () => window.clearInterval(intervalId);
	}, [enabled]);

	if (!enabled) {
		return {
			remainingSeconds: 0,
			progress: 0,
			status: 'disabled'
		};
	}

	if (isFetching) {
		return {
			remainingSeconds: 0,
			progress: 1,
			status: 'fetching'
		};
	}

	const countdownStartedAt = Math.max(
		fulfilledTimeStamp ?? 0,
		enabledTimeStamp ?? 0
	);

	if (!countdownStartedAt) {
		return {
			remainingSeconds: Math.ceil(intervalMs / 1000),
			progress: 0,
			status: 'waiting'
		};
	}

	const elapsedMs = Math.max(0, now - countdownStartedAt);
	const remainingMs = Math.max(0, intervalMs - elapsedMs);

	return {
		remainingSeconds: Math.ceil(remainingMs / 1000),
		progress: Math.min(1, elapsedMs / intervalMs),
		status: 'waiting'
	};
}

interface ImportEventsRefreshControlProps {
	available: boolean;
	checked: boolean;
	countdown: ImportEventsRefreshCountdown;
	onCheckedChange: (checked: boolean) => void;
}

function ImportEventsRefreshControl(props: ImportEventsRefreshControlProps) {
	const { available, checked, countdown, onCheckedChange } = props;
	const isEnabled = available && checked;
	const radius = 10;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference * (1 - countdown.progress);
	const tooltipContent = !available
		? 'Auto-refresh is available on the first page'
		: isEnabled
		? countdown.status === 'fetching'
			? 'Refreshing import events'
			: `Next refresh in ${countdown.remainingSeconds}s`
		: 'Auto-refresh is disabled';

	return (
		<Tooltip content={tooltipContent}>
			<label
				htmlFor="import-events-auto-refresh"
				className={cn(
					'flex items-center gap-2 rounded-lg border border-border-primary px-3 py-[7px]',
					'text-[0.875rem] font-medium leading-[1.5rem] transition-colors select-none',
					available
						? 'cursor-pointer hover:bg-gray-50 text-text-primary'
						: 'cursor-not-allowed text-text-menu bg-gray-50'
				)}
			>
				<span
					className={cn(
						'grid size-6 shrink-0 place-items-center rounded-full transition-colors',
						isEnabled ? 'text-primary' : 'text-text-menu'
					)}
					aria-label={tooltipContent}
					aria-live="polite"
				>
					<svg
						className="absolute size-6 -rotate-90"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle
							cx="12"
							cy="12"
							r={radius}
							fill="none"
							stroke="hsl(var(--colors-border-primary))"
							strokeWidth="2.75"
						/>
						<circle
							cx="12"
							cy="12"
							r={radius}
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeWidth="2.75"
							strokeDasharray={circumference}
							strokeDashoffset={isEnabled ? strokeDashoffset : circumference}
							className="transition-[stroke-dashoffset] duration-300 ease-linear"
						/>
					</svg>
					<span className="relative grid size-[18px] place-items-center rounded-full bg-white text-[0.625rem] font-semibold leading-none">
						{isEnabled
							? countdown.status === 'fetching'
								? '...'
								: countdown.remainingSeconds
							: '--'}
					</span>
				</span>
				<span
					aria-hidden="true"
					className="mx-1 h-5 w-px shrink-0 bg-border-primary"
				/>
				<SwitchPrimitive.Root
					id="import-events-auto-refresh"
					checked={isEnabled}
					disabled={!available}
					onCheckedChange={onCheckedChange}
					className={cn(
						'group h-4 w-[26px] rounded-full relative',
						'transition-colors duration-200 ease-in-out',
						'rdx-state-checked:bg-primary rdx-state-unchecked:bg-border-primary',
						'disabled:cursor-not-allowed disabled:opacity-60'
					)}
				>
					<SwitchPrimitive.Thumb
						className={cn(
							'block size-3 rounded-full bg-primary',
							'transition-all translate-x-0.5 will-change-transform',
							'rdx-state-checked:translate-x-3 rdx-state-checked:bg-white'
						)}
					/>
				</SwitchPrimitive.Root>
				<span>Auto-refresh</span>
			</label>
		</Tooltip>
	);
}

function useImportLogPagination() {
	const [pagination, setPagination] = useQueryParam<PaginationState>(
		'pagination',
		PaginationParam
	);

	return { pagination, setPagination };
}

function useImportLogExpanded() {
	const [expanded, setExpanded] = useQueryParam<ExpandedState>(
		'expanded',
		JsonParam
	);

	return { expanded, setExpanded };
}

const useEventFilters = () => {
	const [params, setParams] = useQueryParam<ImportTaskFilters>(
		'filters',
		FilterParams
	);

	const handleFilterChange = (values: ImportTaskFilters) => {
		trackEvent(analyticsEventNames.importEventsFilterApply, {
			hasUrl: Boolean(values.url),
			hasCeleryTask: Boolean(values.celery_task),
			hasJob: Boolean(values.job),
			hasRun: Boolean(values.run),
			hasStatus: Boolean(values.status)
		});

		setParams(values, 'replaceIn');
	};

	const handleResetClick = () => {
		trackEvent(analyticsEventNames.importEventsFilterReset, {
			source: 'import_page'
		});

		setParams(
			{
				job: undefined,
				run: undefined,
				url: undefined,
				celery_task: undefined,
				status: undefined
			},
			'replace'
		);
	};

	return {
		query: params,
		setQuery: handleFilterChange,
		onResetClick: handleResetClick
	};
};

export const ImportEventsTableContainer = (props: PropsWithChildren) => {
	const { query, setQuery, onResetClick } = useEventFilters();
	const { pagination, setPagination } = useImportLogPagination();
	const { expanded, setExpanded } = useImportLogExpanded();
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
	const isAutoRefreshAvailable = pagination.pageIndex === 0;
	const isPollingEnabled = isAutoRefreshAvailable && autoRefreshEnabled;
	const { data, isLoading, isFetching, error, fulfilledTimeStamp } =
		useGetImportEventLogQuery(
			{
				...query,
				page: pagination.pageIndex + 1,
				page_size: pagination.pageSize
			},
			{
				pollingInterval: isPollingEnabled
					? IMPORT_EVENTS_POLLING_INTERVAL_MS
					: 0,
				refetchOnFocus: isPollingEnabled,
				refetchOnMountOrArgChange: true
			}
		);
	const refreshCountdown = useImportEventsRefreshCountdown({
		enabled: isPollingEnabled,
		fulfilledTimeStamp,
		intervalMs: IMPORT_EVENTS_POLLING_INTERVAL_MS,
		isFetching
	});
	return (
		<>
			<div className="px-6 py-4 bg-white rounded-t-xl">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<ImportRunFilterForm
						key={JSON.stringify(query)}
						onFiltersChange={setQuery}
						defaultValues={query}
						onResetClick={onResetClick}
					/>
					<div className="flex flex-wrap items-center justify-end gap-3">
						<ImportEventsRefreshControl
							available={isAutoRefreshAvailable}
							checked={autoRefreshEnabled}
							countdown={refreshCountdown}
							onCheckedChange={setAutoRefreshEnabled}
						/>
						{props.children}
					</div>
				</div>
			</div>
			<div className="relative flex min-h-0 flex-grow flex-col overflow-hidden rounded-b-xl bg-bg-body">
				{isLoading ? (
					<ImportEventTableLoading />
				) : error ? (
					<ImportEventTableError error={error} />
				) : data && data.results.length ? (
					<ImportEventTable
						data={data.results}
						pagination={pagination}
						setPagination={setPagination}
						expanded={expanded}
						setExpanded={setExpanded}
						rowCount={data.pagination.count}
					/>
				) : (
					<ImportEventTableEmpty />
				)}
			</div>
		</>
	);
};
