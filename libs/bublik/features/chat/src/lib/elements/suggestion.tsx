/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { ButtonTw, cn } from '@/shared/tailwind-ui';

export function Suggestions({
	className,
	children
}: {
	className?: string;
	children: ReactNode;
}) {
	return (
		<div className={cn('flex flex-wrap justify-center gap-2', className)}>
			{children}
		</div>
	);
}

export function Suggestion({
	suggestion,
	onClick
}: {
	suggestion: string;
	onClick: (suggestion: string) => void;
}) {
	return (
		<ButtonTw
			variant="outline"
			size="xss"
			rounded="full"
			onClick={() => onClick(suggestion)}
		>
			{suggestion}
		</ButtonTw>
	);
}
