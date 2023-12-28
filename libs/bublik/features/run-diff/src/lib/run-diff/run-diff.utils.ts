/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { NodeEntity, RunData } from '@/shared/types';
import { traverseTree, clone as cloneDeep } from '@/shared/utils';
import { getCalculatedStats } from '@/bublik/run-utils';

import { DiffType, MergedRunDataWithDiff } from './run-diff.types';

export const getRowCanExpand = (row: Row<MergedRunDataWithDiff>) => {
	return (
		Boolean(row.subRows.length) ||
		row.original.left?.type === NodeEntity.Test ||
		row.original?.right?.type === NodeEntity.Test
	);
};

export const mergeTrees = <T extends RunData>(left: T[], right: T[]) => {
	const allChildren = [...left, ...right];

	return allChildren.reduce<T[]>((acc, curr) => {
		const item = acc.find((node) => getNodeId(curr) === getNodeId(node));

		if (item) item.children = mergeTrees(item.children, curr.children);
		if (!item) acc.push(curr);

		return acc;
	}, []);
};

export const getNodeId = <T extends RunData & { id: string }>(data: T) => {
	return `${data.id}`;
};

export interface ComputeDiffConfig {
	leftRoot: RunData;
	rightRoot: RunData;
}

export const computeDiff = (config: ComputeDiffConfig) => {
	const { leftRoot, rightRoot } = config;

	const leftMap = new Map<string, RunData>();
	const rightMap = new Map<string, RunData>();

	const leftTree = cloneDeep(leftRoot);
	const rightTree = cloneDeep(rightRoot);

	// 1. Add ids
	traverseTree(leftTree, 0, (node, index, parent) => {
		const parentChildren = parent?.children || [];
		const filteredChildren = parentChildren.filter(
			(child) => child.result_id === node.result_id
		);

		const sortedChildren = filteredChildren.sort(
			(a, b) => a.exec_seqno - b.exec_seqno
		);

		node.id = `${node.result_id}_${
			sortedChildren.findIndex(
				(sortedNOde) => sortedNOde.exec_seqno === node.exec_seqno
			) + 1
		}`;

		leftMap.set(getNodeId(node), node);
	});

	traverseTree(rightTree, 0, (node, index, parent) => {
		const parentChildren = parent?.children || [];
		const filteredChildren = parentChildren.filter(
			(child) => child.result_id === node.result_id
		);

		const sortedChildren = filteredChildren.sort(
			(a, b) => a.exec_seqno - b.exec_seqno
		);

		node.id = `${node.result_id}_${
			sortedChildren.findIndex(
				(sortedNOde) => sortedNOde.exec_seqno === node.exec_seqno
			) + 1
		}`;

		rightMap.set(getNodeId(node), node);
	});

	// 2. Merge trees
	const mergedTree = mergeTrees(
		[cloneDeep(leftTree)],
		[cloneDeep(rightTree)]
	) as unknown as MergedRunDataWithDiff[];

	// 3. Calculate diff
	traverseTree<any>(mergedTree[0], 0, (node) => {
		const id = getNodeId(node);
		node.left = leftMap.get(id) || null;
		node.right = rightMap.get(id) || null;

		// 1. Added or removed
		if (node.left && !node.right) node.diffType = DiffType.REMOVED;
		if (!node.left && node.right) node.diffType = DiffType.ADDED;

		// 2. TODO: Handle change detection when counts not changed but one of children changed #384
		if (node.left && node.right) {
			node.diffType = DiffType.DEFAULT;

			const leftData = leftMap.get(id);
			const rightData = rightMap.get(id);

			const left = getCalculatedStats(leftData);
			const right = getCalculatedStats(rightData);

			const equalNodes = Object.entries(left).every(
				([key, value]) => right[key] === value
			);

			if (!equalNodes) {
				node.diffType = DiffType.CHANGED;
			}
		}
	});

	// 4. Cleanup not needed props
	traverseTree<any>(mergedTree[0], 0, (node) => {
		const keysToLeave = ['left', 'right', 'children', 'diffType'];
		const keys = Object.keys(node).filter((key) => !keysToLeave.includes(key));

		keys.forEach((key) => delete node[key]);
	});

	traverseTree(mergedTree[0], 0, (node) => {
		node.children = node.children.sort((a, b) => {
			let leftExecSeqno = 0;
			let rightExecSeqno = 0;

			if (a.left?.exec_seqno && a.right?.exec_seqno) {
				leftExecSeqno = (a.left.exec_seqno + a.right.exec_seqno) / 2;
			}

			if (a.left?.exec_seqno && !a.right?.exec_seqno) {
				leftExecSeqno = a.left.exec_seqno;
			}

			if (a.right?.exec_seqno && !a.left?.exec_seqno) {
				leftExecSeqno = a.right.exec_seqno;
			}

			if (b.left?.exec_seqno && b.right?.exec_seqno) {
				rightExecSeqno = (b.left.exec_seqno + b.right.exec_seqno) / 2;
			}

			if (b.left?.exec_seqno && !b.right?.exec_seqno) {
				rightExecSeqno = b.left.exec_seqno;
			}

			if (b.right?.exec_seqno && !b.left?.exec_seqno) {
				rightExecSeqno = b.right.exec_seqno;
			}

			return leftExecSeqno - rightExecSeqno;
		});
	});

	return { merge: mergedTree };
};
