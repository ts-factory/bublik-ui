/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LogEntityListBlock } from '@/shared/types';

import { EntityDisplay } from '../log-meta';

export type BlockLogEntityListProps = LogEntityListBlock;

export const BlockLogEntityList = (props: BlockLogEntityListProps) => {
	return (
		<ul data-block-type={props.type} className="flex flex-col gap-1 my-4">
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
		</ul>
	);
};
