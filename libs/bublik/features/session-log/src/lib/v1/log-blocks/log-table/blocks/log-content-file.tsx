/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';

import { LogContentFile } from '@/shared/types';
import { cn } from '@/shared/tailwind-ui';

import { useSettingsContext } from '../settings.context';

const rootClassName =
	'p-2 border rounded-md bg-gray-100/75 border-border-primary';

const WithWrapFile = (props: PropsWithChildren) => {
	return (
		<div className={cn(rootClassName, 'w-fit')}>
			<span className={cn('whitespace-pre-wrap overflow-wrap-anywhere')}>
				{props.children}
			</span>
		</div>
	);
};

export const BlockLogContentFile = (props: LogContentFile) => {
	const { isWordBreakEnabled } = useSettingsContext();

	if (isWordBreakEnabled) return <WithWrapFile>{props.content}</WithWrapFile>;

	return <pre className={cn('w-fit', rootClassName)}>{props.content}</pre>;
};
