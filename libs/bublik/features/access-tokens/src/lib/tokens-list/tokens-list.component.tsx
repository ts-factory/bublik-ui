/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { ReactNode, useState } from 'react';
import { differenceInDays } from 'date-fns';

import { AccessToken } from '@/shared/types';
import {
	Badge,
	BadgeVariants,
	CopyTooltip,
	Icon,
	Skeleton,
	cn
} from '@/shared/tailwind-ui';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { RevokeTokenContainer } from '../revoke-token';
import { formatDay, formatMinute, formatRelative } from '../utils/token-dates';

/** A token this close to expiring is flagged, so it can be replaced in time. */
const EXPIRES_SOON_DAYS = 7;

export const TokensListLoading = () => {
	return (
		<div className="flex flex-col gap-1">
			{Array.from({ length: 3 }, () => 0).map((_, idx) => (
				<Skeleton key={idx} className="h-14 rounded-md" />
			))}
		</div>
	);
};

interface TokensListErrorProps {
	error: unknown;
}

export const TokensListError = ({ error = {} }: TokensListErrorProps) => {
	return <BublikErrorState error={error} className="h-64" />;
};

export const TokensListEmpty = () => {
	return (
		<BublikEmptyState
			title="No access tokens"
			description="Create one to let an agent, a CI job or a script call Bublik as you."
			className="h-64"
		/>
	);
};

const byNewest = (a: AccessToken, b: AccessToken) =>
	b.created.localeCompare(a.created);

interface TokensListProps {
	tokens: AccessToken[];
}

/**
 * A user's own tokens, in the settings modal: few enough to show whole, newest
 * first, so there is nothing to sort or page through. Revoked and expired
 * tokens are kept by the server for good, so they are folded away under their
 * own heading rather than piling up below the ones still in use.
 */
export const TokensList = ({ tokens }: TokensListProps) => {
	const [showInactive, setShowInactive] = useState(false);

	const sorted = [...tokens].sort(byNewest);
	const active = sorted.filter((token) => token.status === 'active');
	const inactive = sorted.filter((token) => token.status !== 'active');

	return (
		<div className="flex flex-col gap-3">
			<TokensTable
				testId="access-tokens-list"
				label="Active tokens"
				lastColumn="Expires"
			>
				{active.length ? (
					active.map((token) => <ActiveTokenRow key={token.id} token={token} />)
				) : (
					<tr>
						<td colSpan={6} className="px-3 py-4 text-sm text-text-menu">
							No tokens in use. Create one to let an agent, a CI job or a script
							call Bublik as you.
						</td>
					</tr>
				)}
			</TokensTable>
			{inactive.length ? (
				<div className="flex flex-col gap-2">
					<button
						type="button"
						aria-expanded={showInactive}
						onClick={() => setShowInactive((open) => !open)}
						className="flex items-center self-start gap-1 py-0.5 pl-0.5 pr-1.5 -ml-0.5 text-xs font-medium transition-colors rounded text-text-menu hover:bg-primary-wash hover:text-primary"
						data-testid="access-tokens-revoked-toggle"
					>
						<Icon
							name="ArrowShortTop"
							size={16}
							className={cn(
								'transition-transform',
								showInactive ? 'rotate-180' : 'rotate-90'
							)}
						/>
						Revoked and expired ({inactive.length})
					</button>
					{showInactive ? (
						<TokensTable
							testId="access-tokens-revoked-list"
							label="Revoked and expired tokens"
							lastColumn="Ended"
						>
							{inactive.map((token) => (
								<InactiveTokenRow key={token.id} token={token} />
							))}
						</TokensTable>
					) : null}
				</div>
			) : null}
		</div>
	);
};

interface TokensTableProps {
	testId: string;
	label: string;
	lastColumn: string;
	children: ReactNode;
}

/**
 * Both tables share their column widths, so the two line up, and every value
 * stays on one line: the table scrolls sideways before anything wraps.
 */
const TokensTable = ({
	testId,
	label,
	lastColumn,
	children
}: TokensTableProps) => {
	return (
		<div className="overflow-x-auto border rounded-lg border-border-primary">
			<table
				aria-label={label}
				className="w-full text-xs table-fixed min-w-[740px] tabular-nums whitespace-nowrap"
				data-testid={testId}
			>
				<colgroup>
					<col />
					<col className="w-[120px]" />
					<col className="w-[132px]" />
					<col className="w-[132px]" />
					<col className="w-[168px]" />
					<col className="w-[96px]" />
				</colgroup>
				<thead className="border-b bg-bg-body border-border-primary">
					<tr className="text-left text-[0.6875rem] font-semibold text-text-menu">
						<th className="px-3 py-2 font-semibold">Name</th>
						<th className="px-3 py-2 font-semibold">Token</th>
						<th className="px-3 py-2 font-semibold">Created</th>
						<th className="px-3 py-2 font-semibold">Last used</th>
						<th className="px-3 py-2 font-semibold">{lastColumn}</th>
						<th className="px-3 py-2">
							<span className="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border-primary">{children}</tbody>
			</table>
		</div>
	);
};

const NameCells = ({ token }: { token: AccessToken }) => {
	const isRevoked = token.status === 'revoked';

	return (
		<>
			<td className="px-3 py-2.5">
				<span
					title={token.name}
					className={cn(
						'block text-sm font-medium truncate',
						isRevoked ? 'line-through text-text-menu' : 'text-text-primary'
					)}
				>
					{token.name}
				</span>
			</td>
			<td className="px-3 py-2.5">
				{/* The handle: the only part of a token that stays visible. */}
				<CopyTooltip copyString={token.prefix}>
					<span className="font-mono text-text-menu">{token.prefix}…</span>
				</CopyTooltip>
			</td>
		</>
	);
};

const MinuteCell = ({
	value,
	empty
}: {
	value: string | null;
	empty: string;
}) => {
	return (
		<td className={cn('px-3 py-2.5', !value && 'text-text-menu')}>
			{value ? formatMinute(value) : empty}
		</td>
	);
};

const ExpiresBadge = ({ expiresAt }: { expiresAt: string | null }) => {
	if (!expiresAt) {
		return <Badge variant={BadgeVariants.Caution}>Never expires</Badge>;
	}

	const isSoon =
		differenceInDays(new Date(expiresAt), new Date()) < EXPIRES_SOON_DAYS;

	return (
		<Badge
			variant={isSoon ? BadgeVariants.Caution : BadgeVariants.Neutral}
			className="text-text-primary"
		>
			{formatDay(expiresAt)} · {formatRelative(expiresAt)}
		</Badge>
	);
};

const ActiveTokenRow = ({ token }: { token: AccessToken }) => {
	return (
		<tr data-testid="access-token-item" className="text-text-primary">
			<NameCells token={token} />
			<MinuteCell value={token.created} empty="" />
			<MinuteCell value={token.last_used_at} empty="Never used" />
			<td className="px-3 py-2.5">
				<ExpiresBadge expiresAt={token.expires_at} />
			</td>
			<td className="px-3 py-2.5 text-right">
				<RevokeTokenContainer id={token.id} name={token.name} showLabel />
			</td>
		</tr>
	);
};

const InactiveTokenRow = ({ token }: { token: AccessToken }) => {
	const ended =
		token.status === 'revoked'
			? [
					'Revoked',
					token.revoked_at ? formatDay(token.revoked_at) : null,
					token.revoked_by ? `by ${token.revoked_by}` : null
			  ]
			: ['Expired', token.expires_at ? formatDay(token.expires_at) : null];
	const endedLabel = ended.filter(Boolean).join(' ');

	return (
		<tr data-testid="access-token-item" className="text-text-menu">
			<NameCells token={token} />
			<MinuteCell value={token.created} empty="" />
			<MinuteCell value={token.last_used_at} empty="Never used" />
			<td colSpan={2} className="px-3 py-2.5">
				<span title={endedLabel} className="block truncate">
					{endedLabel}
				</span>
			</td>
		</tr>
	);
};
