/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, renderHook } from '@testing-library/react';
import { skipToken } from '@reduxjs/toolkit/query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	TEST_NAME_DEBOUNCE_MS,
	getSuggestibleTestName,
	useMetaSuggestions,
	useParameterSuggestions
} from './global-search-form.suggestions.hooks';

const PARAMETERS = ['time_limit=30', 'time_limit=60'];

const { paramsQuery, metasQuery } = vi.hoisted(() => ({
	paramsQuery: vi.fn(),
	metasQuery: vi.fn()
}));

vi.mock('@/services/bublik-api', () => ({
	useGetParamsSearchOptionsQuery: paramsQuery,
	useGetMetasSearchOptionsQuery: metasQuery
}));

vi.mock('@/bublik/features/projects', () => ({
	useProjectSearch: () => ({ projectIds: [7] })
}));

beforeEach(() => {
	vi.useFakeTimers();
	paramsQuery.mockReset();
	metasQuery.mockReset();
	paramsQuery.mockImplementation((arg) =>
		arg === skipToken
			? { currentData: undefined, isFetching: false }
			: { currentData: PARAMETERS, isFetching: false }
	);
	metasQuery.mockImplementation((arg) =>
		arg === skipToken
			? { currentData: undefined, isFetching: false }
			: {
					currentData: {
						tags: {
							important: ['linux'],
							relevant: ['cpu=x86'],
							all: ['linux', 'cpu=x86']
						},
						labels: ['nightly'],
						branches: ['branch=main'],
						revisions: ['rev=8af3831']
					},
					isFetching: false
			  }
	);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('getSuggestibleTestName', () => {
	it('names no test for an empty field or a package path', () => {
		expect(getSuggestibleTestName(undefined)).toBeNull();
		expect(getSuggestibleTestName('   ')).toBeNull();
		expect(getSuggestibleTestName('suite/pkg/')).toBeNull();
	});

	it('trims a test name or path', () => {
		expect(getSuggestibleTestName(' default_buff ')).toBe('default_buff');
		expect(getSuggestibleTestName('suite/pkg/test')).toBe('suite/pkg/test');
	});
});

describe('useParameterSuggestions', () => {
	it('offers nothing and fetches nothing without a test name', () => {
		const { result } = renderHook(() => useParameterSuggestions(''));

		act(() => result.current.request());
		act(() => vi.advanceTimersByTime(TEST_NAME_DEBOUNCE_MS));

		expect(result.current.suggestions).toEqual([]);
		expect(paramsQuery).not.toHaveBeenCalledWith(
			expect.objectContaining({ testName: expect.anything() })
		);
	});

	it('waits for the field to ask before fetching', () => {
		const { result } = renderHook(() =>
			useParameterSuggestions('default_buff')
		);

		act(() => vi.advanceTimersByTime(TEST_NAME_DEBOUNCE_MS));
		expect(paramsQuery).toHaveBeenLastCalledWith(skipToken);
		expect(result.current.suggestions).toEqual([]);

		act(() => result.current.request());
		expect(paramsQuery).toHaveBeenLastCalledWith({
			testName: 'default_buff',
			project: 7
		});
		expect(result.current.suggestions).toEqual(PARAMETERS);
	});

	it('offers nothing while the test name is still changing', () => {
		const { result, rerender } = renderHook(
			({ testName }) => useParameterSuggestions(testName),
			{ initialProps: { testName: 'default_buff' } }
		);

		act(() => result.current.request());
		act(() => vi.advanceTimersByTime(TEST_NAME_DEBOUNCE_MS));
		expect(result.current.suggestions).toEqual(PARAMETERS);

		rerender({ testName: 'other_test' });
		expect(result.current.suggestions).toEqual([]);
		expect(paramsQuery).toHaveBeenLastCalledWith(skipToken);

		act(() => vi.advanceTimersByTime(TEST_NAME_DEBOUNCE_MS));
		expect(paramsQuery).toHaveBeenLastCalledWith({
			testName: 'other_test',
			project: 7
		});
	});

	it('drops the suggestions as soon as the test name is cleared', () => {
		const { result, rerender } = renderHook(
			({ testName }) => useParameterSuggestions(testName),
			{ initialProps: { testName: 'default_buff' } }
		);

		act(() => result.current.request());
		act(() => vi.advanceTimersByTime(TEST_NAME_DEBOUNCE_MS));
		rerender({ testName: '' });

		expect(result.current.suggestions).toEqual([]);
	});
});

describe('useMetaSuggestions', () => {
	it('fetches the project metas once asked, and splits them by field', () => {
		const { result } = renderHook(() => useMetaSuggestions());

		expect(metasQuery).toHaveBeenLastCalledWith(skipToken);
		expect(result.current.tags).toEqual([]);

		act(() => result.current.request());

		expect(metasQuery).toHaveBeenLastCalledWith({ project: 7 });
		expect(result.current).toMatchObject({
			tags: ['linux', 'cpu=x86'],
			labels: ['nightly'],
			branches: ['branch=main'],
			revisions: ['rev=8af3831']
		});
		expect([...result.current.importantTags]).toEqual(['linux']);
	});

	it('fetches straight away when eager, to colour the tags already held', () => {
		renderHook(() => useMetaSuggestions({ eager: true }));

		expect(metasQuery).toHaveBeenLastCalledWith({ project: 7 });
		expect(metasQuery).not.toHaveBeenCalledWith(skipToken);
	});
});
