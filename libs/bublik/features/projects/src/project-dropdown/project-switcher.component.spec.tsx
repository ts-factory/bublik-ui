/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { TooltipProvider } from '@/shared/tailwind-ui';

import {
	ProjectSwitcher,
	type ProjectSwitcherProps
} from './project-switcher.component';

// The SVG icons do not load under vitest; a stub per name keeps `Icon`
// rendering. Hoisted above the imports by vitest.
vi.mock('@/icons', async (importOriginal) => {
	const Stub = (props: Record<string, unknown>) => <svg {...props} />;
	const icons = await importOriginal<Record<string, unknown>>();

	return Object.fromEntries(Object.keys(icons).map((name) => [name, Stub]));
});

// jsdom has no layout; cmdk scrolls the active row into view on open.
Element.prototype.scrollIntoView = vi.fn();
globalThis.ResizeObserver ??= class {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

const PROJECTS = [
	{ id: 1, name: 'tsf/dpdk-ethdev' },
	{ id: 2, name: 'tsf/net-drv' }
];

function renderSwitcher(props: Partial<ProjectSwitcherProps> = {}) {
	const onSelect = vi.fn();

	render(
		<MemoryRouter>
			<TooltipProvider>
				<ProjectSwitcher
					projects={PROJECTS}
					isOpen
					onOpenChange={vi.fn()}
					search=""
					onSearchChange={vi.fn()}
					onSelect={onSelect}
					isSidebarOpen
					renderMeta={() => null}
					{...props}
				/>
			</TooltipProvider>
		</MemoryRouter>
	);

	return { onSelect };
}

describe('ProjectSwitcher', () => {
	it('lists every project after the all-projects option', () => {
		renderSwitcher();

		expect(
			screen
				.getAllByTestId('project-picker-option')
				.map((option) => option.dataset['projectId'])
		).toEqual(['all', '1', '2']);
	});

	it('marks the current project and names it on the trigger', () => {
		renderSwitcher({ currentProject: PROJECTS[1] });

		expect(screen.getByTestId('project-picker-trigger').textContent).toContain(
			'tsf/net-drv'
		);
		expect(
			screen
				.getAllByTestId('project-picker-option')
				.find((option) => option.dataset['current'] === 'true')?.dataset[
				'projectId'
			]
		).toBe('2');
	});

	it('picks a project by its row', async () => {
		const { onSelect } = renderSwitcher();

		await userEvent.click(screen.getByText('tsf/dpdk-ethdev'));

		expect(onSelect).toHaveBeenCalledWith(1);
	});

	it('titles the list Results during a search', () => {
		renderSwitcher({ search: 'net' });
		expect(screen.getByText('Results')).toBeTruthy();
	});

	it('leaves the project actions out without permission', () => {
		renderSwitcher();
		expect(screen.queryByTestId('project-picker-actions')).toBeNull();
	});

	it('offers New Project and Manage to admins', async () => {
		const onCreateProject = vi.fn();
		renderSwitcher({ actions: { onCreateProject, onManage: vi.fn() } });

		await userEvent.click(screen.getByRole('button', { name: 'New Project' }));

		expect(onCreateProject).toHaveBeenCalled();
		expect(
			screen.getByRole('link', { name: 'Manage' }).getAttribute('href')
		).toBe('/admin/config');
	});
});
