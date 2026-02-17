/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ComponentProps } from 'react';

import { getErrorViewModel } from '@/services/bublik-api';
import { State, cn } from '@/shared/tailwind-ui';

interface BublikErrorStateProps {
	error: unknown;
	className?: string;
	iconClassName?: string;
	iconSize?: number;
	iconName?: ComponentProps<typeof State.Icon>['name'];
}

function BublikErrorState(props: BublikErrorStateProps) {
	const { error, className, iconClassName, iconSize = 24, iconName } = props;
	const { status, title, description, details } = getErrorViewModel(error);

	const stateTitle = `${status} ${title}`;
	const shouldRenderDetailsList = details.length > 1;

	return (
		<State.Root className={className}>
			<State.Content className={cn('w-full max-w-[420px]')}>
				<State.Icon name={iconName} size={iconSize} className={iconClassName} />
				<State.Title>{stateTitle}</State.Title>
				{shouldRenderDetailsList ? (
					<State.List>
						{details.map((detail, idx) => (
							<State.ListItem key={`${detail}_${idx}`}>{detail}</State.ListItem>
						))}
					</State.List>
				) : (
					<State.Description>{description}</State.Description>
				)}
			</State.Content>
		</State.Root>
	);
}

export { BublikErrorState };
