/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/**
 * Bridge between the base query and the login dialog.
 *
 * Lives outside Redux because it holds a pending promise, which is not serializable.
 * Every caller that needs a session awaits the same prompt, so a page firing
 * several rejected requests at once shows a single dialog.
 */

/**
 * - `page`: the page itself could not load (a rejected query). Dismissing the
 *   dialog leaves the page, since there is nothing to show without a session.
 * - `action`: the user tried to change something. Dismissing just closes.
 * - `manual`: the user chose to sign in (e.g. from the account menu), so
 *   there is nothing to explain. Dismissing just closes.
 */
export type LoginPromptKind = 'page' | 'action' | 'manual';

export interface LoginPromptReason {
	kind: LoginPromptKind;
	/** Shown in the dialog, e.g. "Log in to add notes." */
	message?: string;
}

type Listener = () => void;

let pending: Promise<boolean> | null = null;
let settle: ((ok: boolean) => void) | null = null;
let current: LoginPromptReason | null = null;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((listener) => listener());

/**
 * Opens the login dialog; resolves `true` once the user logged in, `false` if dismissed.
 * While a prompt is already open, a `page` request takes over any other one:
 * the page can't render without a session, so that is what the dialog must say.
 */
export function requestLogin(
	reason: LoginPromptReason = { kind: 'action' }
): Promise<boolean> {
	if (!pending) {
		pending = new Promise<boolean>((resolve) => {
			settle = resolve;
		});
		current = reason;
		notify();
	} else if (current?.kind !== 'page' && reason.kind === 'page') {
		current = reason;
		notify();
	}

	return pending;
}

/** Closes the login dialog and wakes up every request waiting on it. */
export function resolveLogin(ok: boolean) {
	if (!settle) return;

	const resolve = settle;

	pending = null;
	settle = null;
	current = null;
	resolve(ok);
	notify();
}

export function subscribeLoginPrompt(listener: Listener) {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
}

/** Why the dialog is open, or `null` when it is closed. Stable between changes. */
export function getLoginPrompt(): LoginPromptReason | null {
	return current;
}
