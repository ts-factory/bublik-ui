/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, ReactNode, useMemo } from 'react';

import { BadgeListItem, BadgeList, HoverCard } from '@/shared/tailwind-ui';

export interface BadgesCardList {
	startDate: string;
	badges: BadgeListItem[];
}

const BadgesCardList: FC<BadgesCardList> = (props) => {
	const { startDate, badges } = props;

	return (
		<div className="flex flex-col max-w-md gap-2 p-2 bg-white rounded-lg shadow-popover">
			<p className="text-[0.875rem] leading-[1.125rem]">
				<span className="text-[0.875rem] font-semibold">Start Date:</span>
				<span> {startDate}</span>
			</p>
			<BadgeList badges={badges} />
		</div>
	);
};

export interface AggregationTooltipProps {
	badges: string[];
	startDate: string;
	children?: ReactNode;
}

export const AggregationTooltip: FC<AggregationTooltipProps> = (props) => {
	const { badges, children, startDate } = props;

	const badgesWithColor = useMemo(
		() => badges.map((badge) => ({ payload: badge })),
		[badges]
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
};
