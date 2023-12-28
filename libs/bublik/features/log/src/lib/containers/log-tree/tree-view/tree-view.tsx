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

import { getPathToNode, isFocusInInput, isPackage } from '@/shared/utils';
import { useSmoothScroll, useForceRerender } from '@/shared/hooks';
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
			hasError: node.hasError,
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
	data: { mainPackage: string; tree: { [key: string]: TreeNode } };
	focusId: string | null;
	itemSize: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ref: any;
}

export const TreeView: FC<TreeViewProps> = forwardRef<
	(() => Promise<void>) | undefined,
	TreeViewProps
>((props, ref) => {
	const {
		data: { tree, mainPackage },
		focusId,
		itemSize
	} = props;

	const treeRef = useRef<FixedSizeTree<TreeData>>(null);
	const [, setSearchParams] = useSearchParams();

	const treeWalker = useCallback(
		function* treeWalkerFn(): ReturnType<TreeWalker<TreeData, NodeMeta>> {
			yield getNodeData(tree[mainPackage], 0);

			while (true) {
				const parent = yield;

				for (let i = 0; i < parent.node.children.length; i++) {
					const childId = parent.node.children[i];

					yield getNodeData(tree[childId], parent.nestingLevel + 1);
				}
			}
		},
		[mainPackage, tree]
	);

	/* ========== SCROLLING ========== */
	const forceRerender = useForceRerender();
	const { scrollableRef, scrollTo } = useSmoothScroll();
	const currentScrollId = useRef(focusId ?? mainPackage);
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

	useEffect(() => {
		/* ========== HELPERS ========== */
		const updateCurrentScrollId = (value: string) => {
			currentScrollId.current = value;
			forceRerender();
		};

		const getNextPackage = (currentScrollId: string, stack: string[]) => {
			// 1) When scroll id is root scroll to bottom
			if (currentScrollId === mainPackage) {
				return stack
					.slice()
					.reverse()
					.find((id) => isPackage(tree[id]));
			}

			// 2) Just return next id
			return stack
				.slice(0, stack.indexOf(currentScrollId) + 1)
				.reverse()
				.find((id, index, arr) => {
					const isOpen = treeRef.current?.state.records.get(id)?.public.isOpen;

					if (index === 0) return false;
					if (id === mainPackage) return true;

					return (
						// 1) Next or prev node is test
						tree[id].hasError ||
						(isPackage(tree[id]) && !isPackage(tree[arr[index + 1]])) ||
						(isPackage(tree[id]) && !isPackage(tree[arr[index - 1]])) ||
						// 2) Opened nodes
						isOpen
					);
				});
		};

		const getPrevPackage = (currentScrollId: string, stack: string[]) => {
			return stack
				.slice(stack.indexOf(currentScrollId))
				.find((id, index, arr) => {
					const isOpen = treeRef.current?.state.records.get(id)?.public
						.isOpen as boolean;

					if (index === 0) return false;
					if (id === mainPackage) return true;

					return (
						// 1) Next or prev node is test
						tree[id].hasError ||
						(isPackage(tree[id]) && !isPackage(tree[arr[index - 1]])) ||
						(isPackage(tree[id]) && !isPackage(tree[arr[index + 1]])) ||
						// 2) Opened nodes
						isOpen ||
						// 3) Nesting level
						(!(
							treeRef.current?.state.records.get(id)?.public.data
								.nestingLevel ===
							treeRef.current?.state.records.get(currentScrollId)?.public.data
								.nestingLevel
						) &&
							tree[id].entity !== 'test')
					);
				});
		};

		const jumpTenNodesUp = (currentScrollId: string, stack: string[]) => {
			// 1) When scroll id is root scroll to bottom
			if (currentScrollId === mainPackage) {
				return stack
					.slice()
					.reverse()
					.find((id) => isPackage(tree[id]));
			}

			// 2) Just return next id
			const nextId = stack
				.slice(0, stack.indexOf(currentScrollId) + 1)
				.reverse()
				.slice(0, 11);

			return nextId[nextId.length - 1];
		};

		const jumpTenNodesDown = (currentScrollId: string, stack: string[]) => {
			const nextId = stack.slice(stack.indexOf(currentScrollId)).slice(0, 11);

			if (nextId[nextId.length - 1] === stack[stack.length - 1])
				return mainPackage;

			return nextId[nextId.length - 1];
		};

		const getNextNode = (currentScrollId: string, stack: string[]) => {
			const nextNodeId = stack
				.slice(0, stack.indexOf(currentScrollId.toString()))
				.reverse()[0];

			if (!nextNodeId) return stack[stack.length - 1];

			return nextNodeId;
		};

		const getPrevNode = (currentScrollId: string, stack: string[]) => {
			return stack.slice(stack.indexOf(currentScrollId.toString()))[1];
		};

		const calcScrollPosition = (scrollId: string, nodeStack: string[]) => {
			// 1) Get node index from stack
			const index = nodeStack.indexOf(scrollId.toString());

			// 2) Get offset from index and item size
			return index * itemSize - window.innerHeight / 2 + itemSize / 2;
		};

		const scrollToFocus = async () => {
			const getUpdatedState = (ids: string[]) => {
				const state: {
					[nodeId: string]: boolean;
				} = {};

				ids.forEach((id) => (state[id] = true));

				return state;
			};

			if (!focusId) return;
			if (focusId === mainPackage) {
				updateCurrentScrollId(mainPackage);
				return;
			}

			const stack = treeRef.current?.state.order;

			// 1) Get path to node
			const path = getPathToNode(focusId, tree);
			// 2) Build state
			const nodesToOpen = getUpdatedState(path);
			// 3) Update tree state
			await treeRef.current?.recomputeTree(nodesToOpen);
			// 4) Scroll to node
			if (!stack) return;
			scrollToNode(focusId, stack);
		};

		const scrollToNode = (
			scrollId: string | undefined = mainPackage,
			stack: string[]
		) => {
			updateCurrentScrollId(scrollId);
			return scrollTo(calcScrollPosition(scrollId, stack));
		};

		/* ========== MAIN LOGIC ========== */

		// [1] Scroll to focus
		if (treeRef.current && focusId) scrollToFocus();

		// [3] Keyboard navigation
		// W/S - jump one node up/down
		// A/D - jump ten node up/down
		// C/R - smart jump up/down
		// F - jump to focus node
		// T - jump to top
		// X - close parent node and subtree
		// G - close all nodes
		// ENTER - open/close if package, download log if test

		const handleScroll = (e: KeyboardEvent) => {
			const stack = treeRef.current?.state.order as string[];
			// 1) Up and down
			if (
				e.code === 'KeyR' ||
				e.code === 'KeyC' ||
				e.code === 'KeyH' ||
				e.code === 'KeyJ' ||
				e.code === 'KeyK' ||
				e.code === 'KeyL'
			) {
				let scrollId: string | undefined;
				// Smart jumping
				if (e.code === 'KeyR')
					scrollId = getNextPackage(currentScrollId.current, stack);
				if (e.code === 'KeyC')
					scrollId = getPrevPackage(currentScrollId.current, stack);

				// Go up/down one node
				if (e.code === 'KeyK')
					scrollId = getNextNode(currentScrollId.current, stack);
				if (e.code === 'KeyJ')
					scrollId = getPrevNode(currentScrollId.current, stack);

				// Go up/down ten nodes
				if (e.code === 'KeyH')
					scrollId = jumpTenNodesUp(currentScrollId.current, stack);
				if (e.code === 'KeyL')
					scrollId = jumpTenNodesDown(currentScrollId.current, stack);

				if (!isFocusInInput(e)) scrollToNode(scrollId, stack);
			}

			// 2) To top
			if (e.code === 'KeyT' && !isFocusInInput(e)) {
				scrollToNode(mainPackage, stack);
			}

			// 3) To focus
			if (e.code === 'KeyF' && focusId && !isFocusInInput(e)) {
				scrollToFocus();
			}
		};

		/* ========== CLOSE AND OPEN NODES ========== */

		// [4] Open and close packages
		const handleCloseAllNodes = async (e: KeyboardEvent) => {
			if (e.code === 'KeyG') {
				await treeRef.current?.recomputeTree({
					[mainPackage]: {
						open: true,
						subtreeCallback(node, ownerNode) {
							if (node !== ownerNode) {
								node.isOpen = false;
							}
						}
					}
				});

				updateCurrentScrollId(mainPackage);
			}
		};

		const handleCloseParent = async (e: KeyboardEvent) => {
			const stack = treeRef.current?.state.order;
			const parentId: string | null = tree[currentScrollId.current].parentId;

			if (e.code === 'KeyX') {
				if (parentId && parentId !== mainPackage) {
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
					parentId && parentId !== mainPackage ? parentId : mainPackage,
					stack
				);
			}
		};

		const handleCloseChildren = async (e: KeyboardEvent) => {
			const stack = treeRef.current?.state.order as string[];
			const parentId: string | null = tree[currentScrollId.current].parentId;

			if (e.code === 'KeyZ') {
				if (parentId && parentId !== mainPackage) {
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

				scrollToNode(
					parentId && parentId !== mainPackage ? parentId : mainPackage,
					stack
				);
			}
		};

		const handleNodeClick = async (e: KeyboardEvent) => {
			if (e.code === 'Enter') {
				// 1) Toggle node
				if (isPackage(tree[currentScrollId.current])) {
					const isOpen = treeRef.current?.state.records.get(
						currentScrollId.current
					)?.public.isOpen;

					await treeRef.current?.recomputeTree({
						[currentScrollId.current]: !(
							isOpen && currentScrollId.current !== mainPackage
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
			}
		};

		// FOR BUTTON
		scrollToFocusFuncRef.current = scrollToFocus;

		if (isFirstRender && focusId) {
			setTimeout(() => {
				if (tree[focusId]) {
					scrollToFocus();
				}
			}, 0);

			isFirstRender.current = false;
		}

		window.addEventListener('keypress', handleScroll);
		window.addEventListener('keypress', handleNodeClick);
		window.addEventListener('keypress', handleCloseParent);
		window.addEventListener('keypress', handleCloseChildren);
		window.addEventListener('keypress', handleCloseAllNodes);

		return () => {
			window.removeEventListener('keypress', handleScroll);
			window.removeEventListener('keypress', handleNodeClick);
			window.removeEventListener('keypress', handleCloseParent);
			window.removeEventListener('keypress', handleCloseChildren);
			window.removeEventListener('keypress', handleCloseAllNodes);
		};
	}, [
		focusId,
		mainPackage,
		tree,
		itemSize,
		scrollTo,
		forceRerender,
		setSearchParams
	]);

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
							mainPackage,
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
