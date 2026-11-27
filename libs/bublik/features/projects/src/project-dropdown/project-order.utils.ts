/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { z } from 'zod';

import type { Project } from '@/services/bublik-api';

const PROJECT_ORDER_STORAGE_KEY = 'project-switcher-order';

const PROJECT_SORTS = ['custom', 'name', 'last-run', 'newest'] as const;

type ProjectSort = (typeof PROJECT_SORTS)[number];

const PROJECT_SORT_LABELS: Record<ProjectSort, string> = {
	custom: 'Custom Order',
	name: 'Name',
	'last-run': 'Last Run',
	newest: 'Newest First'
};

/* Each half falls back on its own: a sort this build no longer knows must
   not throw away the order the user dragged together. */
const ProjectOrderPreferenceSchema = z.object({
	sort: z.enum(PROJECT_SORTS).catch('custom'),
	order: z.array(z.number().int()).catch([])
});

type ProjectOrderPreference = z.infer<typeof ProjectOrderPreferenceSchema>;

/** Until a project is dragged, Custom Order is the order the server lists. */
const DEFAULT_PROJECT_ORDER_PREFERENCE: ProjectOrderPreference = {
	sort: 'custom',
	order: []
};

function parseProjectOrderPreference(value: unknown): ProjectOrderPreference {
	const parsed = ProjectOrderPreferenceSchema.safeParse(value);

	return parsed.success ? parsed.data : DEFAULT_PROJECT_ORDER_PREFERENCE;
}

interface SortProjectsOptions {
	sort: ProjectSort;
	/** Project ids as the user arranged them; read by `custom` only. */
	order: readonly number[];
	/** Start of each project's newest run in ms; read by `last-run` only. */
	lastRunTimes: ReadonlyMap<number, number>;
}

const nameCollator = new Intl.Collator('en', {
	numeric: true,
	sensitivity: 'base'
});

/**
 * Every sort is stable against the server's order, which is what the projects
 * a sort has nothing to say about keep: one created after the custom order
 * was saved, or one that has no run yet. Those go last.
 */
function sortProjects(
	projects: readonly Project[],
	options: SortProjectsOptions
): Project[] {
	const { sort, order, lastRunTimes } = options;
	const sorted = [...projects];

	switch (sort) {
		case 'custom': {
			const position = new Map(order.map((id, index) => [id, index]));
			const rank = (project: Project) =>
				position.get(project.id) ?? Number.POSITIVE_INFINITY;

			return sorted.sort((a, b) => compareNumbers(rank(a), rank(b)));
		}
		case 'name':
			return sorted.sort((a, b) => nameCollator.compare(a.name, b.name));
		case 'last-run': {
			const time = (project: Project) =>
				lastRunTimes.get(project.id) ?? Number.NEGATIVE_INFINITY;

			return sorted.sort((a, b) => compareNumbers(time(b), time(a)));
		}
		case 'newest':
			// Ids grow with every project created, and no date comes with them
			return sorted.sort((a, b) => b.id - a.id);
	}
}

/** Infinity - Infinity is NaN, which a sort comparator must not return. */
function compareNumbers(a: number, b: number): number {
	if (a === b) return 0;

	return a < b ? -1 : 1;
}

/** The ids with `id` moved to where `targetId` sits, as a drop does. */
function moveProjectTo(
	ids: readonly number[],
	id: number,
	targetId: number
): number[] {
	const from = ids.indexOf(id);
	const to = ids.indexOf(targetId);

	if (from === -1 || to === -1 || from === to) return [...ids];

	const moved = [...ids];
	moved.splice(to, 0, ...moved.splice(from, 1));

	return moved;
}

/** The ids with `id` one place up (-1) or down (1); the ends stop it. */
function moveProjectBy(
	ids: readonly number[],
	id: number,
	step: -1 | 1
): number[] {
	const targetId = ids[ids.indexOf(id) + step];

	return targetId === undefined ? [...ids] : moveProjectTo(ids, id, targetId);
}

function matchesProjectSearch(name: string, search: string): boolean {
	return name.toLowerCase().includes(search.trim().toLowerCase());
}

export {
	DEFAULT_PROJECT_ORDER_PREFERENCE,
	PROJECT_ORDER_STORAGE_KEY,
	PROJECT_SORTS,
	PROJECT_SORT_LABELS,
	matchesProjectSearch,
	moveProjectBy,
	moveProjectTo,
	parseProjectOrderPreference,
	sortProjects
};
export type { ProjectOrderPreference, ProjectSort };
