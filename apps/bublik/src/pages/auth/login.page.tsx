/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { getRouteApi } from '@tanstack/react-router';

import { LoginFormContainer } from '@/bublik/features/auth';

const loginRoute = getRouteApi('/auth/login');

export const LoginPage = () => {
	const redirectUrl = loginRoute.useSearch({
		select: (search) => search.redirect_url
	});

	return <LoginFormContainer redirectUrl={redirectUrl} />;
};
