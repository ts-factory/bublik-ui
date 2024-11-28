/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import {
	ComponentProps,
	PropsWithChildren,
	useCallback,
	useState
} from 'react';
import { Link } from 'react-router-dom';

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
	getBugProps,
	Icon,
	NewBugButton,
	Skeleton
} from '@/shared/tailwind-ui';
import { routes } from '@/router';
import {
	getErrorMessage,
	useGetLogJsonQuery,
	useGetRunDetailsQuery,
	useGetTreeByRunIdQuery
} from '@/services/bublik-api';
import {
	LogTableContextProvider,
	SessionRoot
} from '@/bublik/features/session-log';
import { useControllableState } from '@/shared/hooks';

interface LogPreviewContainerProps {
	logName?: string;
	runId?: number;
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
									<div className="flex-1">
										<CardHeader label={logName}>
											<div className="flex items-center gap-4">
												{runId && measurementId ? (
													<ButtonTw variant="secondary" size="xss" asChild>
														<Link
															to={routes.measurements({ runId, resultId })}
															target="_blank"
														>
															<Icon name="BoxArrowRight" className="mr-1.5" />
															Measurement
														</Link>
													</ButtonTw>
												) : null}
												{runId ? (
													<ButtonTw asChild variant="secondary" size="xss">
														<Link to={routes.run({ runId })} target="_blank">
															<Icon name="BoxArrowRight" className="mr-1.5" />
															Run
														</Link>
													</ButtonTw>
												) : null}
												{runId ? (
													<ButtonTw asChild variant="secondary" size="xss">
														<Link
															to={routes.log({ runId, focusId: resultId })}
															target="_blank"
														>
															<Icon name="BoxArrowRight" className="mr-1.5" />
															Log
														</Link>
													</ButtonTw>
												) : null}
												{resultId && runId ? (
													<NewBug runId={runId} resultId={resultId} />
												) : null}
												<DialogClose asChild>
													<ButtonTw variant={'secondary'} size={'xss'}>
														<Icon name="CrossSimple" size={20} />
													</ButtonTw>
												</DialogClose>
											</div>
										</CardHeader>
									</div>
									{resultId ? (
										<LogPreview resultId={resultId} />
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

interface NewBugProps {
	runId: number;
	resultId: number;
}

function NewBug(props: NewBugProps) {
	const { data: details } = useGetRunDetailsQuery(props.runId);
	const { data: log } = useGetLogJsonQuery({ id: props.resultId });
	const { data: tree } = useGetTreeByRunIdQuery(String(props.runId));

	if (!details || !tree || !log) return null;

	return (
		<NewBugButton
			{...getBugProps({
				runId: props.runId,
				id: props.resultId ?? Number(props.runId),
				log,
				tree,
				details
			})}
		/>
	);
}

interface LogPreviewProps {
	resultId: number;
}

function LogPreview(props: LogPreviewProps) {
	const { resultId } = props;
	const [page, setPage] = useState<number | undefined>();
	const { data, error, isLoading, isFetching } = useGetLogJsonQuery({
		id: resultId,
		page: typeof page !== 'undefined' ? page.toString() : undefined
	});

	const handlePageClick = useCallback(
		(_: string, page: number) => {
			setPage(page);
		},
		[setPage]
	);

	if (isLoading) {
		return <LogPreviewLoading />;
	}

	if (error) {
		return <LogPreviewError error={error} />;
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
			<LogTableContextProvider onPageClick={handlePageClick}>
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

function LogPreviewLoading() {
	return (
		<div className="w-full h-full p-2">
			<Skeleton className="w-full h-full rounded" />
		</div>
	);
}

function LogPreviewEmpty() {
	return <div>No log data...</div>;
}

export { LogPreviewContainer };
