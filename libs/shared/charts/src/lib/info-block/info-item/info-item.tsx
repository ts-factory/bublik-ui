/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode } from 'react';

import { cn } from '@/shared/tailwind-ui';

export interface InfoItemProps {
	icon?: ReactNode;
	label: string;
	value: string;
	isError?: boolean;
}

export const InfoItem: FC<InfoItemProps> = ({
	icon,
	label,
	value,
	isError
}) => {
	const bgColor =
		typeof isError !== 'undefined'
			? isError
				? 'bg-badge-5'
				: 'bg-badge-3'
			: 'bg-primary-wash';

	const color =
		typeof isError !== 'undefined'
			? isError
				? 'text-text-unexpected'
				: 'text-text-expected'
			: 'text-text-primary';

	return (
		<div className="flex items-center gap-2.5 py-[5px] px-3 border border-border-primary rounded">
			{icon && (
				<div className="grid place-items-center text-text-menu">{icon}</div>
			)}
			<span className="font-semibold leading-[0.875rem] text-text-primary text-[0.75rem]">
				{label}
			</span>
			<div className={cn('flex p-1 rounded', bgColor)}>
				<span
					className={cn(
						'text-[0.6875rem] font-medium leading-[0.875rem]',
						color
					)}
				>
					{value}
				</span>
			</div>
		</div>
	);
};
