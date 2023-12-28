/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { PropsWithChildren } from 'react';
import { Navigate, Outlet, To, useLocation } from 'react-router-dom';

import { config } from '@/bublik/config';

import { useAuth } from '../hooks';

type GetDefaultRedirectConfig = { pathname: string; search: string };

export const getDefaultRedirect = (urlConfig?: GetDefaultRedirectConfig) => {
	const DEFAULT_REDIRECT_AUTH = '/auth/login';

	if (!urlConfig) return `${DEFAULT_REDIRECT_AUTH}`;

	return `${DEFAULT_REDIRECT_AUTH}?redirect_url=${window.location.origin}${config.baseUrl}${urlConfig.pathname}`;
};

export type CommonPrivateRouteProps = {
	redirectTo?: To;
};

export type PrivateRouteProps = CommonPrivateRouteProps & object;

export const PrivateRoute = (props: PropsWithChildren<PrivateRouteProps>) => {
	const location = useLocation();
	const { redirectTo = getDefaultRedirect(location) } = props;
	const { user, isLoading } = useAuth();

	if (isLoading) return null;

	if (!user) return <Navigate to={redirectTo} replace />;

	return props.children;
};

export type PrivateRouteLayoutProps = CommonPrivateRouteProps & object;

export const PrivateRouteLayoutOutlet = (props: PrivateRouteLayoutProps) => {
	const location = useLocation();
	const { redirectTo = getDefaultRedirect(location) } = props;
	const { user, isLoading } = useAuth();

	if (isLoading) return null;

	if (!user) return <Navigate to={redirectTo} replace />;

	return <Outlet />;
};
