/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';

export interface InfoCardProps extends ComponentPropsWithRef<'div'> {
	header: string;
	message: string;
}

export const InfoCard = forwardRef<HTMLDivElement, InfoCardProps>(
	(props, ref) => {
		const { header, message } = props;

		return (
			<div
				className="flex items-center justify-center w-full h-screen"
				data-testid="info-card"
			>
				<div
					className="bg-white min-w-[600px] max-w-[768px] flex flex-col rounded-2xl shadow-2xl"
					ref={ref}
				>
					<div className="p-4 border-b border-border-primary">
						<h2>{header}</h2>
					</div>
					<div className="flex-1 p-4">
						<p>{message}</p>
					</div>
				</div>
			</div>
		);
	}
);
