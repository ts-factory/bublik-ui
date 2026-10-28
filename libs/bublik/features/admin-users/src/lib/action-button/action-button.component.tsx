/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, ComponentPropsWithoutRef, ComponentProps } from 'react';

import { ButtonTw, Icon, cn } from '@/shared/tailwind-ui';
import {
	ICON_ONLY_BUTTON_CLASS,
	ICON_ONLY_ICON_SIZE
} from '@/bublik/features/result-classification';

/** A row's icon-only action, drawn as the Issues and Rules tables draw theirs. */
export const ActionButton = forwardRef<
	HTMLButtonElement,
	ComponentPropsWithoutRef<typeof ButtonTw> & {
		icon: ComponentProps<typeof Icon>['name'];
	}
>(({ icon, className, variant = 'secondary', ...props }, ref) => {
	return (
		<ButtonTw
			variant={variant}
			size="xss"
			className={cn('justify-center', ICON_ONLY_BUTTON_CLASS, className)}
			{...props}
			ref={ref}
		>
			<Icon name={icon} size={ICON_ONLY_ICON_SIZE} />
		</ButtonTw>
	);
});
