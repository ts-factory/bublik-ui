/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { cn } from '@/shared/tailwind-ui';

export interface KeyListProps {
	items: { name?: string; url?: string }[];
}

export const KeyList = ({ items = [] }: KeyListProps) => {
	if (!items.length) return;

	return (
		<ul className="flex flex-wrap gap-1">
			{items.map(({ name, url }, idx) => {
				const As = url ? 'a' : 'div';

				return (
					<li key={idx}>
						<As
							className={cn(
								'inline-flex items-center w-fit py-0.5 px-2 rounded border text-[0.75rem] font-medium transition-colors bg-transparent border-border-primary',
								url && 'underline text-primary'
							)}
							{...(url && { href: url, target: '_blank', rel: 'noreferrer' })}
						>
							{name}
						</As>
					</li>
				);
			})}
		</ul>
	);
};
