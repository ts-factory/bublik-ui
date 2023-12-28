/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, FC } from 'react';

import { cn } from '../utils';

export type IframeToOldBublikProps = ComponentPropsWithRef<'iframe'>;

export const IframeToOldBublik: FC<IframeToOldBublikProps> = (props) => {
	return (
		<iframe
			className={cn('w-full h-full border-none', props.className)}
			title="Old Bublik"
			{...props}
		/>
	);
};
