/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useEffect } from 'react';

import { useNavigateWithProject } from '@/bublik/features/projects';

interface StartNewThreadOptions {
	/** Replace the current entry instead of pushing a new one. */
	replace?: boolean;
}

/**
 * Opens a fresh conversation at `/chat/<new id>`: a push, so
 * Back returns to the previous thread. The project scope, the sidebar state
 * and `hide-sidebar` follow, as from the sidebar links; the thread row is
 * created lazily on the server with the first persisted message.
 */
function useStartNewThread(): (options?: StartNewThreadOptions) => void {
	const navigate = useNavigateWithProject();

	return useCallback(
		(options?: StartNewThreadOptions) =>
			void navigate({
				to: '/chat/{-$threadId}',
				params: { threadId: crypto.randomUUID() },
				replace: options?.replace
			}),
		[navigate]
	);
}

/**
 * Every conversation needs a stable id (the persistence and AG-UI key): on a
 * bare `/chat`, mints one and moves to `/chat/<new id>` in place, so Back
 * leaves the assistant rather than bouncing off the bare address.
 */
function useMintThreadOnBareChat(threadId: string | undefined): void {
	const startNewThread = useStartNewThread();

	useEffect(() => {
		if (!threadId) startNewThread({ replace: true });
	}, [threadId, startNewThread]);
}

export { useMintThreadOnBareChat, useStartNewThread };
export type { StartNewThreadOptions };
