/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode } from 'react';

type GetBlockProps<Key, Value> = Extract<Value, { type: Key }>;

export type GetBlocksMap<Blocks extends { type: string }> = {
	[key in Blocks['type']]: (props: GetBlockProps<key, Blocks>) => ReactNode;
};

export * from './blocks';
export * from './models';
