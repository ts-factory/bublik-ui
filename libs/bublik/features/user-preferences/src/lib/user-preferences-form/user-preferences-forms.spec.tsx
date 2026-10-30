/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	cleanup,
	render,
	screen,
	waitFor,
	within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HistoryPreferencesForm } from './history-preferences-form.component';
import { LogPreferencesForm } from './log-preferences-form.component';
import { RunsPreferencesForm } from './runs-preferences-form.component';

function storedPreferences(): Record<string, Record<string, unknown>> {
	return JSON.parse(window.localStorage.getItem('user-preferences') ?? '{}');
}

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe('LogPreferencesForm', () => {
	it('offers each log layout as a card, with the default one selected', () => {
		render(<LogPreferencesForm />);

		const group = screen.getByRole('radiogroup', {
			name: 'Default log layout'
		});
		const names = within(group)
			.getAllByRole('radio')
			.map((radio) => radio.getAttribute('aria-labelledby'))
			.map((id) => document.getElementById(id ?? '')?.textContent);

		expect(names).toEqual([
			'Tree + info + log',
			'Tree + log',
			'Info + log',
			'Log only'
		]);
		expect(
			within(group)
				.getByRole('radio', { name: 'Tree + info + log' })
				.getAttribute('aria-checked')
		).toBe('true');
	});

	it('stores the layout of the card I pick', async () => {
		render(<LogPreferencesForm />);

		await userEvent.click(screen.getByRole('radio', { name: 'Info + log' }));

		expect(storedPreferences().log.defaultMode).toBe('infoAndlog');
		expect(
			screen
				.getByRole('radio', { name: 'Info + log' })
				.getAttribute('aria-checked')
		).toBe('true');
	});

	it('moves the selection with the arrow keys', async () => {
		render(<LogPreferencesForm />);

		const next = screen.getByRole('radio', { name: 'Tree + log' });
		screen.getByRole('radio', { name: 'Tree + info + log' }).focus();
		// Radix moves the focus a tick after keydown and selects on that focus
		// only while the key is held, so release it once the focus has moved.
		await userEvent.keyboard('{ArrowDown>}');
		await waitFor(() => expect(document.activeElement).toBe(next));
		await userEvent.keyboard('{/ArrowDown}');

		expect(storedPreferences().log.defaultMode).toBe('treeAndlog');
		expect(next.getAttribute('aria-checked')).toBe('true');
	});

	it('turns the legacy log and the all-pages memory on and off with switches', async () => {
		render(<LogPreferencesForm />);

		const legacy = screen.getByRole('switch', { name: 'Legacy logs' });
		const allPages = screen.getByRole('switch', {
			name: 'Remember "All pages" for 24 hours'
		});

		expect(legacy.getAttribute('aria-checked')).toBe('false');
		expect(allPages.getAttribute('aria-checked')).toBe('true');

		await userEvent.click(legacy);
		await userEvent.click(allPages);

		expect(storedPreferences().log).toMatchObject({
			preferLegacyLog: true,
			rememberAllPages: false
		});
	});
});

describe('HistoryPreferencesForm', () => {
	it('stores the history mode of the card I pick', async () => {
		render(<HistoryPreferencesForm />);

		const group = screen.getByRole('radiogroup', {
			name: 'Default history mode'
		});
		await userEvent.click(
			within(group).getByRole('radio', { name: 'Aggregation' })
		);

		expect(storedPreferences().history.defaultMode).toBe('aggregation');
	});
});

describe('RunsPreferencesForm', () => {
	it('turns immediate badge filters off with a switch', async () => {
		render(<RunsPreferencesForm />);

		const toggle = screen.getByRole('switch', {
			name: 'Apply badge filters immediately'
		});
		expect(toggle.getAttribute('aria-checked')).toBe('true');

		await userEvent.click(toggle);

		expect(storedPreferences().runs.autoApplyBadgeFilters).toBe(false);
	});
});
