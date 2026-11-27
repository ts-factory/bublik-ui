/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
	{ id: 2, name: 'tsf/net-drv' },
	{ id: 3, name: 'arctic' }
];

const listedIds = () =>
	screen
		.getAllByTestId('project-picker-option')
		.map((option) => option.dataset['projectId']);

function renderSwitcher(props: Partial<ProjectSwitcherProps> = {}) {
	const onSelect = vi.fn();
	const onSortChange = vi.fn();
	const onReorder = vi.fn();

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
					sort="custom"
					onSortChange={onSortChange}
					onReorder={onReorder}
					isSidebarOpen
					renderMeta={() => null}
					{...props}
				/>
			</TooltipProvider>
		</MemoryRouter>
	);

	return { onSelect, onSortChange, onReorder };
}

describe('ProjectSwitcher', () => {
	it('lists every project after the all-projects option', () => {
		renderSwitcher();

		expect(listedIds()).toEqual(['all', '1', '2', '3']);
	});

	it('lists the projects in the order it is given', () => {
		renderSwitcher({ projects: [PROJECTS[2], PROJECTS[0], PROJECTS[1]] });

		expect(listedIds()).toEqual(['all', '3', '1', '2']);
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

	it('narrows the list to the names a search is part of', () => {
		renderSwitcher({ search: 'TSF' });

		expect(listedIds()).toEqual(['1', '2']);
	});

	it('says so when a search matches no project', () => {
		renderSwitcher({ search: 'nope' });

		expect(screen.queryAllByTestId('project-picker-option')).toEqual([]);
		expect(screen.getByText('No project matches “nope”')).toBeTruthy();
	});

	it('names the order on its button and offers the others', async () => {
		const { onSortChange } = renderSwitcher({ sort: 'last-run' });
		const order = screen.getByTestId('project-picker-order');

		expect(order.textContent).toBe('Last Run');

		await userEvent.click(order);

		const menu = within(screen.getByTestId('project-picker-order-menu'));

		expect(
			menu.getAllByRole('menuitemradio').map((item) => item.textContent)
		).toEqual(['Custom Order', 'Name', 'Last Run', 'Newest First']);
		expect(
			menu
				.getByRole('menuitemradio', { name: 'Last Run' })
				.getAttribute('aria-checked')
		).toBe('true');

		await userEvent.click(menu.getByRole('menuitemradio', { name: 'Name' }));

		expect(onSortChange).toHaveBeenCalledWith('name');
	});

	it('gives every project a drag handle, whatever the order', () => {
		renderSwitcher({ sort: 'name' });

		expect(screen.getAllByTestId('project-picker-drag-handle')).toHaveLength(
			PROJECTS.length
		);
	});

	it('has no drag handles during a search', () => {
		renderSwitcher({ search: 'tsf' });
		expect(screen.queryByTestId('project-picker-drag-handle')).toBeNull();
	});

	it('moves the highlighted project with Alt and an arrow', async () => {
		const { onReorder } = renderSwitcher();
		const search = screen.getByPlaceholderText('Find project…');

		// From the all-projects row, which is highlighted first, to project 1
		await userEvent.type(search, '{ArrowDown}');
		await userEvent.type(search, '{Alt>}{ArrowDown}{/Alt}');

		expect(onReorder).toHaveBeenLastCalledWith([2, 1, 3]);

		await userEvent.type(search, '{Alt>}{ArrowUp}{/Alt}');

		// Already first: the order it reports is the one it has
		expect(onReorder).toHaveBeenLastCalledWith([1, 2, 3]);
	});

	it('leaves the all-projects row where it is', async () => {
		const { onReorder } = renderSwitcher();

		await userEvent.type(
			screen.getByPlaceholderText('Find project…'),
			'{Alt>}{ArrowDown}{/Alt}'
		);

		expect(onReorder).not.toHaveBeenCalled();
	});

	it('does not move a project during a search', async () => {
		const { onReorder } = renderSwitcher({ search: 'tsf' });
		const search = screen.getByPlaceholderText('Find project…');

		await userEvent.type(search, '{Alt>}{ArrowDown}{/Alt}');

		expect(onReorder).not.toHaveBeenCalled();
	});

	it('does not move a project from the order button or its menu', async () => {
		const { onReorder } = renderSwitcher();

		// Project 1 is highlighted, so there is a row the keys could move
		await userEvent.type(
			screen.getByPlaceholderText('Find project…'),
			'{ArrowDown}'
		);
		screen.getByTestId('project-picker-order').focus();
		// Opens the menu, as the arrow alone does on its button
		await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');

		expect(screen.getByTestId('project-picker-order-menu')).toBeTruthy();
		expect(onReorder).not.toHaveBeenCalled();

		await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');

		expect(onReorder).not.toHaveBeenCalled();
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
