/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, expect, test } from 'vitest';

import { TreeDataAPIResponse } from '@/shared/types';

import { getTreeOnlyWithErrors } from './utils';

describe('getTreeOnlyWithErrors', () => {
	test('keeps error nodes with their ancestors and prunes unrelated branches', () => {
		const data: TreeDataAPIResponse = {
			main_package: 'pkg',
			tree: {
				pkg: {
					id: 'pkg',
					name: 'pkg',
					entity: 'pkg',
					has_error: false,
					children: ['session-with-error', 'session-ok'],
					parentId: null
				},
				'session-with-error': {
					id: 'session-with-error',
					name: 'session-with-error',
					entity: 'session',
					has_error: false,
					children: ['error-test'],
					parentId: 'pkg'
				},
				'session-ok': {
					id: 'session-ok',
					name: 'session-ok',
					entity: 'session',
					has_error: false,
					children: ['ok-test'],
					parentId: 'pkg'
				},
				'error-test': {
					id: 'error-test',
					name: 'error-test',
					entity: 'test',
					has_error: true,
					children: [],
					parentId: 'session-with-error'
				},
				'ok-test': {
					id: 'ok-test',
					name: 'ok-test',
					entity: 'test',
					has_error: false,
					children: [],
					parentId: 'session-ok'
				}
			}
		};

		expect(getTreeOnlyWithErrors(data)).toEqual({
			pkg: {
				...data.tree['pkg'],
				children: ['session-with-error']
			},
			'session-with-error': {
				...data.tree['session-with-error'],
				children: ['error-test']
			},
			'error-test': {
				...data.tree['error-test'],
				children: []
			}
		});
	});

	test('returns null when tree has no error nodes', () => {
		const data: TreeDataAPIResponse = {
			main_package: 'pkg',
			tree: {
				pkg: {
					id: 'pkg',
					name: 'pkg',
					entity: 'pkg',
					has_error: false,
					children: [],
					parentId: null
				}
			}
		};

		expect(getTreeOnlyWithErrors(data)).toBeNull();
	});
});
