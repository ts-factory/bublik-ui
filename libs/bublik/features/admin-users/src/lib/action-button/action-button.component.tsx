/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, ComponentPropsWithoutRef, ComponentProps } from 'react';

import { Icon, cn } from '@/shared/tailwind-ui';

export const ActionButton = forwardRef<
	HTMLButtonElement,
	ComponentPropsWithoutRef<'button'> & {
		icon: ComponentProps<typeof Icon>['name'];
	}
>(({ className, ...props }, ref) => {
	return (
		<button
			className={cn(
				'p-0.5 hover:bg-primary-wash text-primary rounded-md',
				className
			)}
			{...props}
			ref={ref}
		>
			<Icon name={props.icon} size={24} />
		</button>
	);
});
