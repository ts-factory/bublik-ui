/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useMemo, useState } from 'react';
import * as RadixHoverCard from '@radix-ui/react-hover-card';

import { parseDetailDate } from '@/shared/utils';

import {
	BadgeListItem,
	BadgeList,
	Icon,
	hoverCardContentStyles,
	cn
} from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';

interface BadgesCardListProps {
	startDate: string;
	badges: BadgeListItem[];
	action?: ReactNode;
}

function BadgesCardList(props: BadgesCardListProps) {
	const { startDate, badges, action } = props;
	const formattedStartDate = parseDetailDate(startDate) ?? '-';

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2 border-b border-border-primary py-2 px-4">
				<Icon name="Clock" size={18} className="shrink-0" />
				<p className="whitespace-nowrap text-sm text-gray-600">
					<span className="text-sm text-text-primary font-semibold">
						Start:
					</span>
					<span className="ml-1.5 text-sm text-gray-800">
						{formattedStartDate}
					</span>
				</p>
				{action ? (
					// As tall as the control from the start: it shows up once its
					// result has loaded, and must not push the tags down then.
					<div className="ml-auto flex h-[26px] shrink-0 items-center">
						{action}
					</div>
				) : null}
			</div>
			<div className="min-h-0 overflow-auto styled-scrollbar px-4 pb-4">
				<BadgeList
					keyValueDisplayDelimiter={config.keyValueDisplayDelimiter}
					keyValueSubmitDelimiter={config.keyValueSubmitDelimiter}
					badges={badges}
				/>
			</div>
		</div>
	);
}

const MAX_TAG_COUNT_FOR_SMALL_CARD = 20;
/** A card of few tags; one with an action is wider, to seat it by the start time. */
const SMALL_CARD_WIDTH = 'w-96';
const SMALL_CARD_WITH_ACTION_WIDTH = 'w-[28rem]';

interface AggregationTooltipProps {
	relevantTags: string[];
	importantTags: string[];
	startDate: string;
	/**
	 * A control beside the start time, such as Classify. It gets `keepOpen`
	 * to hold the card open while a drawer it opened is up: the card would
	 * otherwise close as the pointer leaves it, and take the drawer with it.
	 */
	renderAction?: (keepOpen: (open: boolean) => void) => ReactNode;
	children?: ReactNode;
}

function AggregationTooltip(props: AggregationTooltipProps) {
	const { relevantTags, importantTags, startDate, renderAction, children } =
		props;
	const [open, setOpen] = useState(false);
	const [keptOpen, setKeptOpen] = useState(false);

	const badgesWithColor = useMemo<BadgeListItem[]>(
		() => [
			...importantTags.map((tag) => ({ payload: tag, isImportant: true })),
			...relevantTags.map((tag) => ({ payload: tag }))
		],
		[relevantTags, importantTags]
	);

	const allCount = relevantTags.length + importantTags.length;

	return (
		<RadixHoverCard.Root open={open || keptOpen} onOpenChange={setOpen}>
			<RadixHoverCard.Trigger asChild>{children}</RadixHoverCard.Trigger>
			<RadixHoverCard.Portal>
				<RadixHoverCard.Content
					className={cn(
						hoverCardContentStyles(),
						'flex min-h-0 overflow-auto max-h-[var(--radix-hover-card-content-available-height)] border border-gray-100 max-w-[min(60vw,var(--radix-hover-card-content-available-width))] flex-col gap-3 rounded-xl bg-bg-primary shadow-lg',
						allCount < MAX_TAG_COUNT_FOR_SMALL_CARD &&
							(renderAction ? SMALL_CARD_WITH_ACTION_WIDTH : SMALL_CARD_WIDTH)
					)}
					collisionPadding={8}
					sideOffset={8}
				>
					<BadgesCardList
						startDate={startDate}
						badges={badgesWithColor}
						action={renderAction?.(setKeptOpen)}
					/>
				</RadixHoverCard.Content>
			</RadixHoverCard.Portal>
		</RadixHoverCard.Root>
	);
}

export { AggregationTooltip };
