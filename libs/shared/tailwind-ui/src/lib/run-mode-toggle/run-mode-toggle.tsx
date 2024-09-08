/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { ButtonTw } from '../button';
import { Icon } from '../icon';
import { Tooltip } from '../tooltip';
import { cn } from '../utils';

export interface ToggleInfoButtonProps {
	isFullMode: boolean;
	onToggleClick: () => void;
}

export const RunModeToggle: FC<ToggleInfoButtonProps> = ({
	isFullMode,
	onToggleClick
}) => {
	return (
		<Tooltip content="Toggle mode">
			<ButtonTw
				size="xss"
				variant={isFullMode ? 'primary' : 'secondary'}
				onClick={onToggleClick}
			>
				<div
					className={cn(
						'flex items-center justify-center mr-1.5',
						isFullMode ? '' : 'rotate-180'
					)}
				>
					<Icon name="ArrowLeanUp" />
				</div>
				<span className="w-[6ch] text-left">
					{isFullMode ? 'Hide' : 'Expose'}
				</span>
			</ButtonTw>
		</Tooltip>
	);
};
