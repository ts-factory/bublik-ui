/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ReactNode } from 'react';

import { requestLogin, useMeQuery } from '@/services/bublik-api';
import { cn, Tooltip } from '@/shared/tailwind-ui';

interface LoginRequiredProps {
	/** Tooltip shown while signed out, e.g. "Log in to add notes". */
	message: string;
	children: ReactNode;
	className?: string;
}

/**
 * Renders `children` as is for a logged-in user. Otherwise shows them unchanged
 * but inert, wrapped in a "log in" button: the tooltip explains why the action
 * is unavailable and clicking opens the login dialog.
 *
 * While the session is still being checked the action stays enabled: if the
 * request is then rejected the base query asks for login anyway.
 */
function LoginRequired({ message, children, className }: LoginRequiredProps) {
	const { data: user, isLoading } = useMeQuery();

	if (user || isLoading) return children;

	// Just closes when dismissed: the page itself stays usable
	const promptLogin = () =>
		void requestLogin({ kind: 'action', message: `${message}.` });

	return (
		<Tooltip content={message}>
			<span
				role="button"
				tabIndex={0}
				aria-label={message}
				data-testid="login-required"
				className={cn('inline-flex cursor-pointer', className)}
				onClick={promptLogin}
				onKeyDown={(e) => {
					if (e.key !== 'Enter' && e.key !== ' ') return;
					e.preventDefault();
					promptLogin();
				}}
			>
				<span
					className="inline-flex pointer-events-none"
					aria-hidden
					// Keep the wrapped action out of focus order, clicks and the a11y tree.
					// React 18 does not know `inert`, so it is set on the node directly.
					ref={(node) => node?.setAttribute('inert', '')}
				>
					{children}
				</span>
			</span>
		</Tooltip>
	);
}

export { LoginRequired };
export type { LoginRequiredProps };
