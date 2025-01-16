/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentProps,
	createContext,
	ElementRef,
	PropsWithChildren,
	useContext,
	useEffect,
	useRef,
	useState
} from 'react';
import { StringParam, useQueryParam } from 'use-query-params';

import { useGetImportLogQuery } from '@/services/bublik-api';
import {
	DialogClose,
	DialogPortal,
	DrawerContent,
	DrawerRoot,
	Icon,
	Skeleton,
	toast
} from '@/shared/tailwind-ui';
import { ImportJsonLog } from '@/shared/types';
import { useCopyToClipboard } from '@/shared/hooks';
import { skipToken } from '@reduxjs/toolkit/query';

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
	const [enablePolling, setEnablePolling] = useState(false);

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
					className="bg-[#24292f] w-[60vw] flex flex-col"
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

export interface ImportLogTableContainerProps {
	taskId: ComponentProps<typeof JsonLogContainer>['taskId'];
	enablePolling: ComponentProps<typeof JsonLogContainer>['enablePolling'];
}

export const ImportLogTableContainer = (
	props: ImportLogTableContainerProps
) => {
	const { taskId } = props;
	const { data, isLoading, isFetching, error } = useGetImportLogQuery(
		taskId ? taskId : skipToken,
		{
			pollingInterval: props.enablePolling ? 5000 : 0
		}
	);

	const scrollRef = useRef<ElementRef<'div'>>(null);

	const [, copy] = useCopyToClipboard({
		onSuccess: () => toast.success('Copied to clipboard')
	});

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		if (!props.enablePolling) return;

		setTimeout(
			() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }),
			0
		);
	}, [props.enablePolling, isFetching]);

	if (error) return <div>Error..</div>;

	if (isLoading) return <Skeleton className="w-full h-[90vh] trounded-md" />;

	if (!data) return <div>Empty </div>;

	return (
		<>
			<div className="px-4 py-2 flex gap-4 items-center justify-between">
				<h2 className="text-gray-300 text-lg">Import: {taskId}</h2>
				<div className="flex gap-4 items-center">
					{props.enablePolling ? (
						<Icon
							name="InformationCircleProgress"
							size={24}
							className="text-gray-400 p-0.5 animate-spin"
						/>
					) : null}
					<button
						className="p-0.5 text-gray-400 hover:bg-gray-600/20 rounded-md hover:text-gray-200"
						onClick={async () => {
							if (!data) return;
							await copy(data.map((d) => d.message.trim()).join('\n'));
						}}
					>
						<Icon name="PaperStack" size={20} />
					</button>
					<DialogClose className="p-0.5 text-gray-400 hover:bg-gray-600/20 rounded-md hover:text-gray-200">
						<Icon name="CrossSimple" size={20} />
					</DialogClose>
				</div>
			</div>
			<div className="px-4 pt-6 pb-4 flex-grow overflow-auto" ref={scrollRef}>
				<ImportLogTable logs={data} />
			</div>
		</>
	);
};

export interface ImportLogTableProps {
	logs: ImportJsonLog[];
}

export const ImportLogTable = (props: ImportLogTableProps) => {
	return (
		<ul className="font-mono text-xs leading-5">
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
