/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, MouseEvent } from 'react';
import ReactFlow, {
	useNodesState,
	useEdgesState,
	addEdge,
	Controls,
	ReactFlowProps,
	Connection,
	Node
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CardHeader } from '@/shared/tailwind-ui';

import { InfoNode } from './info-node';
import { SmoothCustomEdge } from './custom-edge';
import { initialNodes, initialEdges } from './nodes';
import {
	findConnectedNodes,
	findConnectedEdges,
	getEdgesForDimm,
	getNodesForDimm,
	dimNodes,
	dimEdges
} from './utils';

const nodeTypes = { infoNode: InfoNode };
const edgeTypes = { 'smooth-custom-edge': SmoothCustomEdge };

const EdgesFlow = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onConnect: ReactFlowProps['onConnect'] = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges]
	);

	const handleDimNodes = (mousedNode: Node, isDimmed: boolean) => {
		const connectedNodesIds = findConnectedNodes(mousedNode, nodes, edges);
		const connectedEdgeIds = findConnectedEdges(mousedNode, edges);
		const nodesForDimIds = getNodesForDimm(
			mousedNode,
			connectedNodesIds,
			nodes
		);
		const edgesToDimIds = getEdgesForDimm(connectedEdgeIds, edges);

		setNodes(dimNodes(nodesForDimIds, isDimmed));
		setEdges(dimEdges(edgesToDimIds, isDimmed));
	};

	const handleNodeMouseEnter = (_: MouseEvent, mousedNode: Node) => {
		handleDimNodes(mousedNode, true);
	};

	const handleNodeMouseLeave = (_: MouseEvent, mousedNode: Node) => {
		handleDimNodes(mousedNode, false);
	};

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onNodeMouseEnter={handleNodeMouseEnter}
			onNodeMouseLeave={handleNodeMouseLeave}
			onConnect={onConnect}
			nodesConnectable={false}
			nodesDraggable={false}
			snapToGrid={true}
			nodeTypes={nodeTypes}
			edgeTypes={edgeTypes}
			fitView
			attributionPosition="bottom-right"
		>
			<Controls showInteractive={false} />
		</ReactFlow>
	);
};

const FlowChartLegend = () => {
	return (
		<div className="flex justify-center gap-4 px-4 py-2">
			<div className="flex flex-wrap items-center gap-24">
				<div className="bg-[#F3F6FF] border border-[#424673] rounded-lg py-1 px-2.5">
					<span className="text-[#424673] text-[0.75rem] leading-[1.125rem] font-normal">
						bublik page
					</span>
				</div>
				<div className="bg-[#FFDD86] border border-transparent rounded-lg py-1 px-2.5">
					<span className="text-[#424673] text-[0.75rem] leading-[1.125rem] font-normal">
						external link
					</span>
				</div>
				<div className="flex flex-wrap items-center">
					<svg
						width="32"
						height="7"
						viewBox="0 0 32 7"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M32 3.5L27 0.613249V6.38675L32 3.5ZM0 4L27.5 4V3L0 3V4Z"
							fill="#424673"
						/>
						<path
							d="M0 3.5L5 6.38675V0.613249L0 3.5ZM32 3L4.5 3V4L32 4V3Z"
							fill="#424673"
						/>
					</svg>

					<span className="text-[#424673] text-[0.75rem] leading-[1.125rem] font-normal">
						both road directions
					</span>
				</div>
				<div className="flex items-center gap-3">
					<svg
						width="33"
						height="7"
						viewBox="0 0 33 7"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M32.5 3.5L27.5 0.613249V6.38675L32.5 3.5ZM0.5 4L28 4V3L0.5 3V4Z"
							fill="#424673"
						/>
					</svg>
					<span className="text-[#424673] text-[0.75rem] leading-[1.125rem] font-normal">
						one road directions
					</span>
				</div>
				<div className="flex items-center gap-3">
					<svg
						width="32"
						height="7"
						viewBox="0 0 32 7"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M32 3.5L27 0.613249V6.38675L32 3.5ZM0 4L27.5 4V3L0 3V4Z"
							fill="#C7C9DD"
						/>
					</svg>

					<span className="text-[#424673] text-[0.75rem] leading-[1.125rem] font-normal">
						optional road
					</span>
				</div>
			</div>
		</div>
	);
};

export const FlowMap = () => {
	return (
		<div className="relative flex flex-col flex-grow bg-white rounded-md">
			<CardHeader label="Flow Map" />
			<div className="flex-grow">
				<EdgesFlow />
			</div>
			<FlowChartLegend />
		</div>
	);
};
