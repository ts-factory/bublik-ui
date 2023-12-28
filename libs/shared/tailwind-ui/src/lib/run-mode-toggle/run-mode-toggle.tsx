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
			<ButtonTw size="xss" variant="secondary" onClick={onToggleClick}>
				<div
					className={cn(
						'flex items-center justify-center transition-all',
						isFullMode ? '' : 'rotate-180'
					)}
				>
					<Icon name="ArrowLeanUp" />
				</div>
			</ButtonTw>
		</Tooltip>
	);
};
