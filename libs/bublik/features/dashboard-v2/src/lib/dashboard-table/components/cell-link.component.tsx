/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { type AnchorHTMLAttributes, type ReactNode } from 'react';
import { type HistoryState } from '@tanstack/react-router';
import { z } from 'zod';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { DashboardCellData } from '@/shared/types';
import { cn, cva, Tooltip } from '@/shared/tailwind-ui';
import {
	LinkWithProject,
	RouterLinkWithProject,
	useNavigateWithProject,
	useRouterNavigateWithProject
} from '@/bublik/features/projects';

import { getCellTarget, type CellTarget } from '../../utils';

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

	const target = getCellTarget(data.payload.url, data.payload?.params);

	// 2. Link to run with unexpected open on CTRL click
	if (isLinkToRun) {
		return (
			<LinkToRun
				target={target}
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
			<CellAnchor
				{...cellAttributes(cellKey)}
				cellTarget={target}
				onClick={() => {
					trackDashboardTableLinkClick({
						cellKey,
						destinationType: 'relative'
					});
				}}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</CellAnchor>
		</LinkHintCard>
	);
}

interface CellAnchorProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	cellTarget: CellTarget;
	state?: HistoryState;
}

/** A cell's link: typed for a route of the tree, the path as built otherwise. */
function CellAnchor({ cellTarget: target, ...props }: CellAnchorProps) {
	switch (target.kind) {
		case 'run':
			return <LinkWithProject {...target.link} {...props} />;
		case 'log':
			return <LinkWithProject {...target.link} {...props} />;
		case 'path':
			return <RouterLinkWithProject to={target.to} {...props} />;
	}
}

/** Navigates to a cell's target with `state`, typed when it is a route. */
function useNavigateToCell(): (
	target: CellTarget,
	state: HistoryState
) => void {
	const navigate = useNavigateWithProject();
	const navigateTo = useRouterNavigateWithProject();

	return (target, state) => {
		switch (target.kind) {
			case 'run':
				return void navigate({ ...target.link, state });
			case 'log':
				return void navigate({ ...target.link, state });
			case 'path':
				return navigateTo(target.to, { state });
		}
	};
}

interface LinkToRunProps {
	cellKey: string;
	cellString: string | number;
	target: CellTarget;
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
	const { cellString, cellKey, target, bgColor, destination } = props;
	const navigate = useNavigateToCell();

	return (
		<LinkHintCard destination={destination}>
			<CellAnchor
				{...cellAttributes(cellKey)}
				cellTarget={target}
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
						navigate(target, getUnexpectedNavigationState(true));
					} else {
						navigate(target, getUnexpectedNavigationState());
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
						navigate(target, getUnexpectedNavigationState(true));
					} else {
						navigate(target, getUnexpectedNavigationState());
					}
				}}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</CellAnchor>
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
