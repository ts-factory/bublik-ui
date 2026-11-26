/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ReactElement,
	cloneElement,
	useCallback,
	useRef,
	useState
} from 'react';
import * as RadixHoverCard from '@radix-ui/react-hover-card';
import { z } from 'zod';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { DashboardCellData } from '@/shared/types';
import { cn, cva, Tooltip } from '@/shared/tailwind-ui';
import {
	LinkWithProject,
	useNavigateWithProject
} from '@/bublik/features/projects';
import { useDefaultLogMode } from '@/bublik/features/user-preferences';
import {
	DESCRIPTION_MARKDOWN_CLASS,
	DESCRIPTION_SURFACE_CLASS,
	DescriptionPanel,
	overlayOffsets,
	useElementHeight
} from '@/bublik/features/result-classification';

import { getUrl } from '../../utils';

import {
	CellCardLink,
	CellCardLinkTarget,
	CellCardValue
} from './cell-card-link.component';

const UNEXPECTED_COLUMN_KEY = 'unexpected';
const PATH_TO_RUN = 'runs';

function getUnexpectedNavigationState(openUnexpectedResults = false) {
	const openUnexpectedIntentId = `${Date.now()}-${Math.random()
		.toString(36)
		.slice(2)}`;

	if (openUnexpectedResults) {
		return { openUnexpectedResults: true, openUnexpectedIntentId };
	}

	return { openUnexpected: true, openUnexpectedIntentId };
}

function cellAttributes(cellKey: string) {
	return {
		'data-testid': 'dashboard-cell-link',
		'data-cell-key': cellKey
	} as const;
}

/**
 * Where a badge's text starts inside the badge: its `py-0.5` and `px-2`, in
 * pixels. The card of a cut badge lays its text over that point.
 */
const BADGE_TEXT_TOP = 2;
const BADGE_TEXT_LEFT = 8;

export const linkStyles = cva({
	base: [
		'py-0.5 px-2 truncate rounded hover:underline',
		'text-[0.75rem] font-medium leading-[1.125rem]'
	]
});

export interface CellLinkProps {
	cellKey: string;
	data: DashboardCellData;
	bgColor?: string;
	hint?: string;
	/** The column's name; heads the card a cut badge shows. */
	heading?: string;
}

export function CellLink({
	data,
	bgColor = 'bg-badge-0',
	cellKey,
	hint,
	heading
}: CellLinkProps) {
	const cellString = data.value ?? '';
	const destination = getDestinationHint(hint);
	const logMode = useDefaultLogMode();

	if (!data.payload?.url) {
		return (
			<LinkHintCard value={cellString} heading={heading}>
				<span
					{...cellAttributes(cellKey)}
					className={cn(linkStyles(), bgColor)}
				>
					{cellString}
				</span>
			</LinkHintCard>
		);
	}

	const isAbsoluteUrl = z.string().url().safeParse(data.payload.url).success;
	const isLinkToRun =
		cellKey === UNEXPECTED_COLUMN_KEY && data.payload.url === PATH_TO_RUN;

	// 1. Absolute URL
	if (isAbsoluteUrl) {
		return (
			<AbsoluteLink
				cellString={cellString}
				cellKey={cellKey}
				url={data.payload.url}
				bgColor={bgColor}
				destination={destination}
				heading={heading}
			/>
		);
	}

	const to = getUrl(data.payload.url, data.payload?.params, logMode);

	// 2. Link to run with unexpected open on CTRL click
	if (isLinkToRun) {
		return (
			<LinkToRun
				to={to}
				cellKey={cellKey}
				cellString={cellString}
				bgColor={bgColor}
				destination={destination}
				heading={heading}
			/>
		);
	}

	// 3. Relative URL
	const trackClick = () =>
		trackDashboardTableLinkClick({ cellKey, destinationType: 'relative' });

	return (
		<LinkHintCard
			value={cellString}
			heading={heading}
			destination={destination}
			link={{ to }}
			onLinkClick={trackClick}
		>
			<LinkWithProject
				{...cellAttributes(cellKey)}
				to={to}
				onClick={trackClick}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</LinkWithProject>
		</LinkHintCard>
	);
}

interface LinkToRunProps {
	cellKey: string;
	cellString: string | number;
	to: string;
	bgColor?: string;
	destination?: string;
	heading?: string;
}

function LinkToRun(props: LinkToRunProps) {
	const { cellString, cellKey, to, bgColor, destination, heading } = props;
	const navigate = useNavigateWithProject();

	return (
		<LinkHintCard
			value={cellString}
			heading={heading}
			destination={destination}
			link={{ to, state: getUnexpectedNavigationState() }}
			onLinkClick={() =>
				trackDashboardTableLinkClick({ cellKey, destinationType: 'run' })
			}
		>
			<LinkWithProject
				{...cellAttributes(cellKey)}
				to={to}
				state={getUnexpectedNavigationState()}
				onClick={(e) => {
					trackDashboardTableLinkClick({
						cellKey,
						destinationType: 'run',
						hasCtrlKey: e.ctrlKey,
						interaction: 'click'
					});

					e.preventDefault();
					if (e.ctrlKey) {
						navigate(to, {
							state: getUnexpectedNavigationState(true)
						});
					} else {
						navigate(to, { state: getUnexpectedNavigationState() });
					}
				}}
				onContextMenu={(e) => {
					trackDashboardTableLinkClick({
						cellKey,
						destinationType: 'run',
						hasCtrlKey: e.ctrlKey,
						interaction: 'context_menu'
					});

					e.preventDefault();
					if (e.ctrlKey) {
						navigate(to, {
							state: getUnexpectedNavigationState(true)
						});
					} else {
						navigate(to, { state: getUnexpectedNavigationState() });
					}
				}}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</LinkWithProject>
		</LinkHintCard>
	);
}

interface AbsoluteLinkProps {
	cellKey: string;
	cellString: string | number;
	url: string;
	bgColor?: string;
	destination?: string;
	heading?: string;
}

function AbsoluteLink(props: AbsoluteLinkProps) {
	const { cellString, cellKey, bgColor, url, destination, heading } = props;
	const trackClick = () =>
		trackDashboardTableLinkClick({ cellKey, destinationType: 'absolute' });

	return (
		<LinkHintCard
			value={cellString}
			heading={heading}
			destination={destination}
			link={{ href: url }}
			onLinkClick={trackClick}
		>
			<a
				{...cellAttributes(cellKey)}
				rel="noopener noreferrer"
				href={url}
				target="_blank"
				onClick={trackClick}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</a>
		</LinkHintCard>
	);
}

interface LinkHintCardProps {
	/** The badge's whole value; shown when the column cuts the badge. */
	value: string | number;
	/** The column's name; heads the card of a cut badge. */
	heading?: string;
	/** Where the link leads, in words. */
	destination?: string;
	/** Where the link leads; the card of a cut badge repeats it in its header. */
	link?: CellCardLinkTarget;
	onLinkClick?: () => void;
	/** The badge itself. */
	children: ReactElement;
}

/** How long the pointer rests on a cut badge before its card opens, in ms. */
const CARD_OPEN_DELAY = 300;

/**
 * What hovering or focusing a badge shows. A badge that fits tells where its
 * link leads, in a tooltip. A badge the column cuts with an ellipsis shows
 * the card a cut text cell opens on click: the column's name, the link at
 * the header's right end, and the whole value. A click on a badge is its
 * link's, so its card comes on hover instead.
 *
 * Like that popover, the card is laid over the cell, its text starting where
 * the badge's does, so the value reads on without moving. It fades rather
 * than slides in for the same reason. The value keeps the badge's link.
 *
 * The badge is measured as either is about to open, which spares the table
 * an observer per badge; a badge with nothing to tell shows neither.
 */
function LinkHintCard({
	value,
	heading,
	destination,
	link,
	onLinkClick,
	children
}: LinkHintCardProps) {
	const badge = useRef<HTMLElement | null>(null);
	const setBadge = useCallback((node: HTMLElement | null) => {
		badge.current = node;
	}, []);
	const [shown, setShown] = useState<'hint' | 'card' | null>(null);
	// Radix takes its offsets as numbers, so the badge and the card's header,
	// whose title wraps, are measured.
	const [badgeHeight, setBadgeHeight] = useState(0);
	const [header, setHeader] = useState<HTMLDivElement | null>(null);
	const headerHeight = useElementHeight(header);
	const overlay = overlayOffsets(badgeHeight, headerHeight);

	const handleOpenChange = (what: 'hint' | 'card') => (open: boolean) => {
		if (!open) {
			return setShown((current) => (current === what ? null : current));
		}

		const node = badge.current;
		const isCut = !!node && node.scrollWidth > node.clientWidth;
		const fitting = isCut ? 'card' : destination ? 'hint' : null;

		if (fitting !== what) return;

		setBadgeHeight(node?.offsetHeight ?? 0);
		setShown(what);
	};

	return (
		<RadixHoverCard.Root
			open={shown === 'card'}
			onOpenChange={handleOpenChange('card')}
			openDelay={CARD_OPEN_DELAY}
		>
			<Tooltip
				open={shown === 'hint'}
				onOpenChange={handleOpenChange('hint')}
				content={destination ?? ''}
			>
				<RadixHoverCard.Trigger asChild>
					{cloneElement(children, { ref: setBadge })}
				</RadixHoverCard.Trigger>
			</Tooltip>
			<RadixHoverCard.Portal>
				<RadixHoverCard.Content
					side="bottom"
					align="start"
					// Given to Radix rather than added on top, so its collision
					// handling sees where the card really is.
					sideOffset={overlay.sideOffset + BADGE_TEXT_TOP}
					alignOffset={overlay.alignOffset + BADGE_TEXT_LEFT}
					collisionPadding={8}
					className="z-50 rdx-state-open:animate-fade-in rdx-state-closed:animate-fade-out"
					// Held back until the header and the badge are measured, so it
					// never shows at a first, wrong offset.
					style={{
						visibility: headerHeight && badgeHeight ? undefined : 'hidden'
					}}
					// A press on the badge is one outside the card: Radix would
					// dismiss it, and the badge's focus would open it again.
					onPointerDownOutside={(event) => {
						if (
							event.target instanceof Node &&
							badge.current?.contains(event.target)
						) {
							event.preventDefault();
						}
					}}
				>
					<div
						className={cn(
							DESCRIPTION_SURFACE_CLASS,
							'max-h-[min(60vh,var(--radix-hover-card-content-available-height))]'
						)}
						data-testid="dashboard-cell-card"
					>
						<DescriptionPanel
							title={heading ?? ''}
							headerRef={setHeader}
							action={
								link ? (
									<CellCardLink
										target={link}
										label={destination ?? 'Open'}
										onClick={onLinkClick}
									/>
								) : null
							}
						>
							{/* The badge's weight, so the text keeps its measure. */}
							<p className={cn('p-2 font-medium', DESCRIPTION_MARKDOWN_CLASS)}>
								<CellCardValue target={link} onClick={onLinkClick}>
									{value}
								</CellCardValue>
							</p>
						</DescriptionPanel>
					</div>
				</RadixHoverCard.Content>
			</RadixHoverCard.Portal>
		</RadixHoverCard.Root>
	);
}

function getDestinationHint(hint: string | undefined) {
	if (!hint) return undefined;

	return hint.trim();
}

type DashboardTableLinkClickDestinationType = 'absolute' | 'relative' | 'run';

interface DashboardTableLinkClickPayload {
	cellKey: string;
	destinationType: DashboardTableLinkClickDestinationType;
	interaction?: 'click' | 'context_menu';
	hasCtrlKey?: boolean;
}

function trackDashboardTableLinkClick(payload: DashboardTableLinkClickPayload) {
	trackEvent(analyticsEventNames.dashboardTableLinkClick, {
		cellKey: payload.cellKey,
		destinationType: payload.destinationType,
		interaction: payload.interaction ?? 'click',
		hasCtrlKey: payload.hasCtrlKey ?? false
	});
}
