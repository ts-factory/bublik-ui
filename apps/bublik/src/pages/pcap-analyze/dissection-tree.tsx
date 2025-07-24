import { useState, useEffect, useCallback } from 'react';

export const NO_SELECTION = { id: '', idx: 0, start: 0, length: 0 };

export interface TreeNode {
	label: string;
	tree?: TreeNode[];
	length: number;
	data_source_idx?: number;
	start?: number;
	filter?: string;
}

interface DissectionTreeProps {
	id: string;
	tree: TreeNode[];
	select?: (selection: any) => void;
	root?: boolean;
	selected?: string;
	setFilter?: (filter: string) => void;
}

function DissectionTree(props: DissectionTreeProps) {
	const { id, tree, select, root, selected, setFilter } = props;
	const [openStates, setOpenStates] = useState<Map<string, boolean>>(new Map());

	const isOpen = useCallback(
		(nodeId: string) => openStates.get(nodeId) || false,
		[openStates]
	);

	useEffect(() => {
		setOpenStates((prev) => {
			const newMap = new Map(prev);
			tree.forEach((_, i) => {
				const nodeId = `${id}-${i}`;
				if (!isOpen(nodeId) && selected?.startsWith(nodeId + '-')) {
					newMap.set(nodeId, true);
				}
			});
			return newMap;
		});
	}, [selected, id, tree, isOpen]);

	const toggle = (nodeId: string) => {
		setOpenStates((prev) => {
			const currentState = prev.get(nodeId) || false;
			const newMap = new Map(prev);
			newMap.set(nodeId, !currentState);
			if (currentState && selected?.startsWith(nodeId + '-')) {
				select?.(NO_SELECTION);
			}
			return newMap;
		});
	};

	const handleClick = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>,
		node: TreeNode,
		nodeId: string
	) => {
		if (e.detail === 2 && setFilter && node.filter) {
			setFilter(node.filter);
		}
		if (node.length > 0) {
			select?.({
				id: nodeId,
				idx: node.data_source_idx,
				start: node.start,
				length: node.length
			});
		}
	};

	return (
		<div className={root ? 'overflow-x-auto w-auto' : 'pl-2 border-l'}>
			{tree.map((node, i) => {
				const nodeId = `${id}-${i}`;
				const isSelected = nodeId === selected;
				const hasChildren = node.tree && node.tree.length > 0;
				return (
					<div key={nodeId} className="leading-relaxed">
						<div
							className={[
								'flex items-center min-w-fit w-full',
								node.length > 0 ? 'cursor-pointer' : 'cursor-default',
								isSelected ? 'bg-gray-600 text-white' : 'text-gray-500'
							].join(' ')}
						>
							{hasChildren ? (
								<span
									className="cursor-pointer flex flex-grow-0"
									onClick={(e) => {
										e.stopPropagation();
										toggle(nodeId);
									}}
								>
									<svg
										className={`shrink-0 w-2.5 h-2.5 transition-transform duration-200 ${
											isOpen(nodeId) ? 'rotate-90' : ''
										} ${isSelected ? 'text-white' : 'text-gray-600'}`}
										viewBox="0 0 16 16"
										fill="currentColor"
									>
										<path
											d="M6 4l4 4-4 4"
											stroke="currentColor"
											strokeWidth="2"
											fill="none"
										/>
									</svg>
								</span>
							) : (
								<span className="shrink-0 w-2.5 h-2.5 text-gray-500">
									<svg
										viewBox="0 0 16 16"
										width={10}
										height={10}
										fill="currentColor"
									>
										<rect x="3" y="7" width="10" height="2" rx="1" />
									</svg>
								</span>
							)}
							<div
								className="ml-1 flex-1 whitespace-nowrap overflow-visible font-mono text-xs select-none"
								onClick={(e) => handleClick(e, node, nodeId)}
								onDoubleClick={() => toggle(nodeId)}
							>
								{node.label}
							</div>
						</div>
						{/* Children */}
						{hasChildren && isOpen(nodeId) && (
							<DissectionTree
								id={nodeId}
								tree={node.tree || []}
								select={select}
								selected={selected}
								setFilter={setFilter}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}

export { DissectionTree };
