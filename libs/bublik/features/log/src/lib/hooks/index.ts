/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { toast } from '@/shared/tailwind-ui';
import { LogPageParams } from '@/shared/types';

const EXPERIMENTAL_KEY = 'experimental';
const LEGACY_KEY = 'legacy';
const FOCUS_ID_KEY = 'focusId';
const LINE_NUMBER_KEY = 'lineNumber';
const MODE_KEY = 'mode';
const PAGE_KEY = 'page';

export const useIsLogLegacy = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const isLegacyLog =
		searchParams.get(LEGACY_KEY) === 'true' ||
		searchParams.get(EXPERIMENTAL_KEY) === 'false';

	const toggleLog = () => {
		const params = new URLSearchParams(searchParams);

		if (
			searchParams.get(LEGACY_KEY) === 'true' ||
			searchParams.get(EXPERIMENTAL_KEY) === 'false'
		) {
			params.delete(EXPERIMENTAL_KEY);
			params.set(LEGACY_KEY, 'false');
		} else {
			params.delete(EXPERIMENTAL_KEY);
			params.set(LEGACY_KEY, 'true');
		}

		setSearchParams(params);
	};

	return { isLegacyLog, toggleLog } as const;
};

export const useLogPage = () => {
	const { runId } = useParams<LogPageParams>();
	const [searchParams, setSearchParams] = useSearchParams();
	const maybeFocusId = searchParams.get(FOCUS_ID_KEY);
	const lineNumber = searchParams.get(LINE_NUMBER_KEY);
	const focusId = maybeFocusId ? parseInt(maybeFocusId) : null;
	const isShowingRunLog = !focusId;
	const mode = searchParams.get(MODE_KEY);
	const page = searchParams.get(PAGE_KEY);

	const showRunLog = useCallback(() => {
		setSearchParams((params) => {
			params.delete(FOCUS_ID_KEY);
			params.delete(LINE_NUMBER_KEY);
			params.delete(PAGE_KEY);

			return params;
		});
	}, [setSearchParams]);

	const setLineNumber = useCallback(
		(lineNumber: string) => {
			setSearchParams((params) => {
				params.set(LINE_NUMBER_KEY, lineNumber);

				return params;
			});

			toast.success(`Saved location at line ${lineNumber.split('_')[1]}`);
		},
		[setSearchParams]
	);

	const setFocusId = useCallback(
		(focusId: string | number) => {
			setSearchParams((params) => {
				params.set(FOCUS_ID_KEY, focusId.toString());
				params.delete(LINE_NUMBER_KEY);
				params.delete(PAGE_KEY);

				return params;
			});
		},
		[setSearchParams]
	);

	const setPage = useCallback(
		(page: number | string) => {
			setSearchParams((params) => {
				if (Number(page) === 1) {
					params.delete(PAGE_KEY);
				} else {
					params.set(PAGE_KEY, page.toString());
				}

				params.delete(LINE_NUMBER_KEY);
				return params;
			});
		},
		[setSearchParams]
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
