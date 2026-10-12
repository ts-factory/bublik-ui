/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import {
	useParams,
	useRouter,
	useSearch,
	type AnyRouter
} from '@tanstack/react-router';

import { boolTrue, str, writeSearch } from '@/router';

/**
 * The log keys both apps read. The main app's `/log/$runId` route validates
 * them (`focusId` a number, `legacy` a boolean); the standalone
 * log viewer declares only `focusId` and `page`, as strings (a bundle's node
 * ids are file names), and passes the rest through raw. So these hooks read
 * the search of the route match they render in, whichever router it is, and
 * accept either form of each value.
 */
interface LogSearch {
	/** `parseInt` of a raw id, as before: a non-numeric bundle id is `NaN`. */
	focusId: number | null;
	lineNumber: string | null;
	mode: string | null;
	page: string | null;
	/** `legacy=true`, or the deprecated `experimental=false`. */
	isLegacyLog: boolean;
}

/** A write: `undefined` deletes a key, every other key is kept. */
type LogSearchChanges = Record<string, unknown>;

const LEGACY = boolTrue();
const RAW = str();

function toFocusId(raw: unknown): number | null {
	if (typeof raw === 'number') return raw;

	const text = RAW.parse(raw);

	return text ? parseInt(text) : null;
}

/** The log keys of a route match's search, typed or raw. */
function readLogSearch(search: Record<string, unknown>): LogSearch {
	return {
		focusId: toFocusId(search.focusId),
		lineNumber: RAW.parse(search.lineNumber) ?? null,
		mode: RAW.parse(search.mode) ?? null,
		page: RAW.parse(search.page) ?? null,
		isLegacyLog:
			LEGACY.parse(search.legacy) === true ||
			RAW.parse(search.experimental) === 'false'
	};
}

/** The log keys of the route match on screen, structurally shared. */
function useLogSearch(): LogSearch {
	return useSearch({ strict: false, select: readLogSearch });
}

/** `runId` of the route match on screen; the log viewer has none. */
function useLogRunId(): number | undefined {
	return useParams({ strict: false }).runId;
}

/**
 * Pushes `changes` onto the current search, as React Router's
 * `setSearchParams((prev) => { mutate; return prev })` did: on
 * the pathname the router is at (verbatim, a trailing slash kept), the hash
 * and `location.state` dropped, the window scroll left alone. A key
 * the search does not have yet is appended, as `URLSearchParams.set` did, and
 * the route middlewares serialize typed and raw values alike.
 */
function useLogSearchWriter(): (changes: LogSearchChanges) => void {
	const router = useRouter<AnyRouter>();

	return useCallback(
		(changes: LogSearchChanges) => {
			writeSearch(router, changes, { replace: false, keepState: false });
		},
		[router]
	);
}

export { readLogSearch, useLogRunId, useLogSearch, useLogSearchWriter };
export type { LogSearch, LogSearchChanges };
