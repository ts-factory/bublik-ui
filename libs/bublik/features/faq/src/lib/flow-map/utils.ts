/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Edge, MarkerType, Node } from 'reactflow';

import { InfoNodeData } from './info-node';
import { initialEdges } from './nodes';

export const findConnectedNodes = (
	node: Node<InfoNodeData>,
	nodes: Node<InfoNodeData>[],
	edges: Edge[]
): string[] => {
	const connectionEdgesIds = edges
		.filter((edge) => edge.target === node.id)
		.map((edge) => edge.source);

	const connectedNodes = nodes
		.filter((node) => connectionEdgesIds.includes(node.id))
		.map((node) => node.id);

	return connectedNodes;
};

export const findConnectedEdges = (node: Node<InfoNodeData>, edges: Edge[]) => {
	return edges.filter((edge) => edge.target === node.id).map((edge) => edge.id);
};

export const getNodesForDimm = (
	mousedNode: Node<InfoNodeData>,
	connectedNodesIds: string[],
	allNodes: Node<InfoNodeData>[]
) => {
	return allNodes
		.filter(
			(node) =>
				!connectedNodesIds.includes(node.id) && node.id !== mousedNode.id
		)
		.map((node) => node.id);
};

export const getEdgesForDimm = (
	connectedEdgesIds: string[],
	allEdges: Edge[]
) => {
	const edgesToDimm = allEdges
		.filter((edge) => !connectedEdgesIds.includes(edge.id))
		.map((edge) => edge.id);

	return edgesToDimm;
};

export const dimNodes =
	(nodeIdsToHighlightOrDimm: string[], isDimmed: boolean) =>
	(oldNodes: Node<InfoNodeData>[]): Node<InfoNodeData>[] => {
		const updatedNodes = oldNodes.map((node) => {
			if (nodeIdsToHighlightOrDimm.includes(node.id)) {
				return {
					...node,
					data: { ...node.data, isDimmed }
				};
			}

			return node;
		});

		return updatedNodes;
	};

export const dimEdges =
	(edgeIdsToHighlightOrDimm: string[], isDimmed: boolean) =>
	(oldEdges: Edge[]): Edge[] => {
		const updatedNodes = oldEdges.map((edge) => {
			if (edgeIdsToHighlightOrDimm.includes(edge.id)) {
				const initialEdge = initialEdges.find(
					(initialEdge) => edge.id === initialEdge.id
				) as Edge;
				const initialColor = initialEdge?.style?.stroke as string;

				const color = isDimmed ? '#42467333' : initialColor;

				return {
					...edge,
					style: { stroke: color },
					markerEnd: { type: MarkerType.ArrowClosed, color }
				};
			}

			return edge;
		});

		return updatedNodes;
	};
