/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, RefObject } from 'react';

import { BadgeItem } from '../types';
import { EditPopover } from './edit-popover';
import { cn } from '../../utils';

export interface BadgeListProps {
	label?: string;
	badges: BadgeItem[];
}

export const BadgeList = ({ label, badges }: BadgeListProps) => {
	const listRef = useRef<HTMLUListElement>(null);

	return (
		<ul
			className={cn(
				'flex flex-wrap items-center gap-1',
				badges.length ? 'pb-1 px-2 pt-2' : ''
			)}
			aria-labelledby={label}
			data-testid="tw-badge-input-list"
			ref={listRef}
		>
			{badges.map((badge) => (
				<Badge key={badge.id} badge={badge} listRef={listRef} />
			))}
		</ul>
	);
};

export interface BadgeProps {
	badge: BadgeItem;
	listRef: RefObject<HTMLUListElement>;
}

export const Badge = ({ badge, listRef }: BadgeProps) => {
	return (
		<EditPopover badge={badge} listRef={listRef}>
			<li className="relative inline-flex items-center py-0.5 px-1 rounded bg-badge-0 text-[0.7875rem] font-medium leading-[1.125rem]">
				{badge.value}
			</li>
		</EditPopover>
	);
};
