/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, ElementRef, useEffect, useRef } from 'react';

import { useGetImportLogQuery } from '@/services/bublik-api';
import {
	Dialog,
	DialogClose,
	DialogTrigger,
	Icon,
	ModalContent,
	Skeleton,
	toast
} from '@/shared/tailwind-ui';
import { ImportJsonLog } from '@/shared/types';
import { useCopyToClipboard } from '@/shared/hooks';

export interface JsonLogContainerProps {
	taskId: string;
	enablePolling?: boolean;
}

export const JsonLogContainer = ({
	taskId,
	enablePolling
}: JsonLogContainerProps) => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<button className="relative inline-flex items-center justify-start px-2 w-fit transition-all appearance-none select-none whitespace-nowrap text-primary bg-primary-wash rounded-md gap-1 h-[1.625rem] border-2 border-transparent hover:border-[#94b0ff]">
					<Icon name="BoxArrowRight" />
					<span>Logs</span>
				</button>
			</DialogTrigger>
			<ModalContent className="bg-[#24292f] rounded-lg w-[90vw] flex flex-col">
				<ImportLogTableContainer
					taskId={taskId}
					enablePolling={enablePolling}
				/>
			</ModalContent>
		</Dialog>
	);
};

export interface ImportLogTableContainerProps {
	taskId: ComponentProps<typeof JsonLogContainer>['taskId'];
	enablePolling: ComponentProps<typeof JsonLogContainer>['enablePolling'];
}

export const ImportLogTableContainer = (
	props: ImportLogTableContainerProps
) => {
	const { taskId } = props;
	const { data, isLoading, isFetching, error } = useGetImportLogQuery(taskId, {
		pollingInterval: props.enablePolling ? 5000 : 0
	});

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

	if (isLoading) return <Skeleton className="w-full h-[90vh] rounded-md" />;

	if (!data) return <div>Empty </div>;

	return (
		<>
			<div className="px-4 py-2 flex gap-4 items-center justify-between">
				<h2 className="text-gray-300 text-lg">Logs</h2>
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
