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

import { getErrorMessage, useGetImportLogQuery } from '@/services/bublik-api';
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
import { useCopyToClipboard } from '@/shared/hooks';
import { routes } from '@/router';
import { config } from '@/bublik/config';
import { LinkWithProject } from '@/bublik/features/projects';

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
					className="w-[60vw] flex flex-col"
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

	if (isLoading) return <Skeleton className="w-full h-[90vh] trounded-md" />;

	if (!data) {
		return <div className="grid place-items-center h-full">Not Log Found</div>;
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
				<div className="flex gap-4 items-center">
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
					<button
						className="p-0.5 rounded-md hover:bg-primary-wash text-primary"
						onClick={async () => {
							if (!data) return;
							await copy(data.map((d) => d.message.trim()).join('\n'));
						}}
					>
						<Icon name="PaperStack" size={20} />
					</button>
					<DialogClose className="p-0.5 rounded-md hover:bg-primary-wash hover:text-primary text-text-menu">
						<Icon name="CrossSimple" size={20} />
					</DialogClose>
				</div>
			</CardHeader>
			<div className="relative h-full">
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
					className={cn('flex-grow overflow-auto h-full', BG_CLASS)}
					ref={scrollRef}
				>
					<ImportLogTable logs={data} />
				</div>
			</div>
		</>
	);
};

interface ImportLogErrorProps {
	error: unknown;
}

function ImportLogError({ error }: ImportLogErrorProps) {
	const { status, title, description } = getErrorMessage(error);

	return (
		<div className="grid place-items-center h-full">
			<div className="flex flex-col items-center text-center">
				<Icon
					name="TriangleExclamationMark"
					size={24}
					className="text-text-unexpected"
				/>
				<h3 className="mt-2 text-sm font-medium text-gray-900">
					{status} {title}
				</h3>
				<p className="mt-1 text-sm text-gray-500">{description}</p>
			</div>
		</div>
	);
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

export interface ImportLogTableProps {
	logs: ImportJsonLog[];
}

export const ImportLogTable = (props: ImportLogTableProps) => {
	return (
		<ul className={'font-mono text-xs leading-5 pb-12 pt-4 flex-1'}>
			{props.logs.map((lg, idx) => {
				const lineNumber = idx + 1;

				return (
					<li
						key={lineNumber}
						className="flex hover:bg-gray-600/20 text-gray-200 hover:text-gray-50"
					>
						<span className="shrink-0 w-12 overflow-hidden text-right overflow-ellipsis whitespace-nowrap select-none text-[#8c959f] hover:text-primary hover:underline">
							{lineNumber}
						</span>
						<span className="ml-3 overflow-x-auto whitespace-pre-wrap">
							{lg.message}
						</span>
					</li>
				);
			})}
		</ul>
	);
};

export {
	JsonLogContainer,
	ImportLogProvider,
	useImportLog,
	type JsonLogContainerProps
};
