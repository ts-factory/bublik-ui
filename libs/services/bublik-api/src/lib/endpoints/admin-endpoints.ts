/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

import {
	AdminCreateUserInputs,
	AdminDeleteUserInputs,
	AdminUpdateUserInputs,
	User
} from '@/shared/types';

export const adminUsersEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		adminGetUsers: build.query<User[], void>({
			query: () => ({
				url: withApiV2('/auth/admin'),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.AdminUsersTable]
		}),
		adminCreateUser: build.mutation<User, AdminCreateUserInputs>({
			query: (createdUser) => ({
				url: withApiV2('/auth/admin/create_user'),
				method: 'POST',
				body: createdUser
			}),
			invalidatesTags: [BUBLIK_TAG.AdminUsersTable]
		}),
		adminUpdateUser: build.mutation<unknown, AdminUpdateUserInputs>({
			query: (updatedUser) => ({
				url: withApiV2('/auth/admin/update_user'),
				method: 'POST',
				body: updatedUser
			}),
			invalidatesTags: [BUBLIK_TAG.AdminUsersTable]
		}),
		adminDeleteUser: build.mutation<unknown, AdminDeleteUserInputs>({
			query: (deletedUser) => ({
				url: withApiV2('/auth/admin/deactivate_user'),
				method: 'POST',
				body: deletedUser
			}),
			invalidatesTags: [BUBLIK_TAG.AdminUsersTable]
		})
	})
};
