/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderHookWithRouter, renderWithRouter } from '@/router/testing';

import { useNavigateWithProject } from '../hooks';
import { LinkWithProject } from './link-with-project.component';

async function hover(name: string) {
	fireEvent.mouseEnter(screen.getByRole('link', { name }));
	// Past the preload delay (50 ms by default)
	await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
}

const hrefOf = (name: string) =>
	screen.getByRole('link', { name }).getAttribute('href');

describe('LinkWithProject', () => {
	it('interpolates the typed target and carries _s, hide-sidebar and the projects after its keys', async () => {
		await renderWithRouter(
			<LinkWithProject
				to="/log/$runId"
				params={{ runId: 1 }}
				search={{ focusId: 7, mode: 'treeAndinfoAndlog' }}
			>
				Log
			</LinkWithProject>,
			{
				path: '/runs',
				search: '?project=2&page=3&_s=abc&hide-sidebar=true&project=5'
			}
		);

		expect(hrefOf('Log')).toBe(
			'/v2/log/1?focusId=7&mode=treeAndinfoAndlog&_s=abc&hide-sidebar=true&project=2&project=5'
		);
	});

	it('keeps a sidebar key the target sets and replaces the projects it sets', async () => {
		await renderWithRouter(
			<LinkWithProject to="/runs" search={{ _s: 'mine', project: [9] }}>
				Runs
			</LinkWithProject>,
			{ path: '/dashboard', search: '?_s=abc&project=2' }
		);

		expect(hrefOf('Runs')).toBe('/v2/runs?_s=mine&project=2');
	});

	it('writes no query string for a target without keys on a page without any', async () => {
		await renderWithRouter(
			<LinkWithProject to="/issues/$issueId" params={{ issueId: 4 }}>
				Issue
			</LinkWithProject>,
			{ path: '/runs' }
		);

		expect(hrefOf('Issue')).toBe('/v2/issues/4');
	});

	it.each([
		['in this tab', undefined, true],
		['in a new tab', '_blank', false]
	])('preloads on intent %s', async (_, target, preloads) => {
		const { router } = await renderWithRouter(
			<LinkWithProject
				to="/runs/$runId"
				params={{ runId: 1 }}
				preload="intent"
				target={target}
			>
				Run
			</LinkWithProject>,
			{ path: '/dashboard' }
		);
		const preload = vi.spyOn(router, 'preloadRoute');

		await hover('Run');

		expect(preload.mock.calls.length > 0).toBe(preloads);
	});
});

describe('useNavigateWithProject', () => {
	it('navigates to the typed target with the sidebar state and the projects, honouring replace and state', async () => {
		const { result, router } = await renderHookWithRouter(
			useNavigateWithProject,
			{ path: '/runs', search: '?_s=abc&project=2' }
		);

		await act(async () => {
			result.current({
				to: '/compare',
				search: { left: '1', right: '2' },
				replace: true,
				state: { fromRun: true }
			});
		});

		expect(router.history.location.href).toBe(
			'/v2/compare?left=1&right=2&_s=abc&project=2'
		);
		expect(router.history.length).toBe(1);
		expect(router.history.location.state).toMatchObject({ fromRun: true });
	});
});
