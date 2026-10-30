/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, it } from 'vitest';

import {
	getProjectInitial,
	getProjectTileStyle
} from './project-switcher.utils';

const PROJECTS = [
	{ id: 1, name: 'tsf/dpdk-ethdev' },
	{ id: 2, name: 'tsf/net-drv' },
	{ id: 3, name: 'arctic' },
	{ id: 4, name: 'bublik-e2e' }
];

describe('getProjectInitial', () => {
	it('reads the last path segment', () => {
		expect(getProjectInitial('tsf/dpdk-ethdev')).toBe('D');
		expect(getProjectInitial('tsf/net-drv')).toBe('N');
	});

	it('skips leading punctuation and trailing slashes', () => {
		expect(getProjectInitial('_arctic/')).toBe('A');
		expect(getProjectInitial('42-lab')).toBe('4');
	});

	it('falls back when the name has no letter or digit', () => {
		expect(getProjectInitial('---')).toBe('?');
	});
});

describe('getProjectTileStyle', () => {
	it("keeps a project's colour when it is renamed", () => {
		expect(getProjectTileStyle(PROJECTS[0]).className).toBe(
			getProjectTileStyle({ ...PROJECTS[0], name: 'renamed' }).className
		);
	});

	it('gives neighbouring projects different colours', () => {
		expect(getProjectTileStyle(PROJECTS[0]).className).not.toBe(
			getProjectTileStyle(PROJECTS[1]).className
		);
	});

	it('marks every project at once with a neutral tile', () => {
		expect(getProjectTileStyle()).toEqual({
			initial: '∗',
			className: 'bg-badge-0 text-text-menu'
		});
	});
});
