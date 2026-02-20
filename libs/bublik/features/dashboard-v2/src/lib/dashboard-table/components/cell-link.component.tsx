/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';
import { z } from 'zod';

import { DashboardCellData } from '@/shared/types';
import { cn, cva, Tooltip } from '@/shared/tailwind-ui';
import {
	LinkWithProject,
	useNavigateWithProject
} from '@/bublik/features/projects';

import { getUrl } from '../../utils';

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
		return <span className={cn(linkStyles(), bgColor)}>{cellString}</span>;
	}

	const isAbsoluteUrl = z.string().url().safeParse(data.payload.url).success;
	const isLinkToRun =
		cellKey === UNEXPECTED_COLUMN_KEY && data.payload.url === PATH_TO_RUN;

	// 1. Absolute URL
	if (isAbsoluteUrl) {
		return (
			<AbsoluteLink
				cellString={cellString}
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
				to={to}
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
				to={getUrl(data.payload.url, data.payload?.params)}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</LinkWithProject>
		</LinkHintCard>
	);
}

interface LinkToRunProps {
	cellString: string | number;
	to: string;
	bgColor?: string;
	destination?: string;
}

function LinkToRun(props: LinkToRunProps) {
	const { cellString, to, bgColor, destination } = props;
	const navigate = useNavigateWithProject();

	return (
		<LinkHintCard destination={destination}>
			<LinkWithProject
				to={to}
				state={getUnexpectedNavigationState()}
				onClick={(e) => {
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
	cellString: string | number;
	url: string;
	bgColor?: string;
	destination?: string;
}

function AbsoluteLink(props: AbsoluteLinkProps) {
	const { cellString, bgColor, url, destination } = props;

	return (
		<LinkHintCard destination={destination}>
			<a
				rel="noopener noreferrer"
				href={url}
				target="_blank"
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
