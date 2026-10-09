/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useEffect } from 'react';

import { useNavigateWithProject } from '@/bublik/features/projects';

import { useChatPath } from './chat-path';

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
	const chatPath = useChatPath();

	return useCallback(
		(options?: StartNewThreadOptions) =>
			navigate(chatPath(crypto.randomUUID()), options),
		[navigate, chatPath]
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
