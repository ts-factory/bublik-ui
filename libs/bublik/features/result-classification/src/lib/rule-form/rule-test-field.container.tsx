/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo, useState, type RefObject } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetTestPickerQuery } from '@/services/bublik-api';

import {
	PICKER_SEARCH_DEBOUNCE_MS,
	useDebouncedValue
} from '../pickers/pickers.hooks';
import { TestPathCombobox } from '../pickers/test-path-combobox';

export interface RuleTestFieldProps {
	projectId?: number;
	/** The test id the rule targets; `0` while no path resolves to one. */
	value: number;
	onChange: (id: number) => void;
	/** The seeded test's path, when editing or duplicating a rule. */
	initialPath?: string | null;
	disabled?: boolean;
	error?: string;
	container?: RefObject<HTMLElement>;
}

function isTestPath(path: string): boolean {
	return path.length > 0 && !path.endsWith('/');
}

/**
 * The history search's Test Path input, fed by `/tests/picker/`: only tests
 * with results in the project, the only ones a rule may target, listed by
 * name. The typed text is the search; picking a test puts its path in the
 * input, and the option whose path equals it gives the rule its id.
 */
export function RuleTestField({
	projectId,
	value,
	onChange,
	initialPath,
	disabled = false,
	error,
	container
}: RuleTestFieldProps) {
	const [path, setPath] = useState(initialPath ?? '');
	const search = useDebouncedValue(path, PICKER_SEARCH_DEBOUNCE_MS);
	const settled = search === path;

	const { data, isFetching } = useGetTestPickerQuery(
		disabled ? skipToken : { projectId, search: search.trim() || undefined }
	);

	const options = useMemo(() => (data ?? []).map((test) => test.path), [data]);
	const ready = settled && !isFetching && data !== undefined;
	const match = ready ? data.find((test) => test.path === search) : undefined;
	const unresolved = ready && isTestPath(path) && !match;

	useEffect(() => {
		if (disabled || !ready) return;

		const next = match?.id ?? 0;

		if (next !== value) onChange(next);
	}, [disabled, ready, match, value, onChange]);

	function handlePathChange(next: string) {
		setPath(next);
		// The old id must not outlive the path it came from: a submit before
		// the new path resolves would otherwise target the previous test.
		if (value !== 0) onChange(0);
	}

	return (
		<TestPathCombobox
			label="Test"
			placeholder="Search test by name or path…"
			value={path}
			onChange={handlePathChange}
			options={options}
			disabled={disabled}
			error={
				unresolved ? 'No test with results in this project at this path' : error
			}
			container={container}
			testsOnly
		/>
	);
}
