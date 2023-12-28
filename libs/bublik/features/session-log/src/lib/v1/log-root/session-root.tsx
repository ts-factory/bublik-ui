/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RootBlockSchema, RootBlock, GetBlocksMap } from '@/shared/types';

import { BlockLogPage } from '../log-block-picker';

const blocksMap: GetBlocksMap<RootBlock['root'][number]> = {
	'te-log': BlockLogPage
};

export interface SessionBlockPickerProps {
	blocks: RootBlock['root'];
}

export const SessionBlockPicker = ({ blocks }: SessionBlockPickerProps) => {
	return (
		<>
			{blocks.map((block, idx) => {
				const Block = blocksMap[block.type];

				return <Block key={`${block.type}_${idx}`} {...block} />;
			})}
		</>
	);
};

export interface SessionRootProps {
	root: RootBlock;
}

export const SessionRoot = ({ root }: SessionRootProps) => {
	if (!RootBlockSchema.parse(root)) {
		return <div>Not valid schema!</div>;
	}

	return <SessionBlockPicker blocks={root.root} />;
};
