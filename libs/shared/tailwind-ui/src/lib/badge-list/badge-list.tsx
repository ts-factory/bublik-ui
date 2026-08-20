/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useMemo } from 'react';

import {
	DEFAULT_KEY_VALUE_SUBMIT_DELIMITER,
	isBranch,
	isRevision,
	parseParameter,
	trimBranch,
	trimRevision
} from '@/shared/utils';

import { ParameterValue } from '../parameter-value';

export type BadgeListItem = {
	payload: string;
	isImportant?: boolean;
};

export interface BadgeListProps {
	badges: BadgeListItem[];
	onBadgeClick?: (badge: BadgeListItem) => void;
	selectedBadges?: string[];
	className?: string;
	keyValueDisplayDelimiter?: string;
	keyValueSubmitDelimiter?: string;
}

export const BadgeList = forwardRef<HTMLDivElement, BadgeListProps>(
	(
		{
			badges,
			selectedBadges,
			onBadgeClick,
			className,
			keyValueDisplayDelimiter,
			keyValueSubmitDelimiter
		},
		ref
	) => {
		const { plainBadges, preformattedBadges } = useMemo(() => {
			const submitDelimiter =
				keyValueSubmitDelimiter ?? DEFAULT_KEY_VALUE_SUBMIT_DELIMITER;

			const parsed = badges.map((badge) => {
				let payload = badge.payload;
				if (isRevision(payload)) payload = trimRevision(payload);
				if (isBranch(payload)) payload = trimBranch(payload);

				return { badge, parsed: parseParameter(payload, submitDelimiter) };
			});

			return {
				plainBadges: parsed.filter((item) => !item.parsed.isPreformatted),
				preformattedBadges: parsed.filter((item) => item.parsed.isPreformatted)
			};
		}, [badges, keyValueSubmitDelimiter]);

		const renderBadge = (
			{ badge, parsed }: (typeof plainBadges)[number],
			idx: number,
			mode: 'badge' | 'pre'
		) => (
			<ParameterValue
				key={idx}
				name={parsed.name}
				value={parsed.value}
				mode={mode}
				className={
					badge.isImportant
						? 'bg-badge-6'
						: className
						? className
						: 'bg-badge-0'
				}
				isSelected={selectedBadges?.includes(badge.payload)}
				onClick={onBadgeClick ? () => onBadgeClick?.(badge) : undefined}
				displayDelimiter={keyValueDisplayDelimiter}
				submitDelimiter={keyValueSubmitDelimiter}
			/>
		);

		const badgeNodes = plainBadges.map((item, idx) =>
			renderBadge(item, idx, 'badge')
		);

		const preformattedNodes = preformattedBadges.map((item, idx) =>
			renderBadge(item, idx, 'pre')
		);

		if (preformattedNodes.length) {
			return (
				<div
					className="flex flex-col gap-1"
					ref={ref}
					data-testid="tw-badge-list"
				>
					<div className="flex flex-wrap gap-1">{badgeNodes}</div>
					<div className="flex flex-col gap-1">{preformattedNodes}</div>
				</div>
			);
		}

		return (
			<div
				className="flex flex-wrap gap-1"
				ref={ref}
				data-testid="tw-badge-list"
			>
				{badgeNodes}
			</div>
		);
	}
);
