/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';

import { ResetState } from '@/shared/tailwind-ui';

/**
 * The router's default error component: the existing `ResetState`
 * UI with the thrown error, which the React Router tree's `ErrorBoundary`
 * never received. Reload re-runs the failed match instead of reloading the
 * document; Go back keeps the class component's behaviour.
 */
function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
	const router = useRouter();

	function handleReload() {
		reset();
		void router.invalidate();
	}

	function handleGoBack() {
		reset();
		router.history.back();
	}

	return (
		<ResetState
			error={error}
			onReloadClick={handleReload}
			onGoBackClick={handleGoBack}
		/>
	);
}

export { RouteErrorBoundary };
