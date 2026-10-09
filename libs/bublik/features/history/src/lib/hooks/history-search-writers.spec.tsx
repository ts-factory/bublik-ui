/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { renderWithRouter, type TestRouter } from '@/router/testing';

import {
	DEFAULT_SEARCH_FORM_STATE,
	HISTORY_SLICE_NAME,
	historySliceReducer,
	useHistoryFormSearchState
} from '../slice';
import {
	defaultValues,
	type HistoryGlobalSearchFormValues
} from '../history-global-search-form/global-search-form/global-search-form.types';
import { HistoryResetGlobalFilterContainer } from '../history-reset-global-filter';
import { useHistoryRefresh } from './use-history-refresh';

/**
 * The three writers of the whole history search: the search
 * form's submit, the refresh after a badge filter, and Reset Filter. Each
 * writes every key, the empty ones included, on `/history` (the v2 alias
 * collapses), replaces the entry, keeps `_s`, `hide-sidebar` and the selected
 * projects (re-added last), and drops `location.state` and the hash.
 */
const BASEPATH = '/v2';
const START = new Date(2026, 0, 1);
const FINISH = new Date(2026, 3, 1);

const CURRENT =
	'?testName=old&hash=h&mode=aggregation&page=3&pageSize=50' +
	'&project=3&project=4&_s=abc&hide-sidebar=1';

function createStore() {
	return configureStore({
		reducer: { [HISTORY_SLICE_NAME]: historySliceReducer },
		preloadedState: {
			[HISTORY_SLICE_NAME]: {
				isGlobalSearchFormOpen: false,
				globalFilter: {
					tags: [],
					parameters: [],
					verdicts: [],
					resultType: null,
					isNotExpected: null,
					substringFilter: ''
				},
				searchForm: {
					...DEFAULT_SEARCH_FORM_STATE,
					testName: 'suite/test',
					hash: 'h',
					parameters: ['a=1'],
					startDate: START,
					finishDate: FINISH
				}
			}
		},
		middleware: (getDefault) => getDefault({ serializableCheck: false })
	});
}

async function renderAt(path: string, ui: ReactNode) {
	const rendered = await renderWithRouter(
		<Provider store={createStore()}>{ui}</Provider>,
		{ path, search: CURRENT, hash: 'top', state: { fromRun: true } }
	);

	return rendered;
}

async function expectReplacedWith(
	router: TestRouter,
	length: number,
	search: string
) {
	await waitFor(() =>
		expect(router.history.location.href).toBe(
			`${BASEPATH}/history?${search}&_s=abc&hide-sidebar=1&project=3&project=4`
		)
	);
	expect(router.history.length).toBe(length);
	expect(router.history.location.state).not.toHaveProperty('fromRun');
}

const FORM_QUERY =
	'testName=suite%2Ftest&hash=&labels=&parameters=p%3D1%3Bq%3D2&revisions=&branches=' +
	'&runData=&tagExpr=&branchExpr=&labelExpr=&testArgExpr=&revisionExpr=&verdictExpr=' +
	'&startDate=2026-01-01&finishDate=2026-04-01&runIds=&resultProperties=expected%3Bunexpected' +
	'&runProperties=notcompromised' +
	'&results=PASSED%3BFAILED%3BKILLED%3BCORED%3BSKIPPED%3BFAKED%3BINCOMPLETE%3BEMPTY%3BUNSPEC' +
	'&verdictLookup=string&verdict=&categories=&untriaged=&explained=&issue=';

describe('the history search writers', () => {
	it.each(['/history', '/history/v2'])(
		'%s: submitting the form writes every key on /history, page 1, mode and page size kept',
		async (path) => {
			let submit: (form: HistoryGlobalSearchFormValues) => void = () => {
				throw new Error('not rendered');
			};
			function Probe() {
				submit = useHistoryFormSearchState().handleGlobalSearchSubmit;
				return null;
			}

			const { router } = await renderAt(path, <Probe />);
			const length = router.history.length;

			act(() =>
				submit({
					...defaultValues,
					testName: 'suite/test',
					parameters: [
						{ id: 'p=1', value: 'p=1' },
						{ id: 'q=2', value: 'q=2' }
					],
					dates: { startDate: START, endDate: FINISH }
				})
			);

			await expectReplacedWith(
				router,
				length,
				`${FORM_QUERY}&mode=aggregation&page=1&pageSize=50`
			);
		}
	);

	it('the refresh after a badge filter writes every key on /history, page 1', async () => {
		let refresh: ReturnType<typeof useHistoryRefresh> = () => {
			throw new Error('not rendered');
		};
		function Probe() {
			refresh = useHistoryRefresh();
			return null;
		}

		const { router } = await renderAt('/history/v2', <Probe />);
		const length = router.history.length;

		act(() =>
			refresh({
				tags: ['t=1'],
				parameters: [],
				verdicts: ['v'],
				resultType: null,
				isNotExpected: null,
				substringFilter: ''
			})
		);

		await expectReplacedWith(
			router,
			length,
			'testName=suite%2Ftest&hash=h&labels=&parameters=a%3D1&revisions=&branches=' +
				'&runData=t%3D1&tagExpr=&branchExpr=&labelExpr=&testArgExpr=&revisionExpr=' +
				'&verdictExpr=&startDate=2026-01-01&finishDate=2026-04-01&runIds=' +
				'&resultProperties=expected%3Bunexpected&runProperties=notcompromised' +
				'&results=PASSED%3BFAILED%3BKILLED%3BCORED%3BSKIPPED%3BFAKED%3BINCOMPLETE%3BEMPTY%3BUNSPEC' +
				'&verdictLookup=string&verdict=v&categories=&untriaged=&explained=&issue=' +
				'&page=1&mode=aggregation&pageSize=50'
		);
	});

	it('Reset Filter keeps the test path, dates and mode and empties the rest', async () => {
		const { router } = await renderAt(
			'/history',
			<HistoryResetGlobalFilterContainer />
		);
		const length = router.history.length;

		fireEvent.click(screen.getByText('Reset Filter'));

		await expectReplacedWith(
			router,
			length,
			'testName=suite%2Ftest&hash=&labels=&parameters=&revisions=&branches=&runData=' +
				'&tagExpr=&branchExpr=&labelExpr=&testArgExpr=&revisionExpr=&verdictExpr=' +
				'&startDate=2026-01-01&finishDate=2026-04-01&runIds=' +
				'&resultProperties=expected%3Bunexpected&runProperties=notcompromised' +
				'&results=PASSED%3BFAILED%3BKILLED%3BCORED%3BSKIPPED%3BFAKED%3BINCOMPLETE%3BEMPTY%3BUNSPEC' +
				'&verdictLookup=string&verdict=&categories=&untriaged=&explained=&issue=' +
				'&mode=aggregation'
		);
	});
});
