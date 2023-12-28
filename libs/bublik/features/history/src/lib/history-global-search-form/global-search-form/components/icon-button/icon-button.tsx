/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps } from 'react';

import { cn, Icon, Tooltip } from '@/shared/tailwind-ui';

export type IconButtonProps = ComponentProps<typeof Icon> & {
	onClick: () => void;
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
					'rounded text-bg-compromised hover:bg-primary-wash hover:text-primary p-0.5 transition-colors',
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
