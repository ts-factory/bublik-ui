/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	ComponentPropsWithRef,
	CSSProperties,
	forwardRef,
	ReactNode,
	Ref
} from 'react';

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
	trailing?: ReactNode;
	hideExpander?: boolean;
}

function _TableNode(props: TableNodeProps, ref: Ref<HTMLButtonElement>) {
	const {
		nodeName,
		nodeType,
		isExpanded,
		depth,
		trailing,
		hideExpander,
		...restProps
	} = props;

	const expander = (
		<Icon
			name="ArrowShortSmall"
			className={cn(
				'grid place-items-center',
				hideExpander && 'invisible',
				isExpanded && 'text-primary',
				isExpanded ? 'rotate-360' : '-rotate-90'
			)}
		/>
	);

	if (trailing) {
		return (
			<div className="flex items-center gap-1">
				<button
					className="flex items-center w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap hover:text-primary"
					style={getPaddingStyle(depth)}
					{...restProps}
					ref={ref}
				>
					{expander}

					<div className="grid place-items-center">{getIcon(nodeType)}</div>
					<span className="truncate">{nodeName}</span>
				</button>
				{trailing}
			</div>
		);
	}

	return (
		<button
			className="flex items-center w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap hover:text-primary"
			style={getPaddingStyle(depth)}
			{...restProps}
			ref={ref}
		>
			{expander}

			<div className="grid place-items-center">{getIcon(nodeType)}</div>
			<span className="truncate">{nodeName}</span>
			{trailing}
		</button>
	);
}

export const TableNode = forwardRef(_TableNode);
