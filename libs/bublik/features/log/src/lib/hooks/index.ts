/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';

import { toast } from '@/shared/tailwind-ui';

import { useLogRunId, useLogSearch, useLogSearchWriter } from './log-search';

export { useAllPagesMemory } from './all-pages-memory';
export { useLogSearch, useLogSearchWriter } from './log-search';
export type { LogSearch, LogSearchChanges } from './log-search';

/**
 * The renderer (`legacy`, or the deprecated `experimental=false`) and its
 * toggle, a push that writes `legacy=true|false` and drops `experimental`.
 */
export const useIsLogLegacy = () => {
	const { isLegacyLog } = useLogSearch();
	const writeLogSearch = useLogSearchWriter();

	const toggleLog = () => {
		writeLogSearch({ experimental: undefined, legacy: !isLegacyLog });
	};

	return { isLegacyLog, toggleLog } as const;
};

/**
 * The log page's search, shared by the main app and the standalone log
 * viewer. Every write is a push, so Back walks across focus changes.
 */
export const useLogPage = () => {
	const runId = useLogRunId();
	const { focusId, lineNumber, mode, page } = useLogSearch();
	const writeLogSearch = useLogSearchWriter();
	const isShowingRunLog = !focusId;

	const showRunLog = useCallback(() => {
		writeLogSearch({
			focusId: undefined,
			lineNumber: undefined,
			page: undefined
		});
	}, [writeLogSearch]);

	const setLineNumber = useCallback(
		(lineNumber: string) => {
			writeLogSearch({ lineNumber });

			toast.success(`Saved location at line ${lineNumber.split('_')[1]}`);
		},
		[writeLogSearch]
	);

	const setFocusId = useCallback(
		(focusId: string | number) => {
			writeLogSearch({
				focusId: focusId.toString(),
				lineNumber: undefined,
				page: undefined
			});
		},
		[writeLogSearch]
	);

	// Page one is never written: the publisher only suffixes pages above it.
	const setPage = useCallback(
		(page: number | string) => {
			writeLogSearch({
				page: Number(page) === 1 ? undefined : page.toString(),
				lineNumber: undefined
			});
		},
		[writeLogSearch]
	);

	return {
		page,
		mode,
		focusId,
		isShowingRunLog,
		runId,
		showRunLog,
		setLineNumber,
		setFocusId,
		setPage,
		lineNumber
	};
};
