/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import {
	useGetMetasSearchOptionsQuery,
	useGetParamsSearchOptionsQuery
} from '@/services/bublik-api';
import { useDebounce } from '@/shared/hooks';
import { useProjectSearch } from '@/bublik/features/projects';

/** How long the test name has to settle before its parameters are fetched. */
const TEST_NAME_DEBOUNCE_MS = 300;

const NO_SUGGESTIONS: readonly string[] = [];

/**
 * The test name the parameter list can be asked about, or `null` when there
 * is none: an empty field, or a package path still being typed (`a/b/`),
 * which names no test.
 */
function getSuggestibleTestName(testName: string | undefined): string | null {
	const trimmed = testName?.trim() ?? '';

	if (!trimmed || trimmed.endsWith('/')) return null;

	return trimmed;
}

interface FieldSuggestions {
	suggestions: readonly string[];
	isLoading: boolean;
	/** Starts the fetch: called when one of the fields gets focus. */
	request: () => void;
}

/**
 * Every `name=value` the test named in the form has run with, in the current
 * project. Nothing is offered without a test name, and the list is fetched
 * only once the parameter field has had focus and the name has stopped
 * changing, so typing a test path does not fire a request per keystroke.
 */
function useParameterSuggestions(
	testName: string | undefined
): FieldSuggestions {
	const { projectIds } = useProjectSearch();
	const [isRequested, setIsRequested] = useState(false);
	const currentTestName = getSuggestibleTestName(testName);
	const settledTestName = useDebounce(currentTestName, TEST_NAME_DEBOUNCE_MS);
	// While the name is still changing, the previous test's values are not
	// this test's: offer none until it settles.
	const queryTestName =
		currentTestName === settledTestName ? settledTestName : null;

	const { currentData, isFetching } = useGetParamsSearchOptionsQuery(
		isRequested && queryTestName
			? { testName: queryTestName, project: projectIds[0] }
			: skipToken
	);

	const request = useCallback(() => setIsRequested(true), []);

	return {
		suggestions: queryTestName ? currentData ?? NO_SUGGESTIONS : NO_SUGGESTIONS,
		isLoading: Boolean(isRequested && queryTestName && isFetching),
		request
	};
}

interface MetaSuggestions {
	tags: readonly string[];
	/** The project's important tags, coloured apart from the rest. */
	importantTags: ReadonlySet<string>;
	labels: readonly string[];
	branches: readonly string[];
	revisions: readonly string[];
	isLoading: boolean;
	/** Starts the fetch: called when one of the run fields gets focus. */
	request: () => void;
}

const NO_TAGS: ReadonlySet<string> = new Set();

/**
 * The tags, labels, branches and revisions of the current project's runs,
 * fetched once, when one of the run fields first gets focus, or straight away
 * when `eager`: the form already holds tags, and which of them are important
 * decides their colour. The endpoint cannot be narrowed by what is typed, so
 * the fields filter the lists.
 */
function useMetaSuggestions({ eager = false } = {}): MetaSuggestions {
	const { projectIds } = useProjectSearch();
	const [isRequested, setIsRequested] = useState(eager);

	const { currentData, isFetching } = useGetMetasSearchOptionsQuery(
		isRequested ? { project: projectIds[0] } : skipToken
	);

	const request = useCallback(() => setIsRequested(true), []);
	const important = currentData?.tags.important;
	const importantTags = useMemo(
		() => (important ? new Set(important) : NO_TAGS),
		[important]
	);

	return {
		tags: currentData?.tags.all ?? NO_SUGGESTIONS,
		importantTags,
		labels: currentData?.labels ?? NO_SUGGESTIONS,
		branches: currentData?.branches ?? NO_SUGGESTIONS,
		revisions: currentData?.revisions ?? NO_SUGGESTIONS,
		isLoading: isRequested && isFetching,
		request
	};
}

export {
	useParameterSuggestions,
	useMetaSuggestions,
	getSuggestibleTestName,
	TEST_NAME_DEBOUNCE_MS
};
export type { FieldSuggestions, MetaSuggestions };
