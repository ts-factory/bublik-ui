/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentType, ReactNode, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, To, useNavigate } from 'react-router-dom';

import { User } from '@/shared/types';
import { routes } from '@/router';
import { toast } from '@/shared/tailwind-ui';
import {
	bublikAPI,
	useActivateEmailMutation,
	useChangePasswordMutation,
	useLoginMutation,
	useLogoutMutation,
	useMeQuery
} from '@/services/bublik-api';

export type AuthenticatedUser = {
	firstName: User['first_name'];
	lastName: User['last_name'];
	email: User['email'];
	isActive: boolean;
	roles: User['roles'][];
	displayName: string;
};

export const useAuth = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const [login] = useLoginMutation();
	const [logoutMutation] = useLogoutMutation();
	const [changePasswordMutation] = useChangePasswordMutation();
	const [verifyEmail] = useActivateEmailMutation();

	const { data, isLoading } = useMeQuery();

	const user = useMemo<AuthenticatedUser | null>(() => {
		if (!data) return null;

		return {
			firstName: data.first_name,
			lastName: data.last_name,
			email: data.email,
			isActive: Boolean(data.is_active),
			displayName: `${data.first_name} ${data.last_name}`,
			roles: [data.roles]
		};
	}, [data]);

	const logout = async () => {
		try {
			await logoutMutation().unwrap();
			dispatch(bublikAPI.util.resetApiState());
			navigate(routes.dashboard({}));
		} catch {
			toast.error('Failed to logout');
		}
	};

	return {
		login,
		logout,
		user: user,
		isLoading,
		isAdmin: Boolean(user?.roles.includes('admin')),
		changePassword: changePasswordMutation,
		verifyEmail
	};
};

interface WithAuthConfig {
	fallback?: ReactNode;
	redirectTo?: To;
}

export interface WithAuthProps {
	firstName: string;
	lastName: string;
}

export const withAuth = <T extends WithAuthProps = WithAuthProps>(
	WrappedComponent: ComponentType<T>
) => {
	return (config?: WithAuthConfig) => (props: Omit<T, keyof WithAuthProps>) => {
		const { user, isLoading } = useAuth();

		if (isLoading) return config?.fallback || null;

		if (!user) return <Navigate to={config?.redirectTo ?? '/auth/login'} />;

		return <WrappedComponent {...user} {...(props as T)} />;
	};
};
