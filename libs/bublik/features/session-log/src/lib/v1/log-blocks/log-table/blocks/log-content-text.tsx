/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { cn } from '@/shared/tailwind-ui';
import { LogContentTextBlock } from '@/shared/types';

import { useSettingsContext } from '../settings.context';

export const BlockLogContentText = (props: LogContentTextBlock) => {
	const settings = useSettingsContext();

	return (
		<div
			className={cn(
				'inline',
				settings.isWordBreakEnabled
					? 'whitespace-pre-wrap overflow-wrap-anywhere'
					: 'whitespace-pre'
			)}
		>
			{props.content}
		</div>
	);
};
