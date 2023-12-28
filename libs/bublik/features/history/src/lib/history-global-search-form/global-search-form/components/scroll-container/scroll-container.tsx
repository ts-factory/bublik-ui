/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren, ReactNode } from 'react';

import {
	ScrollArea,
	ScrollAreaViewport,
	ScrollAreaScrollbar,
	ScrollAreaThumb,
	ScrollAreaCorner
} from '@/shared/tailwind-ui';

export interface FormScrollContainerProps {
	children?: ReactNode;
}

export const FormScrollContainer = ({ children }: PropsWithChildren) => {
	return (
		<ScrollArea className="h-screen">
			<ScrollAreaViewport className="h-full [&>div]:h-full">
				<div className="w-[768px] h-screen">{children}</div>
			</ScrollAreaViewport>
			<ScrollAreaScrollbar orientation="vertical" forceMount>
				<ScrollAreaThumb />
			</ScrollAreaScrollbar>
			<ScrollAreaScrollbar orientation="horizontal">
				<ScrollAreaThumb />
			</ScrollAreaScrollbar>
			<ScrollAreaCorner />
		</ScrollArea>
	);
};
