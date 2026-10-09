/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { useRouter } from '@tanstack/react-router';

/**
 * The path of a chat thread, or of the bare chat page without one, built by
 * the router from the typed route (`/chat/{-$threadId}` has an optional
 * param, so `/chat` alone is no `to` of its own), for the untyped
 * `LinkWithProject` and `useNavigateWithProject`. Basepath-free.
 */
function useChatPath(): (threadId?: string) => string {
	const router = useRouter();

	return useCallback(
		(threadId?: string) =>
			router.buildLocation({ to: '/chat/{-$threadId}', params: { threadId } })
				.pathname,
		[router]
	);
}

export { useChatPath };
