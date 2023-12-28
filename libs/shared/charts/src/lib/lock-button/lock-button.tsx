/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { ButtonTw } from '@/shared/tailwind-ui';

export interface LockButtonProps {
	isLockedMode: boolean;
	onClick: () => void;
}

export const LockButton: FC<LockButtonProps> = ({ isLockedMode, onClick }) => {
	return (
		<ButtonTw
			variant="secondary"
			size="xss"
			state={isLockedMode && 'active'}
			onClick={onClick}
			className="min-w-[64px] justify-center"
		>
			{isLockedMode ? 'Unpin' : 'Pin'}
		</ButtonTw>
	);
};
