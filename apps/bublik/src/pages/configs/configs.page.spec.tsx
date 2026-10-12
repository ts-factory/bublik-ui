/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { writeSearch } from '@/router';
import { renderWithRouter } from '@/router/testing';

import { configSearch } from '../../routes/-search/config.search';
import { ConfigsPage } from './configs.page';

/** Every mount of a pane gets the next number, so a remount shows a new one. */
const mounts = vi.hoisted(() => ({ next: 0 }));

function useMountNumber() {
	const [mount] = useState(() => {
		mounts.next += 1;

		return mounts.next;
	});

	return mount;
}

vi.mock('./update-config-form/update-config-form.container', () => ({
	ConfigsEditorContainer: ({ configId }: { configId: number }) => (
		<output aria-label="pane">{`editor ${configId} #${useMountNumber()}`}</output>
	)
}));

vi.mock('./create-config-form/create-new-config.container', () => ({
	CreateNewConfigScreen: () => (
		<output aria-label="pane">{`create #${useMountNumber()}`}</output>
	)
}));

vi.mock('./sidebar/config-sidebar.container', () => ({
	ConfigsSidebarContainer: () => null
}));

vi.mock('@/bublik/features/auth', () => ({
	useAuth: () => ({ isAdmin: true })
}));

vi.mock('@/bublik/features/projects', () => ({
	CreateProjectButton: () => null
}));

const json = (value: unknown) => encodeURIComponent(JSON.stringify(value));

async function renderPageAt(search: string) {
	return renderWithRouter(<ConfigsPage />, {
		path: '/admin/config',
		search,
		route: { id: '/_app/admin/config', search: configSearch }
	});
}

function pane(): string {
	return screen.getByRole('status', { name: 'pane' }).textContent ?? '';
}

/** The pane's text without its mount number, and the number. */
function paneParts(): [string, number] {
	const [, label, mount] = /^(.*) #(\d+)$/.exec(pane()) ?? [];

	return [label, Number(mount)];
}

describe('ConfigsPage remounts (keys configId and JSON of the parsed new_config)', () => {
	it('remounts the editor when configId changes, and only then', async () => {
		const { router } = await renderPageAt('?configId=1');
		const [label, first] = paneParts();
		expect(label).toBe('editor 1');

		await act(async () => writeSearch(router, { _s: 'abc', project: [2] }));
		expect(paneParts()).toEqual(['editor 1', first]);

		await act(async () => writeSearch(router, { configId: '2' }));
		const [nextLabel, second] = paneParts();
		expect(nextLabel).toBe('editor 2');
		expect(second).not.toBe(first);
	});

	it('shows the create screen for no configId, and a configId the codec rejects', async () => {
		await renderPageAt('?configId=abc');

		expect(paneParts()[0]).toBe('create');
	});

	it('remounts the create screen when the parsed new_config changes, and only then', async () => {
		const { router } = await renderPageAt(
			`?new_config=${json({ type: 'report', name: 'a' })}`
		);
		const [, first] = paneParts();

		// Unknown keys are stripped by the schema: the same parsed config.
		await act(async () =>
			writeSearch(router, {
				new_config: JSON.stringify({ type: 'report', name: 'a', extra: 1 })
			})
		);
		expect(paneParts()).toEqual(['create', first]);

		await act(async () =>
			writeSearch(router, {
				new_config: JSON.stringify({ type: 'report', name: 'b' })
			})
		);
		const [, second] = paneParts();
		expect(second).not.toBe(first);
	});

	it('keeps the create screen mounted across values that all fall back to the default', async () => {
		const { router } = await renderPageAt('?new_config=%7Bnot-json');
		const [, first] = paneParts();

		await act(async () => writeSearch(router, { new_config: '{"type":5}' }));
		expect(paneParts()).toEqual(['create', first]);

		await act(async () => writeSearch(router, { new_config: undefined }));
		expect(paneParts()).toEqual(['create', first]);

		await act(async () =>
			writeSearch(router, {
				new_config: JSON.stringify({ type: 'global', name: 'per_conf' })
			})
		);
		expect(paneParts()).toEqual(['create', first]);
	});

	it('switches between the editor and the create screen on configId', async () => {
		const { router } = await renderPageAt('');
		const [, created] = paneParts();

		await act(async () => writeSearch(router, { configId: '7' }));
		expect(paneParts()[0]).toBe('editor 7');

		await act(async () => writeSearch(router, { configId: undefined }));
		const [label, recreated] = paneParts();
		expect(label).toBe('create');
		expect(recreated).not.toBe(created);
	});
});
