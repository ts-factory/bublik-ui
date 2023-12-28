/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EdgeProps, getSmoothStepPath, Position } from 'reactflow';

const getTargetOffset = (target: number, position: Position): number => {
	const offsets: Record<Position, number> = {
		[Position.Top]: 4,
		[Position.Bottom]: -4,
		[Position.Left]: 0,
		[Position.Right]: 0
	};

	return offsets[position] + target;
};

const getSourceYOffset = (targetY: number, position: Position): number => {
	const offsets: Record<Position, number> = {
		[Position.Top]: 4,
		[Position.Bottom]: -4,
		[Position.Left]: 0,
		[Position.Right]: 0
	};

	return offsets[position] + targetY;
};

const getSourceXOffset = (targetX: number, position: Position): number => {
	const offsets: Record<Position, number> = {
		[Position.Top]: 0,
		[Position.Bottom]: 0,
		[Position.Left]: 4,
		[Position.Right]: -4
	};

	return offsets[position] + targetX;
};

export const SmoothCustomEdge = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd
}: EdgeProps) => {
	const [path] = getSmoothStepPath({
		sourceX: getSourceXOffset(sourceX, sourcePosition),
		sourceY: getSourceYOffset(sourceY, sourcePosition),
		sourcePosition,
		targetX: getTargetOffset(targetX, targetPosition),
		targetY: getTargetOffset(targetY, targetPosition),
		targetPosition
	});

	return (
		<path
			id={id}
			style={style}
			className="react-flow__edge-path"
			d={path}
			markerEnd={markerEnd}
		/>
	);
};
