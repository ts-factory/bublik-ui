/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';

import { BublikBaseQueryFn, withApiV2 } from '../config';
import { BUBLIK_TAG } from '../types';
import { API_REDUCER_PATH } from '../constants';

import type {
	ChangePasswordInputs,
	ForgotPasswordInputs,
	LoginFormInputs,
	LoginMutationResponse,
	RefreshTokenMutationResponse,
	ResetPasswordParamsInputs,
	ResetUserPasswordFormInputs,
	UpdateUserProfileInfoInputs,
	User,
	VerifyEmailInputs
} from '@/shared/types';

export const authUrls = {
	register: { url: '/auth/register/' },
	login: { url: '/auth/login/' },
	me: { url: '/api/v2/auth/profile/info/' },
	changePassword: { url: '/api/v2/auth/profile/password_reset/' },
	refresh: { url: '/auth/refresh/' },
	logout: { url: '/auth/logout/' },
	requestResetPassword: { url: '/auth/forgot_password/' }
} as const;

export const authEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		login: build.mutation<LoginMutationResponse, LoginFormInputs>({
			query: (inputs) => ({
				url: authUrls.login.url,
				method: 'POST',
				body: inputs
			}),
			invalidatesTags: [BUBLIK_TAG.User]
		}),
		refresh: build.mutation<RefreshTokenMutationResponse, void>({
			query: () => ({ url: authUrls.refresh.url, method: 'POST' }),
			invalidatesTags: [BUBLIK_TAG.User]
		}),
		logout: build.mutation<void, void>({
			query: () => ({ url: authUrls.logout.url, method: 'POST' }),
			invalidatesTags: [BUBLIK_TAG.User]
		}),
		me: build.query<User, void>({
			query: () => ({
				url: authUrls.me.url,
				cache: 'no-store'
			}),
			providesTags: () => [BUBLIK_TAG.User],
			keepUnusedDataFor: Number.MAX_SAFE_INTEGER
		}),
		requestResetPassword: build.mutation<unknown, ForgotPasswordInputs>({
			query: (form) => ({
				url: authUrls.requestResetPassword.url,
				method: 'POST',
				body: form
			})
		}),
		resetPassword: build.mutation<
			{ message: string },
			ResetPasswordParamsInputs & ResetUserPasswordFormInputs
		>({
			query: (form) => ({
				url: `/auth/forgot_password/password_reset/${form.userId}/${form.resetToken}/`,
				method: 'PUT',
				body: {
					new_password: form.new_password,
					new_password_confirm: form.new_password_confirm
				}
			})
		}),
		changePassword: build.mutation<unknown, ChangePasswordInputs>({
			query: (form) => ({
				url: authUrls.changePassword.url,
				method: 'POST',
				body: form
			})
		}),
		activateEmail: build.mutation<{ message: string }, VerifyEmailInputs>({
			query: ({ userId, token }) => ({
				url: `/auth/register/activate/${userId}/${token}/`,
				method: 'GET'
			})
		}),
		updateProfileInfo: build.mutation<unknown, UpdateUserProfileInfoInputs>({
			query: (form) => ({
				url: withApiV2('/auth/profile/update_info'),
				method: 'POST',
				body: form
			}),
			invalidatesTags: [BUBLIK_TAG.User]
		})
	})
};
