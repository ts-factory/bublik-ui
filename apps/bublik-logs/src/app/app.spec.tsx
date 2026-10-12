/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { ReactNode } from 'react';
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor
} from '@testing-library/react';
import { createMemoryHistory } from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TreeDataAPIResponse } from '@/shared/types';

import { App } from './app';
import { createLogViewerRouter } from './router';
import { jsonAPI, store } from './store';

// The tree is virtualized and measures its parent, which has no layout in
// jsdom: give it a fixed size so its rows render.
vi.mock('react-virtualized-auto-sizer', () => ({
	default: ({
		children
	}: {
		children: (size: { height: number; width: number }) => ReactNode;
	}) => children({ height: 800, width: 400 })
}));

// One package with a failing test: the tree only renders when it has errors.
const TREE: TreeDataAPIResponse = {
	main_package: 'pkg',
	tree: {
		pkg: {
			id: 'pkg',
			name: 'pkg',
			entity: 'pkg',
			has_error: false,
			children: ['test'],
			parentId: null
		},
		test: {
			id: 'test',
			name: 'test',
			entity: 'test',
			has_error: true,
			children: [],
			parentId: 'pkg'
		}
	}
};

const fetched: string[] = [];

beforeEach(() => {
	fetched.length = 0;

	// The router scrolls the window on load and the tree scrolls its list to
	// the focused node; jsdom implements neither.
	vi.stubGlobal('scrollTo', vi.fn());
	Element.prototype.scrollTo = () => undefined;

	// `fetchBaseQuery` builds a `Request` from the bundle-relative path, which
	// Node only accepts as an absolute URL, and with jsdom's `AbortSignal`,
	// which Node's `Request` rejects.
	const NodeRequest = globalThis.Request;
	vi.stubGlobal(
		'Request',
		class extends NodeRequest {
			constructor(input: RequestInfo | URL, init?: RequestInit) {
				const { signal: _signal, ...rest } = init ?? {};

				super(
					typeof input === 'string'
						? new URL(input, 'http://localhost')
						: input,
					rest
				);
			}
		}
	);
	vi.stubGlobal(
		'fetch',
		vi.fn(async (request: Request) => {
			const { pathname } = new URL(request.url);
			fetched.push(pathname);

			const body =
				pathname === '/json/tree.json' ? TREE : { version: 'v1', root: [] };

			return new Response(JSON.stringify(body), {
				headers: { 'Content-Type': 'application/json' }
			});
		})
	);
});

afterEach(() => {
	cleanup();
	store.dispatch(jsonAPI.util.resetApiState());
	vi.unstubAllGlobals();
});

async function renderAt(url: string) {
	const router = createLogViewerRouter(
		createMemoryHistory({ initialEntries: [url] })
	);

	await act(async () => {
		await router.load();
	});
	render(<App router={router} />);

	return { router };
}

describe('standalone log viewer', () => {
	it('opens the log of the focused node and the whole tree', async () => {
		await renderAt('/?focusId=7&page=2');

		await waitFor(() => expect(fetched).toContain('/json/7'));
		expect(fetched).toContain('/json/tree.json');
		expect(await screen.findByTestId('log-tree-run-log')).toBeTruthy();
	});

	it('opens the main package log without a focusId', async () => {
		await renderAt('/');

		await waitFor(() => expect(fetched).toContain('/json/node_1_0.json'));
	});

	it('"Run log" drops only focusId, with a push', async () => {
		const { router } = await renderAt(
			'/?mode=treeAndlog&focusId=7&page=2&lineNumber=3_14'
		);

		fireEvent.click(await screen.findByTestId('log-tree-run-log'));

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				'/?mode=treeAndlog&page=2&lineNumber=3_14'
			)
		);
		await waitFor(() => expect(fetched).toContain('/json/node_1_0.json'));

		act(() => router.history.back());

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				'/?mode=treeAndlog&focusId=7&page=2&lineNumber=3_14'
			)
		);
	});

	it('a tree node focuses through the shared log hooks, with a push', async () => {
		const { router } = await renderAt(
			'/?mode=treeAndlog&page=2&lineNumber=3_14'
		);

		fireEvent.click(await screen.findByText('test'));

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				'/?mode=treeAndlog&focusId=test'
			)
		);
		await waitFor(() => expect(fetched).toContain('/json/test'));

		act(() => router.history.back());

		await waitFor(() =>
			expect(router.history.location.href).toBe(
				'/?mode=treeAndlog&page=2&lineNumber=3_14'
			)
		);
	});
});
