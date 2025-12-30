/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import {
	HoverCard,
	HoverCardContent,
	HoverCardPortal,
	HoverCardTrigger
} from '@radix-ui/react-hover-card';

import { Icon, cn, popoverContentStyles } from '@/shared/tailwind-ui';

interface WarningsHoverCardProps {
	warnings?: string[];
}

function WarningsHoverCard({ warnings = [] }: WarningsHoverCardProps) {
	if (!warnings.length) return;

	return (
		<HoverCard openDelay={100}>
			<HoverCardTrigger asChild>
				<div className="text-text-unexpected rounded-md hover:bg-red-100 p-0.5 grid place-items-center">
					<Icon name="TriangleExclamationMark" size={20} />
				</div>
			</HoverCardTrigger>
			<HoverCardPortal>
				<HoverCardContent asChild sideOffset={4} side="right" align="start">
					<ul
						className={cn(
							'flex flex-col gap-2 z-10 bg-white rounded-md shadow-popover px-4 py-2',
							popoverContentStyles
						)}
					>
						{warnings.map((w) => (
							<li key={w} className="text-[0.875rem] leading-[1.125rem]">
								{w}
							</li>
						))}
					</ul>
				</HoverCardContent>
			</HoverCardPortal>
		</HoverCard>
	);
}

export { WarningsHoverCard };
export type { WarningsHoverCardProps };
