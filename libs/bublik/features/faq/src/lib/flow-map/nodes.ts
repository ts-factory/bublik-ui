/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Node, Edge, MarkerType } from 'reactflow';

import { InfoNodeData } from './info-node';

export const initialNodes: Node<InfoNodeData>[] = [
	{
		id: 'dashboard-node',
		type: 'infoNode',
		data: {
			label: 'Dashboard page',
			description:
				'Table of the freshest runs showing its metadata, total/unexpected results amount.',
			list: ['1 session = row table']
		},
		position: { x: 0, y: -50 }
	},
	{
		id: 'run-node',
		type: 'infoNode',
		data: {
			label: 'Run page',
			description: "Main run's page with detailed info about the run.",
			list: ['Tree with tests']
		},
		position: { x: 0, y: 180 }
	},
	{
		id: 'runs-node',
		type: 'infoNode',
		data: {
			label: 'Runs page',
			description:
				'Table of all runs showing its start/finish dates, overall results stats, tags and allowing filtering by them.',
			list: ['1 session = row table']
		},
		position: { x: 170, y: 350 }
	},
	{
		id: 'log-node',
		type: 'infoNode',
		data: {
			label: 'Log page',
			description: 'Tests tree with its logs and context.',
			list: ['Logs for each test']
		},
		position: { x: 426, y: 189 }
	},
	{
		id: 'history-node',
		type: 'infoNode',
		data: {
			label: 'History page',
			description:
				'Table of iterations with multi-option filter. Can build comparison graph based on the results.',
			list: ['Results of tests']
		},
		position: { x: 460, y: 450 }
	},
	{
		id: 'source-node',
		type: 'infoNode',
		data: {
			label: 'Source',
			description: 'External link the session was imported',
			isExternal: true
		},
		position: { x: 750, y: 100 }
	},
	{
		id: 'measurement-node',
		type: 'infoNode',
		data: {
			label: 'Measurement page',
			description: 'Measurements on an iteration as table and line graph.'
		},
		position: { x: 900, y: 600 }
	}
];

type EdgeConfig = Edge & {
	variant: 'primary' | 'secondary';
};

const createEdge = (config: EdgeConfig) => {
	const color = config.variant === 'primary' ? '#424673' : '#c7c9dd';

	return {
		style: { stroke: color },
		markerEnd: { type: MarkerType.ArrowClosed, color },
		...config
	};
};

export const initialEdges: EdgeConfig[] = [
	// Dashboard edges
	createEdge({
		variant: 'primary',
		id: 'dashboard-run',
		source: 'dashboard-node',
		target: 'run-node',
		sourceHandle: 'bottom-50',
		targetHandle: 'top-50',
		type: 'smooth-custom-edge'
	}),
	createEdge({
		variant: 'primary',
		id: 'dashboard-log',
		source: 'dashboard-node',
		target: 'log-node',
		sourceHandle: 'right-60',
		targetHandle: 'top-50',
		type: 'smooth-custom-edge'
	}),
	createEdge({
		variant: 'primary',
		id: 'dashboard-source',
		source: 'dashboard-node',
		target: 'source-node',
		sourceHandle: 'right-30',
		targetHandle: 'top-50',
		type: 'smooth-custom-edge'
	}),
	// Run edges
	createEdge({
		variant: 'primary',
		id: 'run-log',
		source: 'run-node',
		target: 'log-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'right-50',
		targetHandle: 'left-50'
	}),
	createEdge({
		variant: 'primary',
		id: 'log-run',
		source: 'log-node',
		target: 'run-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'left-50',
		targetHandle: 'right-50'
	}),
	createEdge({
		variant: 'primary',
		id: 'run-source',
		source: 'run-node',
		target: 'source-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'top-60',
		targetHandle: 'left-40'
	}),
	// // Runs edges
	createEdge({
		variant: 'primary',
		id: 'runs-run',
		source: 'runs-node',
		target: 'run-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'left-50',
		targetHandle: 'bottom-50'
	}),
	createEdge({
		variant: 'primary',
		id: 'runs-log',
		source: 'runs-node',
		target: 'log-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'right-50',
		targetHandle: 'bottom-50'
	}),
	createEdge({
		variant: 'primary',
		id: 'history-log',
		source: 'history-node',
		target: 'log-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'top-50',
		targetHandle: 'bottom-70'
	}),
	createEdge({
		variant: 'primary',
		id: 'log-history',
		source: 'log-node',
		target: 'history-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'bottom-70',
		targetHandle: 'top-50'
	}),
	// // history-runs
	createEdge({
		variant: 'primary',
		id: 'history-run',
		source: 'history-node',
		target: 'run-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'left-50',
		targetHandle: 'bottom-30'
	}),
	createEdge({
		variant: 'primary',
		id: 'run-history',
		source: 'run-node',
		target: 'history-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'bottom-30',
		targetHandle: 'left-50'
	}),
	createEdge({
		variant: 'primary',
		id: 'source-log',
		source: 'source-node',
		target: 'log-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'bottom-50',
		targetHandle: 'right-30'
	}),
	createEdge({
		variant: 'primary',
		id: 'measurement-source',
		source: 'measurement-node',
		target: 'source-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'top-50',
		targetHandle: 'right-50'
	}),
	// OPTIONAL
	createEdge({
		variant: 'secondary',
		id: 'measurement-log',
		source: 'measurement-node',
		target: 'log-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'left-20',
		targetHandle: 'right-60'
	}),
	createEdge({
		variant: 'secondary',
		id: 'log-measurement',
		source: 'log-node',
		target: 'measurement-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'right-60',
		targetHandle: 'left-20'
	}),
	createEdge({
		variant: 'secondary',
		id: 'measurement-history',
		source: 'measurement-node',
		target: 'history-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'left-50',
		targetHandle: 'bottom-50'
	}),
	createEdge({
		variant: 'secondary',
		id: 'history-measurement',
		source: 'history-node',
		target: 'measurement-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'bottom-50',
		targetHandle: 'left-50'
	}),
	createEdge({
		variant: 'secondary',
		id: 'run-measurement',
		source: 'run-node',
		target: 'measurement-node',
		type: 'smooth-custom-edge',
		sourceHandle: 'bottom-10',
		targetHandle: 'left-80'
	})
];
