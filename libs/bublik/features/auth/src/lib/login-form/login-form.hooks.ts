/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useRouter } from '@tanstack/react-router';

import { currentLocation, resolveTo } from '@/router';

import { getRouterUrl } from '../auth.utils';

/**
 * Where a successful sign-in on the login page goes: back to
 * `redirect_url`, the absolute pre-login URL, with the base URL stripped
 * (a push); without one, the dashboard in place of the login page.
 */
function useLoginRedirect(): (redirectUrl: string | undefined) => void {
	const router = useRouter();

	return useCallback(
		(redirectUrl: string | undefined) => {
			if (redirectUrl) {
				// Any page of the app: the target is only known at runtime
				const target = resolveTo(
					getRouterUrl(redirectUrl),
					currentLocation(router).pathname
				);

				void router.navigate({ ...target, resetScroll: false });
				return;
			}

			void router.navigate({
				to: '/dashboard',
				replace: true,
				resetScroll: false
			});
		},
		[router]
	);
}

export { useLoginRedirect };
