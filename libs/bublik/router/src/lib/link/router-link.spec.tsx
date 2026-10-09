/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../testing/render-with-router';
import { RouterLink } from './router-link';

async function hover(name: string) {
	fireEvent.mouseEnter(screen.getByRole('link', { name }));
	// Past the preload delay (50 ms by default)
	await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
}

describe('RouterLink preloads on intent unless it opens a new tab', () => {
	it('preloads the target of a link in this tab', async () => {
		const { router } = await renderWithRouter(
			<RouterLink to="/runs/1" preload="intent">
				Run
			</RouterLink>,
			{ path: '/dashboard' }
		);
		const preload = vi.spyOn(router, 'preloadRoute');

		await hover('Run');

		expect(preload).toHaveBeenCalled();
	});

	it('never preloads a link that opens a new tab', async () => {
		const { router } = await renderWithRouter(
			<RouterLink to="/runs/1" preload="intent" target="_blank">
				Run
			</RouterLink>,
			{ path: '/dashboard' }
		);
		const preload = vi.spyOn(router, 'preloadRoute');

		await hover('Run');

		expect(preload).not.toHaveBeenCalled();
	});
});
