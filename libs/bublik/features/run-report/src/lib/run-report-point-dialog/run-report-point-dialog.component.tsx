import { ComponentProps, PropsWithChildren, useState } from 'react';
import { Link } from 'react-router-dom';

import {
	ButtonTw,
	DialogClose,
	DialogPortal,
	DialogTitle,
	DrawerContent,
	DrawerRoot,
	DrawerTrigger,
	Icon
} from '@/shared/tailwind-ui';
import { routes } from '@/router';
import { RunDetailsContainer } from '@/bublik/features/run-details';

interface RunReportPointDialog {
	runId: number;
	resultId?: number;
	open?: ComponentProps<typeof DrawerRoot>['open'];
	onOpenChange?: ComponentProps<typeof DrawerRoot>['onOpenChange'];
}

function RunReportPointDialog(props: PropsWithChildren<RunReportPointDialog>) {
	const { runId, resultId, children, ...restProps } = props;
	const [_open, setOpen] = useState(false);

	return (
		<DrawerRoot
			{...restProps}
			open={typeof restProps.open !== 'undefined' ? restProps.open : _open}
			onOpenChange={(o) => {
				if (!resultId) return;

				setOpen(o);
				restProps.onOpenChange?.(o);
			}}
		>
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DialogPortal>
				<DrawerContent className="bg-white overflow-auto max-w-[70vw]">
					<div className="flex items-center justify-between px-4 py-2 sticky top-0 bg-white z-10 border-b border-border-primary">
						<DialogTitle className="text-[0.875rem] font-semibold leading-[1.125rem]">
							Run Info
						</DialogTitle>
						<div className="flex items-center gap-1">
							<ButtonTw variant="secondary" size="xss" asChild>
								<Link
									to={routes.log({ runId, focusId: resultId })}
									target="_blank"
								>
									<Icon name="BoxArrowRight" className="mr-1.5" />
									Log
								</Link>
							</ButtonTw>
							<ButtonTw variant="secondary" size="xss" asChild>
								<Link to={routes.run({ runId: runId })} target="_blank">
									<Icon name="BoxArrowRight" className="mr-1.5" />
									Run
								</Link>
							</ButtonTw>
							{resultId ? (
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
							<DialogClose className="rounded text-bg-compromised bg-transparent hover:bg-primary-wash hover:text-primary p-[5.5px]">
								<Icon name="Cross" />
							</DialogClose>
						</div>
					</div>
					<div className="flex flex-col border-b border-border-primary">
						<RunDetailsContainer runId={runId} />
					</div>
				</DrawerContent>
			</DialogPortal>
		</DrawerRoot>
	);
}

export { RunReportPointDialog };
