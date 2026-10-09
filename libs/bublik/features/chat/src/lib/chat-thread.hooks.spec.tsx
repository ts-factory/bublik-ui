/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHookWithRouter } from '@/router/testing';

import {
	useMintThreadOnBareChat,
	useStartNewThread
} from './chat-thread.hooks';

const MINTED = '0b9a3c3e-6f3e-4c1e-9d6a-2f4b8e1c7a55';

/** The page's own keys plus the ones every link carries. */
const SEARCH = 'project=3&_s=abc&hide-sidebar=1&settings-open=1';
/** What a project-aware navigation keeps of it, in the order it writes them. */
const CARRIED = '?_s=abc&hide-sidebar=1&project=3';

describe('chat thread navigation', () => {
	beforeEach(() => {
		vi.spyOn(crypto, 'randomUUID').mockReturnValue(MINTED);
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	describe('useMintThreadOnBareChat', () => {
		it('turns a bare /chat into /chat/<new id> in place, carrying project and sidebar state', async () => {
			const { router } = await renderHookWithRouter(
				() => useMintThreadOnBareChat(undefined),
				{ path: '/chat', search: SEARCH }
			);

			await waitFor(() =>
				expect(router.history.location.pathname).toBe(`/v2/chat/${MINTED}`)
			);
			expect(router.history.location.search).toBe(CARRIED);
			expect(router.history.location.hash).toBe('');
			// Replaced: Back leaves the assistant instead of bouncing off `/chat`.
			expect(router.history.length).toBe(1);
		});

		it('leaves a thread address alone', async () => {
			const { router } = await renderHookWithRouter(
				() => useMintThreadOnBareChat('42'),
				{ path: '/chat/42', search: SEARCH }
			);

			// Give a navigation the chance to land before asserting none did.
			await act(() => Promise.resolve());

			expect(router.history.location.href).toBe(`/v2/chat/42?${SEARCH}`);
			expect(router.history.length).toBe(1);
		});
	});

	describe('useStartNewThread', () => {
		it('pushes /chat/<new id>, carrying project and sidebar state', async () => {
			const { result, router } = await renderHookWithRouter(
				() => useStartNewThread(),
				{ path: '/chat/42', search: SEARCH }
			);

			act(() => result.current());

			await waitFor(() =>
				expect(router.history.location.pathname).toBe(`/v2/chat/${MINTED}`)
			);
			expect(router.history.location.search).toBe(CARRIED);
			// Pushed: Back returns to the previous thread.
			expect(router.history.length).toBe(2);
		});
	});
});
