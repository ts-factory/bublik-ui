/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useNavigate } from 'react-router-dom';
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
}

export const CellLink = ({
	data,
	bgColor = 'bg-badge-0',
	cellKey
}: CellLinkProps) => {
	const cellString = data.value ?? '';

	if (!data.payload?.url) {
		return <span className={cn(linkStyles, bgColor)}>{cellString}</span>;
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
			/>
		);
	}

	const to = getUrl(data.payload.url, data.payload?.params);

	// 2. Link to run with unexpected open on CTRL click
	if (isLinkToRun) {
		return <LinkToRun to={to} cellString={cellString} bgColor={bgColor} />;
	}

	// 3. Relative URL
	return (
		<Tooltip content={cellString}>
			<LinkWithProject
				to={getUrl(data.payload.url, data.payload?.params)}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</LinkWithProject>
		</Tooltip>
	);
};

interface LinkToRunProps {
	cellString: string | number;
	to: string;
	bgColor?: string;
}

const LinkToRun = ({ cellString, to, bgColor }: LinkToRunProps) => {
	const navigate = useNavigateWithProject();

	return (
		<Tooltip content={cellString}>
			<LinkWithProject
				to={to}
				state={{ openUnexpected: true }}
				onClick={(e) => {
					e.preventDefault();
					if (e.ctrlKey) {
						navigate(to, { state: { openUnexpectedResults: true } });
					} else {
						navigate(to, { state: { openUnexpected: true } });
					}
				}}
				onContextMenu={(e) => {
					e.preventDefault();
					if (e.ctrlKey) {
						navigate(to, { state: { openUnexpectedResults: true } });
					} else {
						navigate(to, { state: { openUnexpected: true } });
					}
				}}
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</LinkWithProject>
		</Tooltip>
	);
};
interface AbsoluteLinkProps {
	cellString: string | number;
	url: string;
	bgColor?: string;
}

const AbsoluteLink = ({ cellString, bgColor, url }: AbsoluteLinkProps) => {
	return (
		<Tooltip content={cellString}>
			<a
				rel="noopener noreferrer"
				href={url}
				target="_blank"
				className={cn(linkStyles(), bgColor)}
			>
				{cellString}
			</a>
		</Tooltip>
	);
};
