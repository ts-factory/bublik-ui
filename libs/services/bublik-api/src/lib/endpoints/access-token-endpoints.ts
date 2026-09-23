/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

import {
	AccessToken,
	CreateAccessTokenInputs,
	CreatedAccessToken
} from '@/shared/types';

export const accessTokenEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getAccessTokens: build.query<AccessToken[], void>({
			query: () => ({
				url: withApiV2('/auth/tokens'),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.AccessTokens]
		}),
		/**
		 * The only response that carries a token's value. Deliberately a
		 * mutation with no `fixedCacheKey`, so the plaintext is handed to the
		 * caller once and never parked in the RTK Query cache.
		 */
		createAccessToken: build.mutation<
			CreatedAccessToken,
			CreateAccessTokenInputs
		>({
			query: (body) => ({
				url: withApiV2('/auth/tokens'),
				method: 'POST',
				body
			}),
			invalidatesTags: [BUBLIK_TAG.AccessTokens, BUBLIK_TAG.AdminAccessTokens]
		}),
		/**
		 * Revoking keeps the record, so this is a POST rather than a DELETE.
		 * Admins may revoke anyone's token; everyone else only their own.
		 */
		revokeAccessToken: build.mutation<AccessToken, number>({
			query: (id) => ({
				url: withApiV2(`/auth/tokens/${id}/revoke`),
				method: 'POST'
			}),
			invalidatesTags: [BUBLIK_TAG.AccessTokens, BUBLIK_TAG.AdminAccessTokens]
		}),
		adminGetAccessTokens: build.query<AccessToken[], void>({
			query: () => ({
				url: withApiV2('/auth/tokens/all'),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.AdminAccessTokens]
		})
	})
};
