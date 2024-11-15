/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { skipToken } from '@reduxjs/toolkit/dist/query';

import {
	getErrorMessage,
	useGetLogJsonQuery,
	useGetLogUrlByResultIdQuery
} from '@/services/bublik-api';
import {
	LogTableContext,
	LogTableContextProvider,
	SessionRoot
} from '@/bublik/features/session-log';
import { cn, Icon, Skeleton } from '@/shared/tailwind-ui';

import { useIsLogLegacy, useLogPage } from '../../hooks';

const highlightRow = (el: HTMLElement) => {
	el.classList.add('animate-highlight-row');
	el.addEventListener(
		'animationend',
		() => el.classList.remove('animate-highlight-row'),
		{ once: true }
	);
};

export interface LogFrameErrorProps {
	error: unknown;
}

export const LogFrameError = ({ error = {} }: LogFrameErrorProps) => {
	const { title, status, description } = getErrorMessage(error);
	return (
		<div className="grid w-full h-full place-items-center">
			<div className="flex gap-4">
				<Icon
					name="TriangleExclamationMark"
					size={48}
					className="text-text-unexpected"
				/>
				<div>
					<h1 className="text-2xl font-bold">
						{title} {status}
					</h1>
					<p className="mt-1 text-xl">{description}</p>
				</div>
			</div>
		</div>
	);
};

export const LogFrameEmpty = () => {
	return <div>No log found!</div>;
};

export function LogPickerContainer() {
	const { isLegacyLog } = useIsLogLegacy();
	const {
		isShowingRunLog,
		focusId,
		runId,
		lineNumber,
		setLineNumber,
		page,
		setPage
	} = useLogPage();

	if (!runId) return <div>No run ID!</div>;

	const handlePageClick = (_: string, page: number) => {
		setPage(page);
	};

	const handleLineNumberClick = (id: string, clickNumber: number) => {
		const clickedId = `${id}_${clickNumber}`;
		const el = document.getElementById(clickedId);

		if (el) highlightRow(el);
		if (clickedId === lineNumber) return;

		setLineNumber(clickedId);
	};

	const handleLogTableMount: LogTableContext['onLogTableMount'] = (
		_id,
		table
	) => {
		if (!lineNumber) return;

		// 1. Expand parent rows before we can scroll to row
		const row = table.getRowModel().rowsById[lineNumber];

		if (!row) return console.log('No row found with id', lineNumber);

		const parentRowsIds = row
			.getParentRows()
			.filter((row) => Array.isArray(row.original.children))
			.map((row) => row.id);

		parentRowsIds.forEach((rowId) => table.getRow(rowId).toggleExpanded(true));

		setTimeout(() => {
			const el = document.getElementById(lineNumber);

			if (!el) return;

			highlightRow(el);

			el.scrollIntoView({ block: 'start', inline: 'start' });
		}, 0);
	};

	return !isLegacyLog ? (
		<LogTableContextProvider
			onLineNumberClick={handleLineNumberClick}
			onLogTableMount={handleLogTableMount}
			onPageClick={handlePageClick}
		>
			<JsonLog
				runId={runId}
				focusId={focusId}
				page={page}
				isShowingRunLog={isShowingRunLog}
			/>
		</LogTableContextProvider>
	) : (
		<HtmlLog
			runId={runId}
			focusId={focusId}
			isShowingRunLog={isShowingRunLog}
		/>
	);
}

export interface HtmlLogProps {
	runId: string;
	focusId?: string | number | null;
	isShowingRunLog: boolean;
}

const HtmlLog = (props: HtmlLogProps) => {
	const { runId, focusId, isShowingRunLog } = props;

	const idToLoad =
		isShowingRunLog && runId
			? parseInt(runId)
			: focusId
			? parseInt(focusId.toString())
			: undefined;

	const { data, error, isLoading } = useGetLogUrlByResultIdQuery(
		idToLoad ?? skipToken
	);

	if (isLoading) return null;

	if (error) return <LogFrameError error={error} />;

	if (!data) return null;

	return (
		<iframe
			title="log"
			src={data.url}
			className="w-full h-full pl-2 border-none rounded-b-md"
		/>
	);
};

export interface JsonLogProps {
	runId: string;
	focusId?: string | number | null;
	page?: string | number | null;
	isShowingRunLog?: boolean;
}

const JsonLog = (props: JsonLogProps) => {
	const { runId, focusId, isShowingRunLog, page } = props;

	const idToFetch = isShowingRunLog
		? { id: runId }
		: focusId
		? { id: focusId, page }
		: skipToken;

	const { data, isLoading, isFetching, error } = useGetLogJsonQuery(idToFetch);

	if (isLoading) {
		return (
			<div className="h-full p-4">
				<Skeleton className="h-full rounded" />
			</div>
		);
	}

	if (error) {
		return <LogFrameError error={error} />;
	}

	if (!data) {
		return <LogFrameEmpty />;
	}

	return (
		<div
			key={`${runId}_${focusId}_${page}_${isFetching}`}
			className={cn(isFetching && 'opacity-40 pointer-events-none', 'p-4')}
		>
			<SessionRoot root={data} />
		</div>
	);
};
