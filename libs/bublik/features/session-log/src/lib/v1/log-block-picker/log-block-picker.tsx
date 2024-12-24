/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { GetBlocksMap, LogPageBlock } from '@/shared/types';
import { BlockLogMeta, BlockLogEntityList, BlockLogTable } from '../log-blocks';
import {
	LogTablePaginationContext,
	LogTablePaginationContextProvider
} from '../log-blocks/log-table/log-table.context';

const logBlocksMap = {
	'te-log-meta': BlockLogMeta,
	'te-log-entity-list': BlockLogEntityList,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	'te-log-table': BlockLogTable
} satisfies GetBlocksMap<LogPageBlock['content'][number]>;

export type BlockLogPageProps = LogPageBlock;

export const BlockLogPage = (props: BlockLogPageProps) => {
	const pagination = useMemo<LogTablePaginationContext['pagination']>(() => {
		if (!props.pagination) return undefined;

		return {
			state: { pageIndex: props.pagination?.cur_page - 1, pageSize: 1 },
			totalCount: props.pagination.pages_count
		};
	}, [props.pagination]);

	return (
		<LogTablePaginationContextProvider pagination={pagination}>
			<div className="mb-[40vh] [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-border-primary [&>*]:mb-6 [&>*]:pb-4 font-mono">
				{props.content.map((block, idx) => {
					const Block = logBlocksMap[block.type];

					return (
						<Block
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							key={`${block.type}_${idx}`}
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							id={idx.toString()}
							{...block}
						/>
					);
				})}
			</div>
		</LogTablePaginationContextProvider>
	);
};
