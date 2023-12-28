/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LogContentMemoryDump } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

import { useSettingsContext } from '../settings.context';

export const BlockLogContentMemoryDump = (props: LogContentMemoryDump) => {
	const { isWordBreakEnabled } = useSettingsContext();

	return (
		<div
			className={cn(
				isWordBreakEnabled ? 'overflow-wrap-anywhere inline' : 'whitespace-pre'
			)}
		>
			{props.dump.map((row) => row.join(' ')).join('\n')}
		</div>
	);
};
