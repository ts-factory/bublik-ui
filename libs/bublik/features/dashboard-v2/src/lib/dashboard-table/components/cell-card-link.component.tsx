/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { MouseEventHandler, ReactNode } from 'react';

import { ButtonTw, Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { useDefaultLogMode } from '@/bublik/features/user-preferences';

import { getUrl } from '../../utils';

/** Where a card's link leads: a page of the app, or another site. */
export type CellCardLinkTarget =
	| { to: string; state?: unknown }
	| { href: string };

export interface CellCardLinkProps {
	target: CellCardLinkTarget;
	label: string;
	onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/**
 * The link at the right end of a cell card's header, the Run link of the runs
 * table's Actions column in look.
 */
export function CellCardLink({ target, label, onClick }: CellCardLinkProps) {
	const content = (
		<>
			<Icon name="BoxArrowRight" className="mr-1.5" />
			{label}
		</>
	);

	return (
		<ButtonTw asChild variant="secondary" size="xss" className="shrink-0">
			{'href' in target ? (
				<a
					href={target.href}
					target="_blank"
					rel="noopener noreferrer"
					onClick={onClick}
				>
					{content}
				</a>
			) : (
				<LinkWithProject to={target.to} state={target.state} onClick={onClick}>
					{content}
				</LinkWithProject>
			)}
		</ButtonTw>
	);
}

export interface CellCardValueProps {
	/** Where the cell's badge leads; a value without it is plain text. */
	target?: CellCardLinkTarget;
	onClick?: MouseEventHandler<HTMLAnchorElement>;
	children: ReactNode;
}

/**
 * A badge's whole value in its card. The card lies over the badge, so the
 * value takes the badge's link with it: a click where the badge was still
 * goes where the badge leads.
 */
export function CellCardValue({
	target,
	onClick,
	children
}: CellCardValueProps) {
	if (!target) return children;

	if ('href' in target) {
		return (
			<a
				href={target.href}
				target="_blank"
				rel="noopener noreferrer"
				onClick={onClick}
				className="hover:underline"
			>
				{children}
			</a>
		);
	}

	return (
		<LinkWithProject
			to={target.to}
			state={target.state}
			onClick={onClick}
			className="hover:underline"
		>
			{children}
		</LinkWithProject>
	);
}

/** A card's link to the run of its row. */
export function CellCardRunLink({ runId }: { runId: number }) {
	const logMode = useDefaultLogMode();

	return (
		<CellCardLink target={{ to: getUrl('runs', runId, logMode) }} label="Run" />
	);
}
