/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '@/router/testing';

import { TypedLinkWithProject } from './typed-link-with-project.component';

async function hover(name: string) {
	fireEvent.mouseEnter(screen.getByRole('link', { name }));
	// Past the preload delay (50 ms by default)
	await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
}

describe('TypedLinkWithProject preloads on intent unless it opens a new tab', () => {
	it.each([
		['in this tab', undefined, true],
		['in a new tab', '_blank', false]
	])('%s', async (_, target, preloads) => {
		const { router } = await renderWithRouter(
			<TypedLinkWithProject
				to="/runs/$runId"
				params={{ runId: 1 }}
				preload="intent"
				target={target}
			>
				Run
			</TypedLinkWithProject>,
			{ path: '/dashboard' }
		);
		const preload = vi.spyOn(router, 'preloadRoute');

		await hover('Run');

		expect(preload.mock.calls.length > 0).toBe(preloads);
	});
});
