/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LogEntityListBlock } from '@/shared/types';
import {
	BadgeVariants,
	badgeBaseStyles,
	badgeVariantStyles,
	cn
} from '@/shared/tailwind-ui';

import { textStyle } from '../log-meta/styles';

export interface EntityDisplayProps {
	entity: LogEntityListBlock['items'][number]['entity'];
	id: LogEntityListBlock['items'][number]['id'];
	name: LogEntityListBlock['items'][number]['name'];
	error: LogEntityListBlock['items'][number]['error'];
	result: LogEntityListBlock['items'][number]['result'];
}

export const EntityDisplay = (props: EntityDisplayProps) => {
	const { entity, error, id, name, result } = props;

	return (
		<tr className="border-b border-border-primary last:border-0">
			<td className="py-1 pr-2">
				<span className={textStyle({ bold: true })}>{entity}</span>
			</td>
			<td className="py-1 pr-2">
				<span className={textStyle()}>{id}</span>
			</td>
			<td className="py-1 pr-2">
				<span className={textStyle({ bold: true })}>{name}</span>
			</td>
			<td className="py-1 pr-2">
				<span
					className={cn(
						badgeBaseStyles(),
						badgeVariantStyles({
							variant: error ? BadgeVariants.Unexpected : BadgeVariants.Expected
						})
					)}
				>
					{result}
				</span>
			</td>
			<td className="py-1">
				<span className={textStyle()}>{error}</span>
			</td>
		</tr>
	);
};

export type BlockLogEntityListProps = LogEntityListBlock;

export const BlockLogEntityList = (props: BlockLogEntityListProps) => {
	return (
		<div data-block-type={props.type} className="my-4">
			<table className="border-collapse">
				<tbody>
					{props.items.map((item) => (
						<EntityDisplay
							key={item.id}
							entity={item.entity}
							id={item.id}
							name={item.name}
							error={item.error}
							result={item.result}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
};
