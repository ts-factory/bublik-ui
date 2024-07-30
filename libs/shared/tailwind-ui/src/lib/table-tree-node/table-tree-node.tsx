/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, CSSProperties, forwardRef } from 'react';

import { NodeEntity } from '@/shared/types';

import { cn } from '../utils';
import { Icon } from '../icon';

const getPaddingStyle = (depth: number): CSSProperties => ({
	paddingLeft: `${depth * 1}rem`,
	height: 34
});

const getIcon = (entity: NodeEntity) => {
	switch (entity) {
		case NodeEntity.Package:
			return <Icon name="Folder" size={16} />;
		case NodeEntity.Session:
			return <Icon name="Folder" size={16} />;
		case NodeEntity.Suite:
			return <Icon name="Folder" size={16} />;
		case NodeEntity.Test:
			return <Icon name="Paper" size={16} />;
		default:
			return <Icon name="Paper" size={16} />;
	}
};

export interface TableNodeProps extends ComponentPropsWithRef<'button'> {
	nodeName: string;
	nodeType: NodeEntity;
	isExpanded?: boolean;
	depth: number;
}

export const TableNode = forwardRef<HTMLButtonElement, TableNodeProps>(
	({ nodeName, nodeType, isExpanded, depth, ...props }, ref) => {
		return (
			<button
				className="flex items-center w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap hover:text-primary"
				style={getPaddingStyle(depth)}
				{...props}
				ref={ref}
			>
				<Icon
					name="ArrowShortSmall"
					className={cn(
						'grid place-items-center',
						isExpanded && 'text-primary',
						isExpanded ? 'rotate-360' : '-rotate-90'
					)}
				/>

				<div className="grid place-items-center">{getIcon(nodeType)}</div>
				<span className="truncate">{nodeName}</span>
			</button>
		);
	}
);
