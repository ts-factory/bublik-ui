/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { RedirectToLogPage, getLegacyLogRedirectSearch } from './redirects';

describe('getLegacyLogRedirectSearch', () => {
	it('keeps the layout named by the old path segment', () => {
		expect(getLegacyLogRedirectSearch('infoAndlog', '?focusId=7')).toBe(
			'focusId=7&mode=infoAndlog'
		);
	});

	it('replaces a mode already in the search instead of adding a second one', () => {
		expect(
			getLegacyLogRedirectSearch('treeAndlog', '?mode=log&focusId=7')
		).toBe('mode=treeAndlog&focusId=7');
	});

	it('opens the tree, info and log when the old segment is not a layout', () => {
		expect(getLegacyLogRedirectSearch('whatever', '')).toBe(
			'mode=treeAndinfoAndlog'
		);
	});

	it('keeps a mode from the search when the old segment is not a layout', () => {
		expect(getLegacyLogRedirectSearch('whatever', '?mode=infoAndlog')).toBe(
			'mode=infoAndlog'
		);
	});
});

function CurrentLocation() {
	const location = useLocation();

	return <output>{`${location.pathname}${location.search}`}</output>;
}

describe('RedirectToLogPage', () => {
	afterEach(cleanup);

	it('lands on the log page with one mode taken from the old path', () => {
		render(
			<MemoryRouter initialEntries={['/log/42/infoAndlog?mode=log']}>
				<Routes>
					<Route path="/log/:runId/:old" element={<RedirectToLogPage />} />
					<Route path="/log/:runId" element={<CurrentLocation />} />
				</Routes>
			</MemoryRouter>
		);

		expect(screen.getByRole('status').textContent).toBe(
			'/log/42?mode=infoAndlog'
		);
	});
});
