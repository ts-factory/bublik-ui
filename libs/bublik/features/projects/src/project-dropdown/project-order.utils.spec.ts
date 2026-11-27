/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	DEFAULT_PROJECT_ORDER_PREFERENCE,
	matchesProjectSearch,
	moveProjectBy,
	moveProjectTo,
	parseProjectOrderPreference,
	sortProjects
} from './project-order.utils';

const PROJECTS = [
	{ id: 1, name: 'tsf/net-drv' },
	{ id: 2, name: 'arctic' },
	{ id: 3, name: 'Bublik-e2e' },
	{ id: 4, name: 'run-10' },
	{ id: 5, name: 'run-9' }
];

const NO_RUNS = new Map<number, number>();

const ids = (projects: readonly { id: number }[]) =>
	projects.map((project) => project.id);

describe('parseProjectOrderPreference', () => {
	it('reads a stored preference back', () => {
		expect(
			parseProjectOrderPreference({ sort: 'name', order: [3, 1] })
		).toEqual({ sort: 'name', order: [3, 1] });
	});

	it('keeps the dragged order when the sort is one it does not know', () => {
		expect(
			parseProjectOrderPreference({ sort: 'most-runs', order: [3, 1] })
		).toEqual({ sort: 'custom', order: [3, 1] });
	});

	it('keeps the sort when the order is not a list of ids', () => {
		expect(
			parseProjectOrderPreference({ sort: 'newest', order: ['3', null] })
		).toEqual({ sort: 'newest', order: [] });
	});

	it('falls back to the default for anything that is not a preference', () => {
		expect(parseProjectOrderPreference(null)).toBe(
			DEFAULT_PROJECT_ORDER_PREFERENCE
		);
		expect(parseProjectOrderPreference('name')).toBe(
			DEFAULT_PROJECT_ORDER_PREFERENCE
		);
	});
});

describe('sortProjects', () => {
	it('leaves the server order alone until a project is dragged', () => {
		expect(
			ids(
				sortProjects(PROJECTS, {
					sort: 'custom',
					order: [],
					lastRunTimes: NO_RUNS
				})
			)
		).toEqual([1, 2, 3, 4, 5]);
	});

	it('follows the custom order, new projects last and deleted ones ignored', () => {
		expect(
			ids(
				sortProjects(PROJECTS, {
					sort: 'custom',
					order: [4, 99, 2, 1],
					lastRunTimes: NO_RUNS
				})
			)
		).toEqual([4, 2, 1, 3, 5]);
	});

	it('sorts names without regard to case, numbers by value', () => {
		expect(
			ids(
				sortProjects(PROJECTS, {
					sort: 'name',
					order: [],
					lastRunTimes: NO_RUNS
				})
			)
		).toEqual([2, 3, 5, 4, 1]);
	});

	it('puts the project that ran most recently first, those without a run last', () => {
		expect(
			ids(
				sortProjects(PROJECTS, {
					sort: 'last-run',
					order: [],
					lastRunTimes: new Map([
						[2, 100],
						[4, 300],
						[5, 200]
					])
				})
			)
		).toEqual([4, 5, 2, 1, 3]);
	});

	it('puts the project created last first', () => {
		expect(
			ids(
				sortProjects(PROJECTS, {
					sort: 'newest',
					order: [1, 2],
					lastRunTimes: NO_RUNS
				})
			)
		).toEqual([5, 4, 3, 2, 1]);
	});

	it('does not reorder the list it is given', () => {
		const projects = [...PROJECTS];

		sortProjects(projects, {
			sort: 'newest',
			order: [],
			lastRunTimes: NO_RUNS
		});

		expect(projects).toEqual(PROJECTS);
	});
});

describe('moveProjectTo', () => {
	it('drops a project onto a later one, behind it', () => {
		expect(moveProjectTo([1, 2, 3, 4], 1, 3)).toEqual([2, 3, 1, 4]);
	});

	it('drops a project onto an earlier one, before it', () => {
		expect(moveProjectTo([1, 2, 3, 4], 4, 2)).toEqual([1, 4, 2, 3]);
	});

	it('changes nothing for an id that is not listed', () => {
		expect(moveProjectTo([1, 2, 3], 9, 1)).toEqual([1, 2, 3]);
		expect(moveProjectTo([1, 2, 3], 1, 9)).toEqual([1, 2, 3]);
	});
});

describe('moveProjectBy', () => {
	it('moves a project one place up or down', () => {
		expect(moveProjectBy([1, 2, 3], 2, -1)).toEqual([2, 1, 3]);
		expect(moveProjectBy([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
	});

	it('stops at both ends', () => {
		expect(moveProjectBy([1, 2, 3], 1, -1)).toEqual([1, 2, 3]);
		expect(moveProjectBy([1, 2, 3], 3, 1)).toEqual([1, 2, 3]);
	});
});

describe('matchesProjectSearch', () => {
	it('finds the search anywhere in the name, whatever its case', () => {
		expect(matchesProjectSearch('tsf/net-drv', 'NET')).toBe(true);
		expect(matchesProjectSearch('tsf/net-drv', ' drv ')).toBe(true);
	});

	it('does not match letters that are merely in order', () => {
		expect(matchesProjectSearch('tsf/net-drv', 'tnd')).toBe(false);
	});
});
