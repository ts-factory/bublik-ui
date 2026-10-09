/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * The `location.state` keys the app passes between pages, so
 * `<Link state>`, `navigate({ state })` and `location.state` are typed.
 * TanStack keeps its own `__TSR_key`/`__TSR_index` next to them, which is
 * why nothing may call `history.replaceState(null, …)`.
 */
declare module '@tanstack/react-router' {
	interface HistoryState {
		/** Dashboard → run: open the unexpected results of the run. */
		openUnexpected?: boolean;
		/** Dashboard → run: open the unexpected results, results view. */
		openUnexpectedResults?: boolean;
		/** Tells one dashboard click from the next, so a repeated click re-opens. */
		openUnexpectedIntentId?: string;
		/** Run → history preview: the history page waits for the user's search. */
		fromRun?: boolean;
	}
}

export {};
