/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { Project } from '@/services/bublik-api';

/* Washes that hold up against the white card and flip in dark mode; badge-7,
   badge-9 and badge-11 sit at 96-98% lightness and vanish next to it. */
const PROJECT_TILE_COLORS = [
	'bg-badge-1',
	'bg-badge-2',
	'bg-badge-3',
	'bg-badge-4',
	'bg-badge-6',
	'bg-badge-13',
	'bg-badge-17',
	'bg-badge-18'
] as const;

interface ProjectTileStyle {
	initial: string;
	className: string;
}

const ALL_PROJECTS_TILE: ProjectTileStyle = {
	initial: '∗',
	className: 'bg-badge-0 text-text-menu'
};

/** `tsf/net-drv` reads as N: the group prefix is shared by many projects. */
function getProjectInitial(name: string): string {
	const segment = name.split('/').filter(Boolean).at(-1) ?? name;
	const letter = segment.match(/[\p{L}\p{N}]/u)?.[0];

	return letter ? letter.toUpperCase() : '?';
}

function getProjectTileStyle(project?: Project): ProjectTileStyle {
	if (!project) return ALL_PROJECTS_TILE;

	const color =
		PROJECT_TILE_COLORS[Math.abs(project.id) % PROJECT_TILE_COLORS.length];

	return {
		initial: getProjectInitial(project.name),
		className: `${color} text-text-primary`
	};
}

export { getProjectInitial, getProjectTileStyle };
export type { ProjectTileStyle };
