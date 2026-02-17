/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentProps,
	createContext,
	ElementRef,
	PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState
} from 'react';
import {
	BooleanParam,
	StringParam,
	useQueryParam,
	withDefault
} from 'use-query-params';
import { PauseIcon, RocketIcon } from '@radix-ui/react-icons';
import { skipToken } from '@reduxjs/toolkit/query';
import { AnimatePresence, motion } from 'framer-motion';

import { useGetImportLogQuery } from '@/services/bublik-api';
import {
	ButtonTw,
	CardHeader,
	cn,
	DialogClose,
	DialogPortal,
	DrawerContent,
	DrawerRoot,
	Icon,
	Skeleton,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import { ImportJsonLog } from '@/shared/types';
import { useCopyToClipboard, useLocalStorage } from '@/shared/hooks';
import { routes } from '@/router';
import { config } from '@/bublik/config';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table';

interface ImportLogContext {
	toggle: (taskId: string, enablePolling?: boolean) => () => void;
}

const ImportLogContext = createContext<ImportLogContext | null>(null);

function useImportLog() {
	const context = useContext(ImportLogContext);

	if (!context) {
		throw new Error(
			'useImportLog must be used within <ImportLogContextProvider />'
		);
	}

	return context;
}

function ImportLogProvider({ children }: PropsWithChildren) {
	const [taskId, setTaskId] = useQueryParam('taskId', StringParam);
	const [enablePolling = false, setEnablePolling] = useQueryParam(
		'poll',
		withDefault(BooleanParam, false)
	);

	function toggle(task: string, enablePolling?: boolean) {
		return () => {
			setTaskId((t) => (t ? null : task));

			if (typeof enablePolling !== 'undefined') {
				setEnablePolling(enablePolling);
			}
		};
	}

	function close() {
		setTaskId(null);
		setEnablePolling(null);
	}

	return (
		<ImportLogContext.Provider value={{ toggle }}>
			<JsonLogContainer
				taskId={taskId}
				enablePolling={enablePolling}
				close={close}
			/>
			{children}
		</ImportLogContext.Provider>
	);
}

interface JsonLogContainerProps {
	taskId?: string | null;
	enablePolling?: boolean;
	close: () => void;
}

function JsonLogContainer(props: JsonLogContainerProps) {
	const { taskId, enablePolling, close } = props;

	return (
		<DrawerRoot
			open={!!taskId}
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<DialogPortal>
				<DrawerContent
					className="w-[80vw] flex flex-col"
					onInteractOutside={close}
					onEscapeKeyDown={close}
				>
					<ImportLogTableContainer
						taskId={taskId}
						enablePolling={enablePolling}
					/>
				</DrawerContent>
			</DialogPortal>
		</DrawerRoot>
	);
}

function getRunIdFromLogs(data: { message: string }[]): number | null {
	const patterns = [
		/run id is (\d+)/i, // Matches "run id is 12345"
		/mi run id:\s*(\d+)/i // Matches "MI RUN ID: 12345"
	];

	for (const entry of data) {
		for (const pattern of patterns) {
			const match = entry.message.match(pattern);
			if (match) {
				return parseInt(match[1], 10);
			}
		}
	}

	return null; // Return null if no patterns match
}

const BG_CLASS = 'bg-[#24292f]';

export interface ImportLogTableContainerProps {
	taskId: ComponentProps<typeof JsonLogContainer>['taskId'];
	enablePolling: ComponentProps<typeof JsonLogContainer>['enablePolling'];
}

export const ImportLogTableContainer = (
	props: ImportLogTableContainerProps
) => {
	const { taskId } = props;
	const [isAtBottom, setIsAtBottom] = useState(true);
	const [shouldPoll, setShouldPoll] = useState(props.enablePolling);
	const [textWrap, setTextWrap] = useLocalStorage('import-log-text-wrap', true);

	const { data, isLoading, isFetching, error } = useGetImportLogQuery(
		taskId ? taskId : skipToken,
		{
			pollingInterval: shouldPoll ? 5000 : 0
		}
	);

	const scrollRef = useRef<ElementRef<'div'>>(null);

	const [, copy] = useCopyToClipboard({
		onSuccess: () => toast.success('Copied to clipboard')
	});

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		const isBottom =
			Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 10;
		setIsAtBottom(isBottom);
	}, []);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		el.addEventListener('scroll', handleScroll);
		return () => el.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el || !data) return;

		const maybeRunId = getRunIdFromLogs(data);
		if (maybeRunId) {
			setShouldPoll(false);
			return;
		}

		if (!shouldPoll || !isAtBottom) return;

		setTimeout(
			() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }),
			0
		);
	}, [data, shouldPoll, isAtBottom, isFetching]);

	if (error) {
		return <ImportLogError error={error} />;
	}

	if (isLoading) {
		return <Skeleton className="w-full h-full" />;
	}

	if (!data) {
		return (
			<BublikEmptyState
				title="No log found"
				description="Import log is empty"
				hideIcon
			/>
		);
	}

	const maybeRunId = getRunIdFromLogs(data);
	const showPausedChip = shouldPoll && !isAtBottom;

	return (
		<>
			<CardHeader
				label={
					<div className="flex items-center gap-2">
						<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
							Import: {taskId}
						</span>
						<Spinner show={Boolean(shouldPoll)} />
					</div>
				}
				className="px-4 py-2 flex gap-4 items-center justify-between"
			>
				<div className="flex gap-2 items-center">
					<HeaderLinks runId={maybeRunId} />
					<ButtonTw asChild variant="secondary" size="xss">
						<a
							href={`${config.oldBaseUrl}/flower/task/${taskId}`}
							target="_blank"
							rel="noreferrer"
						>
							<RocketIcon className="mr-1.5" />
							<span>Task</span>
						</a>
					</ButtonTw>
					<ButtonTw
						variant="secondary"
						size="xss"
						onClick={async () => {
							if (!data) return;
							await copy(data.map((d) => d.message.trim()).join('\n'));
						}}
					>
						<Icon name="PaperStack" size={20} className="mr-1.5" />
						<span>Copy Log</span>
					</ButtonTw>
					<ButtonTw
						variant={textWrap ? 'primary' : 'secondary'}
						onClick={() => setTextWrap((v) => !v)}
						size="xss"
					>
						<Icon name="TextWrap" size={18} className="mr-1.5" />
						<span>Line Wrap</span>
					</ButtonTw>
					<DialogClose className="p-0.5 rounded-md hover:bg-primary-wash hover:text-primary text-text-menu">
						<Icon name="CrossSimple" size={20} />
					</DialogClose>
				</div>
			</CardHeader>
			<div className="relative flex-grow overflow-hidden">
				<AnimatePresence>
					{showPausedChip ? (
						<motion.div
							className="flex items-center gap-1 px-2 py-0.5 text-xs text-white rounded-full bg-primary absolute bottom-12 left-1/2 -translate-x-1/2"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
						>
							<PauseIcon className="size-4" />
							<span>Scrolling Paused</span>
						</motion.div>
					) : null}
				</AnimatePresence>
				<div
					className={cn('flex-grow overflow-hidden h-full', BG_CLASS)}
					ref={scrollRef}
				>
					<ImportLogTable logs={data} textWrap={textWrap} />
				</div>
			</div>
		</>
	);
};

interface ImportLogErrorProps {
	error: unknown;
}

function ImportLogError({ error }: ImportLogErrorProps) {
	return <BublikErrorState error={error} />;
}

interface SpinnerProps {
	show: boolean;
}

function Spinner(props: SpinnerProps) {
	return (
		<AnimatePresence>
			{props.show ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<Tooltip content="Run import is in progress">
						<Icon
							name="InformationCircleProgress"
							size={24}
							className="text-primary p-0.5 animate-spin"
						/>
					</Tooltip>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}

interface HeaderLinksProps {
	runId?: number | null;
}

function HeaderLinks({ runId }: HeaderLinksProps) {
	if (!runId) return;

	return (
		<>
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject to={routes.log({ runId })} target="_blank">
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Log
				</LinkWithProject>
			</ButtonTw>
			<ButtonTw asChild variant="secondary" size="xss">
				<LinkWithProject to={routes.run({ runId })} target="_blank">
					<Icon name="BoxArrowRight" className="mr-1.5" />
					Run
				</LinkWithProject>
			</ButtonTw>
		</>
	);
}

const helper = createColumnHelper<ImportJsonLog>();

interface GetColumnsConfig {
	textWrap: boolean;
}

function getColumns({ textWrap }: GetColumnsConfig) {
	return [
		helper.display({
			id: 'line-number',
			header: '#',
			cell: ({ row }) => row.index + 1,
			meta: { className: 'text-[#8c959f] hover:text-primary hover:underline' }
		}),
		helper.accessor('asctime', {
			header: 'Time',
			cell: (info) => info.getValue()
		}),
		helper.accessor('levelname', {
			header: 'Level',
			cell: (info) => info.getValue()
		}),
		helper.accessor('module', {
			header: 'Module',
			cell: (info) => info.getValue()
		}),
		helper.accessor('message', {
			header: 'Message',
			cell: (info) => info.getValue(),
			meta: {
				className: textWrap
					? 'whitespace-pre-wrap break-words'
					: 'whitespace-nowrap'
			}
		})
	];
}

const getRowClassName = (level: string) => {
	const baseClasses = 'hover:bg-gray-600/20';

	if (level === 'CRITICAL') {
		return `${baseClasses} bg-red-950/30 text-red-100 hover:text-red-50 font-semibold`;
	}
	if (level === 'ERROR') {
		return `${baseClasses} bg-red-900/20 text-red-200 hover:text-red-100`;
	}
	if (level === 'WARN' || level === 'WARNING') {
		return `${baseClasses} bg-yellow-900/20 text-yellow-200 hover:text-yellow-100`;
	}
	if (level === 'DEBUG') {
		return `${baseClasses} text-gray-400 hover:text-gray-300`;
	}

	return `${baseClasses} text-gray-200 hover:text-gray-50`;
};

export interface ImportLogTableProps {
	logs: ImportJsonLog[];
	textWrap?: boolean;
}

export const ImportLogTable = (props: ImportLogTableProps) => {
	const { textWrap = true, logs } = props;

	const table = useReactTable<ImportJsonLog>({
		data: logs,
		columns: getColumns({ textWrap }),
		getCoreRowModel: getCoreRowModel()
	});

	return (
		<div className="font-mono text-xs leading-5 pb-12 px-2 flex-1 h-full overflow-auto">
			<table className="w-full border-collapse">
				{table.getHeaderGroups().map((group) => (
					<thead key={group.id}>
						<tr>
							{group.headers.map((header) => (
								<th
									key={header.id}
									className={cn(
										'px-1 py-2 text-left text-gray-400 font-semibold sticky top-0',
										BG_CLASS
									)}
								>
									{flexRender(
										header.column.columnDef.header,
										header.getContext()
									)}
								</th>
							))}
						</tr>
					</thead>
				))}
				<tbody>
					{table.getRowModel().rows.map((row) => {
						return (
							<tr
								key={row.id}
								className={getRowClassName(row.original.levelname)}
							>
								{row.getVisibleCells().map((cell) => {
									const className = cell.column.columnDef.meta?.className ?? '';

									return (
										<td
											key={cell.id}
											className={cn(`px-1 whitespace-nowrap`, className)}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export {
	JsonLogContainer,
	ImportLogProvider,
	useImportLog,
	type JsonLogContainerProps
};
