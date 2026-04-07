/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useMemo } from 'react';
import * as RadixHoverCard from '@radix-ui/react-hover-card';

import { parseDetailDate } from '@/shared/utils';

import {
	BadgeListItem,
	BadgeList,
	Icon,
	hoverCardContentStyles,
	cn
} from '@/shared/tailwind-ui';

interface BadgesCardListProps {
	startDate: string;
	badges: BadgeListItem[];
}

function BadgesCardList(props: BadgesCardListProps) {
	const { startDate, badges } = props;
	const formattedStartDate = parseDetailDate(startDate) ?? '-';

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2 border-b border-gray-100 py-2 px-4">
				<Icon name="Clock" size={18} />
				<p className="text-sm text-gray-600">
					<span className="text-sm text-text-primary font-semibold">
						Start:
					</span>
					<span className="ml-1.5 text-sm text-gray-800">
						{formattedStartDate}
					</span>
				</p>
			</div>
			<div className="min-h-0 overflow-auto styled-scrollbar px-4 pb-4">
				<BadgeList badges={badges} />
			</div>
		</div>
	);
}

const MAX_TAG_COUNT_FOR_SMALL_CARD = 20;

interface AggregationTooltipProps {
	relevantTags: string[];
	importantTags: string[];
	startDate: string;
	children?: ReactNode;
}

function AggregationTooltip(props: AggregationTooltipProps) {
	const { relevantTags, importantTags, startDate, children } = props;

	const badgesWithColor = useMemo<BadgeListItem[]>(
		() => [
			...importantTags.map((tag) => ({ payload: tag, isImportant: true })),
			...relevantTags.map((tag) => ({ payload: tag }))
		],
		[relevantTags, importantTags]
	);

	const allCount = relevantTags.length + importantTags.length;

	return (
		<RadixHoverCard.Root>
			<RadixHoverCard.Trigger asChild>{children}</RadixHoverCard.Trigger>
			<RadixHoverCard.Portal>
				<RadixHoverCard.Content
					className={cn(
						hoverCardContentStyles(),
						'flex min-h-0 overflow-auto max-h-[var(--radix-hover-card-content-available-height)] border border-gray-100 max-w-[min(60vw,var(--radix-hover-card-content-available-width))] flex-col gap-3 rounded-xl bg-white shadow-lg',
						allCount < MAX_TAG_COUNT_FOR_SMALL_CARD && 'w-96'
					)}
					collisionPadding={8}
					sideOffset={8}
				>
					<BadgesCardList startDate={startDate} badges={badgesWithColor} />
				</RadixHoverCard.Content>
			</RadixHoverCard.Portal>
		</RadixHoverCard.Root>
	);
}

export { AggregationTooltip };
