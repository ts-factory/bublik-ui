/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';

import { Icon } from '../icon';
import { cn } from '../utils';

export interface ErrorPageProps {
	label: string;
	message: ReactNode;
	actions: ReactNode;
	error?: ReactNode;
}

export const ErrorPage = ({
	label,
	message,
	actions,
	error
}: ErrorPageProps) => {
	return (
		<div className={cn('w-full h-screen p-2 overflow-auto')}>
			<div
				className={cn(
					'flex flex-col items-center w-full h-full p-4 bg-white rounded-lg',
					!error && 'justify-center'
				)}
			>
				<div>
					<Icon
						name="TriangleExclamationMark"
						size={192}
						className="text-text-menu mb-[40px]"
					/>
					<h2 className="mb-5 text-4xl font-semibold text-text-primary">
						{label}
					</h2>
					<p className="mb-5 text-xl font-medium text-text-secondary">
						{message}
					</p>
					<div className="flex items-center justify-between w-full gap-4">
						{actions}
					</div>
				</div>
				{error ? <div className="w-full mt-4">{error}</div> : null}
			</div>
		</div>
	);
};
