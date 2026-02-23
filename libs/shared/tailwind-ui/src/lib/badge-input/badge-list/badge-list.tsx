/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, RefObject } from 'react';

import { BadgeItem } from '../types';
import { EditPopover } from './edit-popover';
import { cn } from '../../utils';
import { formatKeyValueForDisplay } from '@/shared/utils';

export interface BadgeListProps {
	label?: string;
	badges: BadgeItem[];
	keyValueDisplayDelimiter?: string;
	keyValueSubmitDelimiter?: string;
}

export const BadgeList = ({
	label,
	badges,
	keyValueDisplayDelimiter,
	keyValueSubmitDelimiter
}: BadgeListProps) => {
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
				<Badge
					key={badge.id}
					badge={badge}
					listRef={listRef}
					keyValueDisplayDelimiter={keyValueDisplayDelimiter}
					keyValueSubmitDelimiter={keyValueSubmitDelimiter}
				/>
			))}
		</ul>
	);
};

export interface BadgeProps {
	badge: BadgeItem;
	listRef: RefObject<HTMLUListElement>;
	keyValueDisplayDelimiter?: string;
	keyValueSubmitDelimiter?: string;
}

export const Badge = ({
	badge,
	listRef,
	keyValueDisplayDelimiter,
	keyValueSubmitDelimiter
}: BadgeProps) => {
	const displayValue = formatKeyValueForDisplay(badge.value, {
		displayDelimiter: keyValueDisplayDelimiter,
		submitDelimiter: keyValueSubmitDelimiter
	});

	return (
		<EditPopover badge={badge} listRef={listRef}>
			<li className="relative inline-flex items-center py-0.5 px-1 rounded bg-badge-0 text-[0.875rem] font-medium leading-[1.125rem]">
				{displayValue}
			</li>
		</EditPopover>
	);
};
