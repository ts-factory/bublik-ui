/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { requestLogin } from '@/services/bublik-api';
import { Spinner } from '@/shared/tailwind-ui';

import { useAuth } from '../hooks';

interface ProtectedRouteProps {
	/** `admin`: a signed-in user without the role is asked to sign in as one. */
	access?: 'admin';
}

const NOTES = {
	user: 'To view this page you need to sign in.',
	admin: 'To view this page you need to sign in as an admin.'
} as const;

/**
 * Pathless layout route: renders its children only for a permitted session.
 * Otherwise it opens the login dialog as a `page` prompt and renders nothing;
 * the dialog itself leaves the page when dismissed (see LoginDialogContainer).
 */
function ProtectedRoute({ access }: ProtectedRouteProps) {
	const { user, isAdmin, isLoading } = useAuth();
	const allowed = access === 'admin' ? isAdmin : Boolean(user);

	useEffect(() => {
		if (isLoading || allowed) return;

		// Deduped by the prompt store, so StrictMode's double effect is harmless
		void requestLogin({ kind: 'page', message: NOTES[access ?? 'user'] });
	}, [isLoading, allowed, access]);

	if (isLoading) return <Spinner className="h-48" />;

	if (!allowed) return null;

	return <Outlet />;
}

export { ProtectedRoute };
export type { ProtectedRouteProps };
