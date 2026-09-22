/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

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
	const location = useLocation();

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

	// Set by logout: the cache is dropped only once the page being left is gone
	const resetOnArrival = useRef(false);

	useEffect(() => {
		if (!resetOnArrival.current) return;

		resetOnArrival.current = false;
		dispatch(bublikAPI.util.resetApiState());
	}, [location, dispatch]);

	const logout = async () => {
		try {
			await logoutMutation().unwrap();
			// Leave before resetting the cache: a reset makes every mounted query
			// refetch, and a protected page would be rejected and ask to sign in
			// again over the dashboard. The effect above resets once the dashboard
			// has rendered and the old page is unmounted.
			resetOnArrival.current = true;
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
