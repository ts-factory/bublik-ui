/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';

import {
	getLoginPrompt,
	requestLogin,
	resolveLogin,
	subscribeLoginPrompt
} from './login-prompt';

describe('login prompt', () => {
	it('shares one prompt between concurrent callers', async () => {
		const listener = vi.fn();
		const unsubscribe = subscribeLoginPrompt(listener);

		const first = requestLogin({ kind: 'action' });
		const second = requestLogin({ kind: 'action' });

		expect(first).toBe(second);
		expect(getLoginPrompt()).toEqual({ kind: 'action' });

		resolveLogin(true);

		await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
		expect(getLoginPrompt()).toBeNull();
		// opened once, closed once
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
	});

	it('lets a page request take over an open action prompt', async () => {
		const action = requestLogin({
			kind: 'action',
			message: 'Log in to add notes.'
		});
		const page = requestLogin({ kind: 'page' });

		expect(page).toBe(action);
		expect(getLoginPrompt()).toEqual({ kind: 'page' });

		// ...but not the other way around
		requestLogin({ kind: 'action', message: 'ignored' });
		expect(getLoginPrompt()).toEqual({ kind: 'page' });

		resolveLogin(false);
		await expect(action).resolves.toBe(false);
	});

	it('lets a page request take over a manual sign-in too', async () => {
		const manual = requestLogin({ kind: 'manual' });
		expect(getLoginPrompt()).toEqual({ kind: 'manual' });

		// A rejected page load while the user is signing in must explain itself
		requestLogin({ kind: 'page' });
		expect(getLoginPrompt()).toEqual({ kind: 'page' });

		resolveLogin(true);
		await expect(manual).resolves.toBe(true);
	});

	it('keeps the snapshot stable while nothing changes', () => {
		requestLogin({ kind: 'page' });
		expect(getLoginPrompt()).toBe(getLoginPrompt());
		resolveLogin(false);
	});

	it('opens a fresh prompt after the previous one was dismissed', async () => {
		const dismissed = requestLogin();
		resolveLogin(false);
		await expect(dismissed).resolves.toBe(false);

		const next = requestLogin();
		expect(next).not.toBe(dismissed);
		resolveLogin(true);
		await expect(next).resolves.toBe(true);
	});

	it('ignores resolve without an open prompt', () => {
		expect(() => resolveLogin(true)).not.toThrow();
		expect(getLoginPrompt()).toBeNull();
	});
});
