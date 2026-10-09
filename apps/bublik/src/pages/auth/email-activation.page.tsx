/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { getRouteApi, useNavigate } from '@tanstack/react-router';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useMount } from '@/shared/hooks';
import { VerifyEmailSchemaInputs } from '@/shared/types';
import { useAuth } from '@/bublik/features/auth';
import { toast } from '@/shared/tailwind-ui';

// The emails link it with a trailing slash; `trailingSlash: 'preserve'` keeps it.
const emailActivationRoute = getRouteApi(
	'/auth/register/activate/$userId/$token'
);

export const EmailActivationPage = () => {
	const { verifyEmail } = useAuth();
	const params = emailActivationRoute.useParams();
	const navigate = useNavigate();

	useMount(async () => {
		try {
			const inputs = VerifyEmailSchemaInputs.parse(params);

			await verifyEmail(inputs).unwrap();
			trackEvent(analyticsEventNames.authEmailActivationResult, {
				status: 'success'
			});

			toast.success('The email is verified. You are registered.');
			navigate({ to: '/auth/login', resetScroll: false });
		} catch (e) {
			trackEvent(analyticsEventNames.authEmailActivationResult, {
				status: 'error'
			});

			toast.error('Failed to verify email!');
		}
	});

	return <h1 className="text-2xl">Email verification in progress...</h1>;
};
