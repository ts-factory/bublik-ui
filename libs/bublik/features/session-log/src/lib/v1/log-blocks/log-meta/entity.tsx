/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	BadgeVariants,
	badgeBaseStyles,
	badgeVariantStyles,
	cn
} from '@/shared/tailwind-ui';

import { LogHeaderBlock } from '@/shared/types';
import { textStyle } from './styles';

export interface EntityDisplayProps {
	entity: LogHeaderBlock['entity_model']['entity'];
	id: LogHeaderBlock['entity_model']['id'];
	name: LogHeaderBlock['entity_model']['name'];
	error: LogHeaderBlock['entity_model']['error'];
	result: LogHeaderBlock['entity_model']['result'];
}

export const EntityDisplay = (props: EntityDisplayProps) => {
	const { entity, error, id, name, result } = props;

	return (
		<div className="flex items-center">
			<span className={textStyle({ bold: true })}>{entity}</span>
			&nbsp;
			<span className={textStyle()}>{id}:</span>
			&nbsp;
			<span className={textStyle({ bold: true })}>{name}:</span>
			&nbsp; &#8212; &nbsp;
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
			&nbsp;
			<span className={textStyle()}>{error}</span>
		</div>
	);
};
