/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { cn } from '@/shared/tailwind-ui';

/**
 * Animated "AI is working" label: a gradient sweeps across the text via
 * `background-clip: text` (see the `shimmer` keyframes in the tailwind preset).
 */
export function Shimmer({
	children,
	className
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<span
			className={cn(
				'inline-block animate-shimmer bg-gradient-to-r from-text-secondary via-text-primary to-text-secondary bg-[length:200%_100%] bg-clip-text text-transparent',
				className
			)}
		>
			{children}
		</span>
	);
}
