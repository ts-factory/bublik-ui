/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';

import {
	FEATURE_FLAGS,
	FeatureFlagDefinition,
	FeatureFlagId,
	useFeatureFlags,
	useSeenFeatureFlags
} from '@/bublik/features/feature-flags';
import {
	Badge,
	BadgeVariants,
	cn,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	Icon
} from '@/shared/tailwind-ui';

import type { SettingsTabConfig } from '../types';

// Typed as the definition, so an optional field like `isNew` reads on every entry.
const FLAGS: readonly (FeatureFlagDefinition & { id: FeatureFlagId })[] =
	FEATURE_FLAGS;

// The menu's 4px padding, the 36px header and the 9px separator.
const FLAG_ROW_OFFSET = 4 + 36 + 9;

const NOTHING_NEW: ReadonlySet<FeatureFlagId> = new Set();

const pluralizeFeatures = (count: number) =>
	`${count} ${count === 1 ? 'feature' : 'features'}`;

interface BetaFeaturesBadgeProps {
	className?: string;
}

// Chip-sized like the sidebar's count badges.
const MENU_BADGE_CLASS =
	'py-0 px-1.5 text-[0.6875rem] leading-4 tracking-wide tabular-nums';

/**
 * How many experimental features there are to try. An outline badge with
 * grey text: it is always there, so it stays quiet, and having no fill it
 * reads the same on a highlighted entry.
 */
function BetaFeaturesBadge({ className }: BetaFeaturesBadgeProps) {
	if (!FLAGS.length) return null;

	return (
		<Badge
			as="span"
			variant={BadgeVariants.Outline}
			className={cn(MENU_BADGE_CLASS, 'ml-auto text-text-menu', className)}
			title={`${pluralizeFeatures(FLAGS.length)} available`}
			data-testid="beta-features-count"
		>
			{FLAGS.length}
		</Badge>
	);
}

/**
 * Marks a flag added recently: the badge system's solid primary, the one
 * loud mark in the menu since it is temporary.
 */
function NewFeatureTag({ className }: { className?: string }) {
	return (
		<Badge
			as="span"
			variant={BadgeVariants.PrimaryActive}
			isSelected
			className={cn(MENU_BADGE_CLASS, 'uppercase', className)}
		>
			New
		</Badge>
	);
}

/** The look of a switch, for a menu row that is itself the control. */
function SwitchGlyph({ checked }: { checked: boolean }) {
	return (
		<span
			aria-hidden
			className={cn(
				'flex h-[18px] w-8 shrink-0 rounded-full p-0.5 transition-colors',
				checked ? 'justify-end bg-primary' : 'justify-start bg-border-primary'
			)}
		>
			<span className="block size-3.5 rounded-full bg-white shadow" />
		</span>
	);
}

interface BetaFeaturesSubmenuProps {
	tab: SettingsTabConfig;
	itemClassName: string;
	onOpenSettings: () => void;
}

/**
 * The Beta entry of the account menu. It shows how many experimental
 * features there are and opens a flyout to switch each on or off in place,
 * with a way through to the full Beta settings.
 *
 * A flag marked `isNew` is tagged NEW until the user has seen it: opening
 * the flyout records its unseen NEW flags as seen at once, and the flyout
 * keeps showing the tags it opened with, so they go away next time rather
 * than under the pointer.
 */
function BetaFeaturesSubmenu({
	tab,
	itemClassName,
	onOpenSettings
}: BetaFeaturesSubmenuProps) {
	const { flags, setFlag } = useFeatureFlags();
	const { isSeen, markSeen } = useSeenFeatureFlags();
	const [shownNew, setShownNew] = useState(NOTHING_NEW);
	const enabledCount = Object.values(flags).filter(Boolean).length;

	const handleOpenChange = (open: boolean) => {
		if (!open) return;

		const unseen = FLAGS.filter((flag) => flag.isNew && !isSeen(flag.id)).map(
			(flag) => flag.id
		);

		setShownNew(new Set(unseen));
		markSeen(unseen);
	};

	return (
		<DropdownMenuSub onOpenChange={handleOpenChange}>
			<DropdownMenuSubTrigger
				aria-label={`${tab.label}, ${pluralizeFeatures(
					FLAGS.length
				)} available`}
				className={cn(
					itemClassName,
					'group rounded focus:text-primary rdx-state-open:text-primary',
					'[&>svg:last-child]:ml-1 [&>svg:last-child]:size-[18px]'
				)}
			>
				<span className="grid place-items-center size-[18px] shrink-0">
					{tab.icon}
				</span>
				{tab.label}
				<BetaFeaturesBadge />
			</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				{/* Framed like the account menu it opens from: same radius, padding,
				    separators, header and rows */}
				<DropdownMenuSubContent
					sideOffset={8}
					// Lifted by the padding, header and separator above the first
					// flag, so that row lines up with the Beta entry it opens from.
					alignOffset={-FLAG_ROW_OFFSET}
					collisionPadding={8}
					className="w-[280px] rounded-lg"
				>
					<DropdownMenuLabel className="flex items-center justify-between gap-3 px-2 py-2 font-normal">
						<span className="text-sm font-semibold text-text-primary">
							Beta Features
						</span>
						<span className="text-xs tabular-nums text-text-menu">
							{enabledCount} of {FLAGS.length} on
						</span>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{FLAGS.map((flag) => (
						<DropdownMenuItem
							key={flag.id}
							role="menuitemcheckbox"
							aria-checked={flags[flag.id]}
							data-testid={`beta-menu-flag-${flag.id}`}
							// Stays open, so several flags can be switched in one go.
							onSelect={(event) => {
								event.preventDefault();
								setFlag(flag.id, !flags[flag.id]);
							}}
							className={cn(itemClassName, 'group')}
						>
							<span className="min-w-0 flex-1 truncate">{flag.name}</span>
							{shownNew.has(flag.id) ? <NewFeatureTag /> : null}
							<SwitchGlyph checked={flags[flag.id]} />
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={onOpenSettings}
						className={cn(itemClassName, 'justify-between text-primary')}
					>
						Open Beta settings
						{/* The submenu trigger's own chevron, so both read as "go further" */}
						<Icon name="ArrowShortTop" className="size-[18px] rotate-90" />
					</DropdownMenuItem>
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	);
}

export { BetaFeaturesBadge, BetaFeaturesSubmenu, NewFeatureTag };
