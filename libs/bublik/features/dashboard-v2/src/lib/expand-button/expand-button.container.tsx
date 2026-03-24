/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithoutRef } from 'react';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { usePrefetch } from '@/services/bublik-api';
import { cn, Icon } from '@/shared/tailwind-ui';

type ExpandButtonContainerProps = ComponentPropsWithoutRef<'button'> & {
	runId: string | number;
	isExpanded: boolean;
};

export const ExpandButtonContainer = ({
	runId,
	isExpanded,
	onClick,
	...props
}: ExpandButtonContainerProps) => {
	const prefetch = usePrefetch('getRunFallingFreq');

	const handleClick: ComponentPropsWithoutRef<'button'>['onClick'] = (
		event
	) => {
		trackEvent(analyticsEventNames.dashboardRowExpandToggle, {
			action: isExpanded ? 'collapse' : 'expand',
			source: 'expand_button'
		});

		onClick?.(event);
	};

	return (
		<div className="w-full h-full grid place-items-center">
			<button
				className={cn(
					'text-primary hover:bg-primary-wash rounded',
					isExpanded &&
						'bg-primary text-white hover:bg-primary hover:text-white'
				)}
				onClick={handleClick}
				onMouseEnter={() => prefetch(Number(runId))}
				{...props}
			>
				<Icon name="ThreeDotsVertical" />
			</button>
		</div>
	);
};
