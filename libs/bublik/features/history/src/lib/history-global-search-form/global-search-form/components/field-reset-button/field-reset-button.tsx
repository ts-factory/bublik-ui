/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { MouseEventHandler } from 'react';

import { cn } from '@/shared/tailwind-ui';

import { IconButton } from '../icon-button';

export interface FieldResetButtonProps {
	onClick: MouseEventHandler<HTMLButtonElement>;
	helpMessage?: string;
	className?: string;
}

const FIELD_RESET_BUTTON_CLASS_NAME =
	'!h-[22px] !w-[22px] hover:text-text-unexpected hover:bg-red-100';

function FieldResetButton({
	onClick,
	helpMessage = 'Clear field',
	className
}: FieldResetButtonProps) {
	return (
		<IconButton
			name="Bin"
			size={14}
			helpMessage={helpMessage}
			onClick={onClick}
			className={cn(FIELD_RESET_BUTTON_CLASS_NAME, className)}
		/>
	);
}

export { FieldResetButton };
