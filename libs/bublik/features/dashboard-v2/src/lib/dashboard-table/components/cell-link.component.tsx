/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';
import { type HistoryState } from '@tanstack/react-router';
import { z } from 'zod';

import { type Path } from '@/router';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { DashboardCellData } from '@/shared/types';
import { cn, cva, Tooltip } from '@/shared/tailwind-ui';
import {
	LinkWithProject,
	useNavigateWithProject
} from '@/bublik/features/projects';

import { getUrl } from '../../utils';

const UNEXPECTED_COLUMN_KEY = 'unexpected';
const PATH_TO_RUN = 'runs';

/**
 * The `location.state` the run page reads to preview the unexpected results
 * (`openUnexpected`) or to expand their result tables (`openUnexpectedResults`,
 * on ctrl-click); a fresh intent id per navigation lets the run page tell a
 * new request from a reload of the same entry.
 */
function getUnexpectedNavigationState(
	openUnexpectedResults = false
): HistoryState {
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
}

export function CellLink({
	data,
	bgColor = 'bg-badge-0',
	cellKey,
	hint
}: CellLinkProps) {
	const cellString = data.value ?? '';
	const destination = getDestinationHint(hint);

	if (!data.payload?.url) {
		return (
			<span {...cellAttributes(cellKey)} className={cn(linkStyles(), bgColor)}>
				{cellString}
			</span>
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
			/>
		);
	}

	const to = getUrl(data.payload.url, data.payload?.params);

	// 2. Link to run with unexpected open on CTRL click
	if (isLinkToRun) {
		return (
			<LinkToRun
				link={{ to, state: getUnexpectedNavigationState() }}
				cellKey={cellKey}
				cellString={cellString}
				bgColor={bgColor}
				destination={destination}
			/>
		);
	}

	// 3. Relative URL
	return (
		<LinkHintCard destination={destination}>
			<LinkWithProject
				{...cellAttributes(cellKey)}
				to={to}
				onClick={() => {
					trackDashboardTableLinkClick({
						cellKey,
						destinationType: 'relative'
					});
				}}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</LinkWithProject>
		</LinkHintCard>
	);
}

/** A run link and the `location.state` it opens the run page with. */
interface RunLink {
	to: Path;
	state: HistoryState;
}

interface LinkToRunProps {
	cellKey: string;
	cellString: string | number;
	link: RunLink;
	bgColor?: string;
	destination?: string;
}

/**
 * The NOK badge. The anchor carries the preview state for the browser's own
 * handling (middle click, open in new tab); a click or a context-menu click
 * is a navigation of its own with a fresh intent id, and ctrl asks for the
 * result tables expanded.
 */
function LinkToRun(props: LinkToRunProps) {
	const { cellString, cellKey, link, bgColor, destination } = props;
	const { to } = link;
	const navigate = useNavigateWithProject();

	return (
		<LinkHintCard destination={destination}>
			<LinkWithProject
				{...cellAttributes(cellKey)}
				{...link}
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
}

function AbsoluteLink(props: AbsoluteLinkProps) {
	const { cellString, cellKey, bgColor, url, destination } = props;

	return (
		<LinkHintCard destination={destination}>
			<a
				{...cellAttributes(cellKey)}
				rel="noopener noreferrer"
				href={url}
				target="_blank"
				onClick={() => {
					trackDashboardTableLinkClick({
						cellKey,
						destinationType: 'absolute'
					});
				}}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</a>
		</LinkHintCard>
	);
}

interface LinkHintCardProps {
	destination?: string;
	children: ReactNode;
}

function LinkHintCard({ destination, children }: LinkHintCardProps) {
	return (
		<Tooltip content={destination ?? ''} disabled={!destination}>
			{children}
		</Tooltip>
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
