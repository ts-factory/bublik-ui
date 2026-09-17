/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useState } from 'react';

import { CreatedAccessToken } from '@/shared/types';
import { useGetAccessTokensQuery } from '@/services/bublik-api';
import { Badge, BadgeVariants } from '@/shared/tailwind-ui';

import { CreateTokenFormContainer } from '../create-token-form';
import { TokenCreatedBanner } from '../token-created-banner';
import {
	TokensList,
	TokensListEmpty,
	TokensListError,
	TokensListLoading
} from '../tokens-list';
import { formatZone } from '../utils/token-dates';

/**
 * The settings tab's tokens: a heading that keeps "New token" in reach
 * whatever the list's state, the value of a token just created, and the list.
 */
export const AccessTokensPanelContainer = () => {
	const { data, isLoading, error } = useGetAccessTokensQuery();
	/*
	 * Component state only, and cleared on dismiss. The value never goes into
	 * the RTK Query cache, a query param or localStorage -- it is
	 * unrecoverable, so the fewer places it lands the better.
	 */
	const [createdToken, setCreatedToken] = useState<CreatedAccessToken | null>(
		null
	);

	const activeCount = data?.filter((token) => token.status === 'active').length;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<h3 className="text-base font-medium text-text-primary">Active</h3>
				{activeCount !== undefined ? (
					<Badge variant={BadgeVariants.Neutral}>{activeCount}</Badge>
				) : null}
				<span className="text-xs text-text-menu">Times in {formatZone()}</span>
				<div className="ml-auto">
					<CreateTokenFormContainer onCreated={setCreatedToken} />
				</div>
			</div>
			<TokenCreatedBanner
				token={createdToken}
				onDismiss={() => setCreatedToken(null)}
			/>
			{error ? (
				<TokensListError error={error} />
			) : isLoading ? (
				<TokensListLoading />
			) : data?.length ? (
				<TokensList tokens={data} />
			) : (
				<TokensListEmpty />
			)}
		</div>
	);
};
