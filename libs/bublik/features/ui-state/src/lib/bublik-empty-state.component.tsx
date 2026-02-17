/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ComponentProps, ReactNode } from 'react';

import { State } from '@/shared/tailwind-ui';

interface BublikEmptyStateProps {
	title: ReactNode;
	description?: ReactNode;
	className?: string;
	contentClassName?: string;
	titleClassName?: string;
	descriptionClassName?: string;
	iconClassName?: string;
	iconName?: ComponentProps<typeof State.Icon>['name'];
	iconSize?: number;
	hideIcon?: boolean;
}

function BublikEmptyState(props: BublikEmptyStateProps) {
	const {
		title,
		description,
		className,
		contentClassName,
		titleClassName,
		descriptionClassName,
		iconClassName = 'text-primary',
		iconName,
		iconSize = 24,
		hideIcon = false
	} = props;

	return (
		<State.Root className={className}>
			<State.Content className={contentClassName}>
				{hideIcon ? null : (
					<State.Icon
						name={iconName}
						size={iconSize}
						className={iconClassName}
					/>
				)}
				<State.Title className={titleClassName}>{title}</State.Title>
				{description ? (
					<State.Description className={descriptionClassName}>
						{description}
					</State.Description>
				) : null}
			</State.Content>
		</State.Root>
	);
}

export { BublikEmptyState };
