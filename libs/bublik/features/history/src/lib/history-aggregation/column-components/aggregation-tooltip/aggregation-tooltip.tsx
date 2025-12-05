/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useMemo } from 'react';
import { format, parseISO } from 'date-fns';

import {
	BadgeListItem,
	BadgeList,
	HoverCard,
	Icon
} from '@/shared/tailwind-ui';

interface BadgesCardListProps {
	startDate: string;
	badges: BadgeListItem[];
}

function BadgesCardList(props: BadgesCardListProps) {
	const { startDate, badges } = props;

	return (
		<div className="flex flex-col w-80 gap-3 p-4 bg-white rounded-xl shadow-lg border border-gray-100">
			<div className="flex items-center gap-2 pb-2 border-b border-gray-100">
				<Icon name="Clock" size={18} />
				<p className="text-sm text-gray-600">
					<span className="text-sm text-text-primary font-semibold">
						Start Date:
					</span>
					<span className="ml-1.5 text-sm text-gray-800">
						{format(parseISO(startDate), 'MMMM d, yyyy')}
					</span>
				</p>
			</div>
			<BadgeList badges={badges} />
		</div>
	);
}

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

	return (
		<HoverCard
			content={
				<BadgesCardList startDate={startDate} badges={badgesWithColor} />
			}
		>
			{children}
		</HoverCard>
	);
}

export { AggregationTooltip };
