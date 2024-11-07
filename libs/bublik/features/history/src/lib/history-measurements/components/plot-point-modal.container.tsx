/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, Dispatch, PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

import { Point } from '@/shared/types';
import {
	ButtonTw,
	Dialog,
	DialogClose,
	DialogOverlay,
	dialogOverlayStyles,
	DialogPortal,
	DialogTitle,
	DrawerContent,
	DrawerRoot,
	Icon,
	ModalContent
} from '@/shared/tailwind-ui';
import { formatLabel } from '@/shared/charts';
import { routes } from '@/router';

export interface PointDialogProps {
	point: Point;
	isDialogOpen: boolean;
	setIsDialogOpen: Dispatch<boolean>;
}

export const PointDialog = (props: PropsWithChildren<PointDialogProps>) => {
	const { isDialogOpen, setIsDialogOpen, point, children } = props;

	return (
		<DrawerRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogPortal>
				<DrawerContent className="bg-white overflow-auto max-w-[70vw]">
					<div className="flex items-center justify-between px-4 py-2 sticky top-0 bg-white z-10 border-b border-border-primary">
						<DialogTitle className="text-[0.875rem] font-semibold leading-[1.125rem]">
							Run Info
						</DialogTitle>
						<div className="flex items-center gap-1">
							<ButtonTw variant="secondary" size="xss" asChild>
								<Link
									to={routes.log({
										runId: point.run_id,
										focusId: point.result_id
									})}
									target="_blank"
								>
									<Icon name="BoxArrowRight" className="mr-1.5" />
									Log
								</Link>
							</ButtonTw>
							<ButtonTw variant="secondary" size="xss" asChild>
								<Link to={routes.run({ runId: point.run_id })} target="_blank">
									<Icon name="BoxArrowRight" className="mr-1.5" />
									Run
								</Link>
							</ButtonTw>
							<ButtonTw variant="secondary" size="xss" asChild>
								<Link
									to={routes.measurements({
										runId: point.run_id,
										resultId: point.result_id
									})}
									target="_blank"
								>
									<Icon name="BoxArrowRight" className="mr-1.5" />
									Measurement
								</Link>
							</ButtonTw>
							<DialogClose className="rounded text-bg-compromised bg-transparent hover:bg-primary-wash hover:text-primary p-[5.5px]">
								<Icon name="Cross" />
							</DialogClose>
						</div>
					</div>
					<div className="min-h-[320px] flex flex-col border-b border-border-primary">
						{children}
					</div>
					<div className="flex flex-col">
						<div className="border-b border-border-primary p-4">
							<h2 className="text-[0.875rem] font-semibold leading-[1.125rem] mb-4">
								Measurements Info
							</h2>
							<ul className="flex flex-col gap-4">
								{Object.entries(point).map(([name, value]) => {
									return (
										<li
											key={name}
											className="grid grid-flow-col items-center grid-cols-[minmax(120px,_max-content)_48px_1fr]"
										>
											<span className="text-[0.6875rem] font-medium leading-[0.875rem] text-text-menu">
												{formatLabel(name)}:
											</span>
											<span className="text-[0.6875rem] font-medium leading-[0.875rem] col-start-3">
												{typeof value === 'string' || typeof value === 'number'
													? value
													: JSON.stringify(value)}
											</span>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				</DrawerContent>
			</DialogPortal>
		</DrawerRoot>
	);
};

export type PlotPointModalContainerProps = ComponentProps<typeof PointDialog>;

export const PlotPointModalContainer = (
	props: PlotPointModalContainerProps
) => {
	const { isDialogOpen, setIsDialogOpen, point, children } = props;

	return (
		<PointDialog
			point={point}
			isDialogOpen={isDialogOpen}
			setIsDialogOpen={setIsDialogOpen}
		>
			{children}
		</PointDialog>
	);
};
