/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Handle, HandleProps, Position, NodeProps } from 'reactflow';

import { cva } from '@/shared/tailwind-ui';

const range = (start: number, size: number, gap: number) => {
	return Array.from({ length: size }, (_, idx) => start * gap * idx);
};

const nodeStyles = cva({
	base: ['px-5', 'py-4', 'rounded-lg', 'max-w-[272px]', 'border'],
	variants: {
		isExternal: {
			true: 'border-transparent bg-[#ffdd86]',
			false: 'border-[#424673] bg-primary-wash'
		},
		isDimmed: { true: 'opacity-40' }
	},
	defaultVariants: { isExternal: false }
});

export type InfoNodeData = {
	label: string;
	description: string;
	list?: string[];
	isExternal?: boolean;
	isDimmed?: boolean;
};

export type HandlesProps = Pick<HandleProps, 'position' | 'type'> & {
	direction: 'left' | 'right' | 'bottom' | 'top';
};

const Handles = ({ position, type, direction }: HandlesProps) => {
	return (
		<>
			{range(1, 11, 10).map((percent) => (
				<Handle
					key={`${position}-${percent}`}
					type={type}
					position={position}
					id={`${position}-${percent}`}
					style={{
						backgroundColor: 'red',
						[direction]: `${percent}%`,
						opacity: 0
					}}
				/>
			))}
		</>
	);
};

export const InfoNode = ({ data }: NodeProps<InfoNodeData>) => {
	const { label, description, list, isExternal, isDimmed } = data;

	return (
		<div className={nodeStyles({ isExternal, isDimmed })}>
			<Handles type="target" position={Position.Top} direction="left" />
			<Handles type="target" position={Position.Bottom} direction="left" />
			<Handles type="target" position={Position.Left} direction="top" />
			<Handles type="target" position={Position.Right} direction="top" />

			<div>
				<h3 className="text-[0.75rem] font-bold leading-[1.125rem] text-[#424673] mb-2">
					{label}
				</h3>
				<p className="text-[0.75rem] font-normal leading-[1.125rem] text-[#424673] mb-1">
					{description}
				</p>
				{list && (
					<ul className="list-disc list-inside">
						{list.map((value) => (
							<li
								key={value}
								className="text-[0.75rem] font-normal leading-[1.125rem] text-[#424673]"
							>
								{value}
							</li>
						))}
					</ul>
				)}
			</div>
			<Handles type="source" position={Position.Top} direction="left" />
			<Handles type="source" position={Position.Bottom} direction="left" />
			<Handles type="source" position={Position.Left} direction="top" />
			<Handles type="source" position={Position.Right} direction="top" />
		</div>
	);
};
