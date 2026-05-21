/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	FC,
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef
} from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	FixedSizeNodeData,
	FixedSizeTree,
	FixedSizeTree as Tree,
	TreeWalker,
	TreeWalkerValue
} from 'react-vtree';
import AutoSizer from 'react-virtualized-auto-sizer';

import { getPathToNode, isPackage } from '@/shared/utils';
import {
	useSmoothScroll,
	useForceRerender,
	usePhysicalHotkeys
} from '@/shared/hooks';
import { NodeData } from '@/shared/types';

import { Node } from '../tree-node';

export type TreeNode = Readonly<NodeData>;

export type TreeData = TreeNode &
	FixedSizeNodeData &
	Readonly<{
		nestingLevel: number;
	}>;

type NodeMeta = Readonly<{
	nestingLevel: number;
	node: TreeNode;
}>;

const getNodeData = (
	node: TreeNode,
	nestingLevel: number
): TreeWalkerValue<TreeData, NodeMeta> => {
	return {
		data: {
			id: node.id, // Mandatory
			start: node.start,
			name: node.name,
			entity: node.entity,
			errorCount: node.errorCount,
			children: node.children,
			has_error: node.has_error,
			parentId: node.parentId,
			path: node.path, // Tree
			nestingLevel: nestingLevel,
			isOpenByDefault: nestingLevel === 0, // Mandatory // Root is open by default,
			skipped: node.skipped
		},
		// Meta
		nestingLevel: nestingLevel,
		node: node
	};
};

export interface TreeViewProps {
	data: { main_package: string; tree: { [key: string]: TreeNode } };
	focusId: string | null;
	itemSize: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ref?: any;
}

export const TreeView: FC<TreeViewProps> = forwardRef<
	(() => Promise<void>) | undefined,
	TreeViewProps
>((props, ref) => {
	const {
		data: { tree, main_package },
		focusId,
		itemSize
	} = props;

	const treeRef = useRef<FixedSizeTree<TreeData>>(null);
	const [, setSearchParams] = useSearchParams();

	const treeWalker = useCallback(
		function* treeWalkerFn(): ReturnType<TreeWalker<TreeData, NodeMeta>> {
			yield getNodeData(tree[main_package], 0);

			while (true) {
				const parent = yield;

				for (let i = 0; i < parent.node.children.length; i++) {
					const childId = parent.node.children[i];

					yield getNodeData(tree[childId], parent.nestingLevel + 1);
				}
			}
		},
		[main_package, tree]
	);

	/* ========== SCROLLING ========== */
	const forceRerender = useForceRerender();
	const { scrollableRef, scrollTo } = useSmoothScroll();
	const currentScrollId = useRef(focusId ?? main_package);
	const scrollToFocusFuncRef = useRef<() => Promise<void>>();
	const changeCurrentScrollId = useCallback(
		(newScrollId: string) => {
			currentScrollId.current = newScrollId;
			forceRerender();
		},
		[forceRerender]
	);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useImperativeHandle(ref, () => scrollToFocusFuncRef.current, [
		scrollToFocusFuncRef.current
	]);

	const isFirstRender = useRef(true);

	const updateCurrentScrollId = useCallback(
		(value: string) => {
			currentScrollId.current = value;
			forceRerender();
		},
		[forceRerender]
	);

	const getNextPackage = useCallback(
		(currentScrollId: string, stack: string[]) => {
			if (currentScrollId === main_package) {
				return stack
					.slice()
					.reverse()
					.find((id) => isPackage(tree[id]));
			}

			return stack
				.slice(0, stack.indexOf(currentScrollId) + 1)
				.reverse()
				.find((id, index, arr) => {
					const isOpen = treeRef.current?.state.records.get(id)?.public.isOpen;

					if (index === 0) return false;
					if (id === main_package) return true;

					return (
						tree[id].has_error ||
						(isPackage(tree[id]) && !isPackage(tree[arr[index + 1]])) ||
						(isPackage(tree[id]) && !isPackage(tree[arr[index - 1]])) ||
						isOpen
					);
				});
		},
		[main_package, tree]
	);

	const getPrevPackage = useCallback(
		(currentScrollId: string, stack: string[]) => {
			return stack
				.slice(stack.indexOf(currentScrollId))
				.find((id, index, arr) => {
					const isOpen = treeRef.current?.state.records.get(id)?.public
						.isOpen as boolean;

					if (index === 0) return false;
					if (id === main_package) return true;

					return (
						tree[id].has_error ||
						(isPackage(tree[id]) && !isPackage(tree[arr[index - 1]])) ||
						(isPackage(tree[id]) && !isPackage(tree[arr[index + 1]])) ||
						isOpen ||
						(!(
							treeRef.current?.state.records.get(id)?.public.data
								.nestingLevel ===
							treeRef.current?.state.records.get(currentScrollId)?.public.data
								.nestingLevel
						) &&
							tree[id].entity !== 'test')
					);
				});
		},
		[main_package, tree]
	);

	const jumpTenNodesUp = useCallback(
		(currentScrollId: string, stack: string[]) => {
			if (currentScrollId === main_package) {
				return stack
					.slice()
					.reverse()
					.find((id) => isPackage(tree[id]));
			}

			const nextId = stack
				.slice(0, stack.indexOf(currentScrollId) + 1)
				.reverse()
				.slice(0, 11);

			return nextId[nextId.length - 1];
		},
		[main_package, tree]
	);

	const jumpTenNodesDown = useCallback(
		(currentScrollId: string, stack: string[]) => {
			const nextId = stack.slice(stack.indexOf(currentScrollId)).slice(0, 11);

			if (nextId[nextId.length - 1] === stack[stack.length - 1])
				return main_package;

			return nextId[nextId.length - 1];
		},
		[main_package]
	);

	const getNextNode = useCallback(
		(currentScrollId: string, stack: string[]) => {
			const nextNodeId = stack
				.slice(0, stack.indexOf(currentScrollId.toString()))
				.reverse()[0];

			if (!nextNodeId) return stack[stack.length - 1];

			return nextNodeId;
		},
		[]
	);

	const getPrevNode = useCallback(
		(currentScrollId: string, stack: string[]) => {
			return stack.slice(stack.indexOf(currentScrollId.toString()))[1];
		},
		[]
	);

	const calcScrollPosition = useCallback(
		(scrollId: string, nodeStack: string[]) => {
			const index = nodeStack.indexOf(scrollId.toString());

			return index * itemSize - window.innerHeight / 2 + itemSize / 2;
		},
		[itemSize]
	);

	const scrollToNode = useCallback(
		(scrollId: string | undefined = main_package, stack: string[]) => {
			updateCurrentScrollId(scrollId);
			return scrollTo(calcScrollPosition(scrollId, stack));
		},
		[calcScrollPosition, main_package, scrollTo, updateCurrentScrollId]
	);

	const scrollToFocus = useCallback(async () => {
		const getUpdatedState = (ids: string[]) => {
			const state: {
				[nodeId: string]: boolean;
			} = {};

			ids.forEach((id) => (state[id] = true));

			return state;
		};

		if (!focusId) return;
		if (focusId === main_package) {
			updateCurrentScrollId(main_package);
			return;
		}

		const stack = treeRef.current?.state.order;
		const path = getPathToNode(focusId, tree);
		const nodesToOpen = getUpdatedState(path);

		await treeRef.current?.recomputeTree(nodesToOpen);

		if (stack) scrollToNode(focusId, stack);
	}, [focusId, main_package, scrollToNode, tree, updateCurrentScrollId]);

	const scrollByCode = useCallback(
		(code: string) => {
			const stack = treeRef.current?.state.order as string[] | undefined;
			if (!stack) return;

			let scrollId: string | undefined;

			if (code === 'KeyR')
				scrollId = getNextPackage(currentScrollId.current, stack);
			if (code === 'KeyC')
				scrollId = getPrevPackage(currentScrollId.current, stack);
			if (code === 'KeyK')
				scrollId = getNextNode(currentScrollId.current, stack);
			if (code === 'KeyJ')
				scrollId = getPrevNode(currentScrollId.current, stack);
			if (code === 'KeyH')
				scrollId = jumpTenNodesUp(currentScrollId.current, stack);
			if (code === 'KeyL')
				scrollId = jumpTenNodesDown(currentScrollId.current, stack);
			if (code === 'KeyT') scrollId = main_package;

			scrollToNode(scrollId, stack);
		},
		[
			getNextNode,
			getNextPackage,
			getPrevNode,
			getPrevPackage,
			jumpTenNodesDown,
			jumpTenNodesUp,
			main_package,
			scrollToNode
		]
	);

	const closeAllNodes = useCallback(async () => {
		await treeRef.current?.recomputeTree({
			[main_package]: {
				open: true,
				subtreeCallback(node, ownerNode) {
					if (node !== ownerNode) {
						node.isOpen = false;
					}
				}
			}
		});

		updateCurrentScrollId(main_package);
	}, [main_package, updateCurrentScrollId]);

	const closeParent = useCallback(async () => {
		const stack = treeRef.current?.state.order;
		const parentId: string | null = tree[currentScrollId.current].parentId;

		if (parentId && parentId !== main_package) {
			await treeRef.current?.recomputeTree({
				[parentId]: {
					open: false,
					subtreeCallback(node, _ownerNode) {
						node.isOpen = false;
					}
				}
			});
		}

		if (!stack) return;
		scrollToNode(
			parentId && parentId !== main_package ? parentId : main_package,
			stack
		);
	}, [main_package, scrollToNode, tree]);

	const closeChildren = useCallback(async () => {
		const stack = treeRef.current?.state.order as string[] | undefined;
		const parentId: string | null = tree[currentScrollId.current].parentId;

		if (parentId && parentId !== main_package) {
			await treeRef.current?.recomputeTree({
				[parentId]: {
					open: true,
					subtreeCallback(node, ownerNode) {
						if (node !== ownerNode) {
							node.isOpen = false;
						}
					}
				}
			});
		}

		if (stack) {
			scrollToNode(
				parentId && parentId !== main_package ? parentId : main_package,
				stack
			);
		}
	}, [main_package, scrollToNode, tree]);

	const toggleCurrentNode = useCallback(async () => {
		if (isPackage(tree[currentScrollId.current])) {
			const isOpen = treeRef.current?.state.records.get(currentScrollId.current)
				?.public.isOpen;

			await treeRef.current?.recomputeTree({
				[currentScrollId.current]: !(
					isOpen && currentScrollId.current !== main_package
				)
			});
		}

		if (tree[currentScrollId.current].entity !== 'suite') {
			setSearchParams((params) => {
				if (params.get('focusId') !== currentScrollId.current) {
					params.delete('lineNumber');
				}

				params.set('focusId', currentScrollId.current);

				return params;
			});
		}
	}, [main_package, setSearchParams, tree]);

	usePhysicalHotkeys(
		[
			{ code: 'KeyR', callback: () => scrollByCode('KeyR') },
			{ code: 'KeyC', callback: () => scrollByCode('KeyC') },
			{ code: 'KeyH', callback: () => scrollByCode('KeyH') },
			{ code: 'KeyJ', callback: () => scrollByCode('KeyJ') },
			{ code: 'KeyK', callback: () => scrollByCode('KeyK') },
			{ code: 'KeyL', callback: () => scrollByCode('KeyL') },
			{ code: 'KeyT', callback: () => scrollByCode('KeyT') },
			{
				code: 'KeyF',
				callback: () => scrollToFocus(),
				options: { enabled: Boolean(focusId) }
			},
			{
				code: 'KeyG',
				callback: () => closeAllNodes(),
				options: { requireReset: true }
			},
			{
				code: 'KeyX',
				callback: () => closeParent(),
				options: { requireReset: true }
			},
			{
				code: 'KeyZ',
				callback: () => closeChildren(),
				options: { requireReset: true }
			},
			{
				code: 'Enter',
				callback: () => toggleCurrentNode(),
				options: { requireReset: true }
			}
		],
		{
			ignoreInputs: true,
			preventDefault: true
		}
	);

	useEffect(() => {
		if (treeRef.current && focusId) scrollToFocus();

		scrollToFocusFuncRef.current = scrollToFocus;

		if (isFirstRender.current && focusId) {
			setTimeout(() => {
				if (tree[focusId]) {
					scrollToFocus();
				}
			}, 0);

			isFirstRender.current = false;
		}
	}, [focusId, scrollToFocus, tree]);

	return (
		<AutoSizer>
			{({ height, width }) => {
				return (
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					<Tree
						ref={treeRef}
						outerRef={scrollableRef}
						treeWalker={treeWalker}
						height={height}
						width={width}
						itemSize={itemSize}
						className="no-bg-scrollbar"
						outerElementType="ul"
						itemData={{
							main_package,
							focusId,
							currentScrollId: currentScrollId.current,
							changeCurrentScrollId
						}}
						style={{ margin: 0, padding: 0, listStyle: 'none' }}
					>
						{Node}
					</Tree>
				);
			}}
		</AutoSizer>
	);
});
