/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, useMemo } from 'react';

import { isBranch, isRevision, trimBranch, trimRevision } from '@/shared/utils';

import { Badge } from '../badge';
import { EnvBadge } from '../env-badge';

const isEnv = (value: string) => value.startsWith('env=');

export type BadgeListItem = {
	payload: string;
	isImportant?: boolean;
};

export interface BadgeListProps {
	badges: BadgeListItem[];
	onBadgeClick?: (badge: BadgeListItem) => void;
	selectedBadges?: string[];
	className?: string;
}

export const BadgeList = forwardRef<HTMLDivElement, BadgeListProps>(
	({ badges, selectedBadges, onBadgeClick, className }, ref) => {
		const { filterBadges, envBadges } = useMemo(() => {
			const filterBadges = badges.filter((badge) => !isEnv(badge.payload));
			const envBadges = badges.filter((badge) => isEnv(badge.payload));

			return { filterBadges, envBadges };
		}, [badges]);

		const badgeNodes = filterBadges.map((badge, idx) => {
			const isSelected = selectedBadges?.includes(badge.payload);
			const finalClass = badge.isImportant
				? 'bg-badge-6'
				: className
				? className
				: 'bg-badge-0';

			let value = badge.payload;
			if (isRevision(badge.payload)) value = trimRevision(badge.payload);
			if (isBranch(badge.payload)) value = trimBranch(badge.payload);

			return (
				<Badge
					key={idx}
					onClick={onBadgeClick ? () => onBadgeClick?.(badge) : undefined}
					className={finalClass}
					isSelected={isSelected}
					overflowWrap
				>
					{value}
				</Badge>
			);
		});

		const envBadgeNodes = envBadges.map((envBadge, idx) => (
			<EnvBadge
				key={idx}
				value={envBadge.payload}
				onContentClick={
					onBadgeClick ? () => onBadgeClick?.(envBadge) : undefined
				}
				isSelected={selectedBadges?.includes(envBadge.payload)}
			/>
		));

		if (envBadges.length) {
			return (
				<div
					className="flex flex-col gap-1"
					ref={ref}
					data-testid="tw-badge-list"
				>
					<div className="flex flex-wrap gap-1">{envBadgeNodes}</div>
					<div className="flex flex-wrap gap-1">{badgeNodes}</div>
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
