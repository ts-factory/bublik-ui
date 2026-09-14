/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { describe, it, expect } from 'vitest';

import { NodeEntity, RunData, RunStats } from '@/shared/types';

import { DiffType, MergedRunDataWithDiff } from './run-diff.types';
import { computeDiff, propagateDiffToParents } from './run-diff.utils';

const EMPTY_STATS: RunStats = {
	passed: 0,
	failed: 0,
	passed_unexpected: 0,
	failed_unexpected: 0,
	skipped: 0,
	skipped_unexpected: 0,
	abnormal: 0
};

interface NodeConfig {
	test_id: number;
	test_name: string;
	type?: NodeEntity;
	exec_seqno?: number;
	stats?: Partial<RunStats>;
	children?: RunData[];
}

const node = (config: NodeConfig): RunData => {
	const {
		test_id,
		test_name,
		type = NodeEntity.Package,
		exec_seqno = test_id,
		stats = {},
		children = []
	} = config;

	return {
		result_id: test_id,
		test_id,
		exec_seqno,
		parent_id: null,
		type,
		test_name,
		period: '',
		path: [test_name],
		stats: { ...EMPTY_STATS, ...stats },
		children
	};
};

const test = (config: NodeConfig): RunData =>
	node({ ...config, type: NodeEntity.Test });

const merged = (
	diffType: DiffType,
	children: MergedRunDataWithDiff[] = []
): MergedRunDataWithDiff =>
	({ left: null, right: null, diffType, children } as MergedRunDataWithDiff);

/** Find a node in the merged tree by the test name of whichever side exists. */
const findByName = (
	root: MergedRunDataWithDiff,
	name: string
): MergedRunDataWithDiff | undefined => {
	if (root.left?.test_name === name || root.right?.test_name === name) {
		return root;
	}

	for (const child of root.children) {
		const found = findByName(child, name);

		if (found) return found;
	}

	return undefined;
};

describe('propagateDiffToParents', () => {
	it('should mark every ancestor of a changed node as changed', () => {
		const leaf = merged(DiffType.CHANGED);
		const parent = merged(DiffType.DEFAULT, [leaf]);
		const root = merged(DiffType.DEFAULT, [parent]);

		expect(propagateDiffToParents(root)).toBe(DiffType.CHANGED);
		expect(root.diffType).toBe(DiffType.CHANGED);
		expect(parent.diffType).toBe(DiffType.CHANGED);
		expect(leaf.diffType).toBe(DiffType.CHANGED);
	});

	it.each([DiffType.ADDED, DiffType.REMOVED])(
		'should mark ancestors of a %s node as changed while the node keeps its own type',
		(leafDiffType) => {
			const leaf = merged(leafDiffType);
			const parent = merged(DiffType.DEFAULT, [leaf]);
			const root = merged(DiffType.DEFAULT, [parent]);

			propagateDiffToParents(root);

			expect(root.diffType).toBe(DiffType.CHANGED);
			expect(parent.diffType).toBe(DiffType.CHANGED);
			expect(leaf.diffType).toBe(leafDiffType);
		}
	);

	it('should not downgrade an added node to changed', () => {
		const root = merged(DiffType.ADDED, [
			merged(DiffType.ADDED, [merged(DiffType.ADDED)])
		]);

		expect(propagateDiffToParents(root)).toBe(DiffType.ADDED);
		expect(root.diffType).toBe(DiffType.ADDED);
	});

	it('should not downgrade a removed node to changed', () => {
		const root = merged(DiffType.REMOVED, [merged(DiffType.REMOVED)]);

		expect(propagateDiffToParents(root)).toBe(DiffType.REMOVED);
		expect(root.diffType).toBe(DiffType.REMOVED);
	});

	it('should leave an unchanged tree untouched', () => {
		const leaf = merged(DiffType.DEFAULT);
		const parent = merged(DiffType.DEFAULT, [leaf]);
		const root = merged(DiffType.DEFAULT, [parent]);

		expect(propagateDiffToParents(root)).toBe(DiffType.DEFAULT);
		expect(root.diffType).toBe(DiffType.DEFAULT);
		expect(parent.diffType).toBe(DiffType.DEFAULT);
	});

	it('should return the diff type of a leaf without children', () => {
		const leaf = merged(DiffType.DEFAULT);

		expect(propagateDiffToParents(leaf)).toBe(DiffType.DEFAULT);
	});
});

describe('computeDiff', () => {
	it('should mark parent packages as changed when only a deep child changed', () => {
		// Both runs pass a single test under `inner`, so every aggregated stat of
		// `inner` and of the root matches - only the leaf itself was swapped out.
		const leftRoot = node({
			test_id: 1,
			test_name: 'root',
			stats: { passed: 1 },
			children: [
				node({
					test_id: 2,
					test_name: 'inner',
					stats: { passed: 1 },
					children: [
						test({ test_id: 3, test_name: 'only_left', stats: { passed: 1 } })
					]
				})
			]
		});

		const rightRoot = node({
			test_id: 1,
			test_name: 'root',
			stats: { passed: 1 },
			children: [
				node({
					test_id: 2,
					test_name: 'inner',
					stats: { passed: 1 },
					children: [
						test({ test_id: 4, test_name: 'only_right', stats: { passed: 1 } })
					]
				})
			]
		});

		const { merge } = computeDiff({ leftRoot, rightRoot });
		const root = merge[0];

		expect(root.diffType).toBe(DiffType.CHANGED);
		expect(findByName(root, 'inner')?.diffType).toBe(DiffType.CHANGED);
		expect(findByName(root, 'only_left')?.diffType).toBe(DiffType.REMOVED);
		expect(findByName(root, 'only_right')?.diffType).toBe(DiffType.ADDED);
	});

	it('should keep a wholly added package added instead of changed', () => {
		const leftRoot = node({ test_id: 1, test_name: 'root' });
		const rightRoot = node({
			test_id: 1,
			test_name: 'root',
			stats: { passed: 1 },
			children: [
				node({
					test_id: 2,
					test_name: 'added_pkg',
					stats: { passed: 1 },
					children: [
						test({ test_id: 3, test_name: 'added_test', stats: { passed: 1 } })
					]
				})
			]
		});

		const { merge } = computeDiff({ leftRoot, rightRoot });
		const root = merge[0];

		expect(findByName(root, 'added_pkg')?.diffType).toBe(DiffType.ADDED);
		expect(findByName(root, 'added_test')?.diffType).toBe(DiffType.ADDED);
		expect(root.diffType).toBe(DiffType.CHANGED);
	});

	it('should leave identical trees unchanged', () => {
		const build = () =>
			node({
				test_id: 1,
				test_name: 'root',
				stats: { passed: 1 },
				children: [
					node({
						test_id: 2,
						test_name: 'inner',
						stats: { passed: 1 },
						children: [
							test({ test_id: 3, test_name: 'same', stats: { passed: 1 } })
						]
					})
				]
			});

		const { merge } = computeDiff({ leftRoot: build(), rightRoot: build() });
		const root = merge[0];

		expect(root.diffType).toBe(DiffType.DEFAULT);
		expect(findByName(root, 'inner')?.diffType).toBe(DiffType.DEFAULT);
		expect(findByName(root, 'same')?.diffType).toBe(DiffType.DEFAULT);
	});
});
