/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, MouseEventHandler } from 'react';

import { cn, Icon, Tooltip } from '@/shared/tailwind-ui';

export type IconButtonProps = Omit<ComponentProps<typeof Icon>, 'onClick'> & {
	onClick: MouseEventHandler<HTMLButtonElement>;
	helpMessage: string;
};

export const IconButton = ({
	name,
	className,
	onClick,
	helpMessage,
	...props
}: IconButtonProps) => {
	return (
		<Tooltip content={helpMessage}>
			<button
				className={cn(
					'inline-flex h-7 w-7 items-center justify-center rounded-md text-text-menu hover:bg-primary-wash hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
					className
				)}
				onClick={onClick}
				type="button"
			>
				<Icon name={name} {...props} />
			</button>
		</Tooltip>
	);
};
