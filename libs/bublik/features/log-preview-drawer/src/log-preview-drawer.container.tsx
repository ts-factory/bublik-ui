/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import {
	ComponentProps,
	PropsWithChildren,
	useCallback,
	useState
} from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	ButtonTw,
	CardHeader,
	cn,
	DialogClose,
	DialogOverlay,
	dialogOverlayStyles,
	DialogPortal,
	DrawerContent,
	DrawerRoot,
	DrawerTrigger,
	Icon,
	RunRunning
} from '@/shared/tailwind-ui';
import { routes } from '@/router';
import {
	getErrorMessage,
	useGetLogJsonQuery,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import {
	LogTableContextProvider,
	SessionLoading,
	SessionRoot
} from '@/bublik/features/session-log';
import { useControllableState } from '@/shared/hooks';
import { LogAttachmentsContainer } from '@/bublik/features/log-artifacts';
import { RUN_STATUS } from '@/shared/types';
import { LinkWithProject } from '@/bublik/features/projects';

import { NewBugContainer } from './log-preview-new-bug.container';

interface LogPreviewContainerProps {
	logName?: string;
	runId: number;
	resultId?: number;
	// Alias for result id if we want to show link to measurement page
	measurementId?: number;
	open?: ComponentProps<typeof DrawerRoot>['open'];
	onOpenChange?: ComponentProps<typeof DrawerRoot>['onOpenChange'];
}

function LogPreviewContainer(
	props: PropsWithChildren<LogPreviewContainerProps>
) {
	const {
		resultId,
		runId,
		logName = 'Log',
		open,
		measurementId,
		onOpenChange,
		children
	} = props;

	const [_open, _setOpen] = useControllableState({
		prop: open,
		defaultProp: open,
		onChange: onOpenChange
	});
	const [page, setPage] = useState<number | undefined>();
	const resolvedPage = page === 1 ? undefined : page;

	const handlePageClick = useCallback(
		(_: string, page: number) => {
			setPage(page);
		},
		[setPage]
	);

	return (
		<DrawerRoot open={open} onOpenChange={_setOpen}>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			{resultId ? <DialogOverlay className={dialogOverlayStyles()} /> : null}
			{resultId ? (
				<DialogPortal>
					<DrawerContent asChild>
						<div className="bg-white flex flex-col h-[95vh] w-[80vw]">
							{/* To fetch only on mount. Do not remove check */}
							{_open ? (
								<div className="h-full flex flex-col overflow-hidden">
									<CardHeader label={logName}>
										<div className="flex items-center gap-4">
											{resultId && runId ? (
												<LogAttachmentsContainer
													runId={runId}
													focusId={resultId}
												/>
											) : null}
											{runId ? (
												<ButtonTw asChild variant="secondary" size="xss">
													<LinkWithProject
														to={routes.log({ runId, focusId: resultId })}
														target="_blank"
													>
														<Icon name="BoxArrowRight" className="mr-1.5" />
														Log
													</LinkWithProject>
												</ButtonTw>
											) : null}
											{runId ? (
												<ButtonTw asChild variant="secondary" size="xss">
													<LinkWithProject
														to={routes.run({
															runId,
															targetIterationId: resultId
														})}
														target="_blank"
													>
														<Icon name="BoxArrowRight" className="mr-1.5" />
														Run
													</LinkWithProject>
												</ButtonTw>
											) : null}
											{runId && measurementId ? (
												<ButtonTw variant="secondary" size="xss" asChild>
													<LinkWithProject
														to={routes.measurements({ runId, resultId })}
														target="_blank"
													>
														<Icon name="BoxArrowRight" className="mr-1.5" />
														Result
													</LinkWithProject>
												</ButtonTw>
											) : null}
											{resultId && runId ? (
												<NewBugContainer runId={runId} resultId={resultId} />
											) : null}
											<DialogClose asChild>
												<ButtonTw variant={'secondary'} size={'xss'}>
													<Icon name="CrossSimple" size={20} />
												</ButtonTw>
											</DialogClose>
										</div>
									</CardHeader>

									{resultId ? (
										<LogPreview
											key={`${resultId}_${page}`}
											runId={runId}
											resultId={resultId}
											page={resolvedPage}
											onPageChange={handlePageClick}
										/>
									) : (
										<div>No result ID provided!</div>
									)}
								</div>
							) : null}
						</div>
					</DrawerContent>
				</DialogPortal>
			) : null}
		</DrawerRoot>
	);
}

interface LogPreviewProps {
	runId: number;
	resultId: number;
	page?: number;
	onPageChange?: (_: string, page: number) => void;
}

function LogPreview(props: LogPreviewProps) {
	const { runId, resultId, page, onPageChange } = props;
	const { data, error, isLoading, isFetching } = useGetLogJsonQuery({
		id: resultId,
		page: typeof page !== 'undefined' ? page.toString() : undefined
	});
	const {
		data: runDetails,
		isLoading: runDetailsLoading,
		error: runDetailsError
	} = useGetRunDetailsQuery(runId ?? skipToken);

	if (isLoading || runDetailsLoading) {
		return <SessionLoading />;
	}

	if (runDetails?.conclusion === RUN_STATUS.Running) {
		return (
			<div className="flex justify-center items-center w-full h-full">
				<RunRunning />
			</div>
		);
	}

	if (error || runDetailsError) {
		return <LogPreviewError error={error || runDetailsError} />;
	}

	if (!data) {
		return <LogPreviewEmpty />;
	}

	return (
		<div
			className={cn(
				'overflow-auto flex-grow px-2 isolate',
				isFetching && 'pointer-events-none opacity-40'
			)}
		>
			<LogTableContextProvider onPageClick={onPageChange}>
				<SessionRoot root={data} />
			</LogTableContextProvider>
		</div>
	);
}

interface LogPreviewErrorProps {
	error: unknown;
}

function LogPreviewError({ error }: LogPreviewErrorProps) {
	const { description, status, title } = getErrorMessage(error);

	return (
		<div className="mx-auto w-full h-full grid place-items-center">
			<div className="flex items-center gap-4">
				<Icon
					name="TriangleExclamationMark"
					size={48}
					className="text-text-unexpected"
				/>
				<div className="">
					<h1 className="text-2xl font-semibold">
						{status} {title}
					</h1>
					<p>{description}</p>
				</div>
			</div>
		</div>
	);
}

function LogPreviewEmpty() {
	return <div>No log data...</div>;
}

export { LogPreviewContainer };
