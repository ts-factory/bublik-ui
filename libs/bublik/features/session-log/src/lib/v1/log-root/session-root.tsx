/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { RootBlockSchema, RootBlock, GetBlocksMap } from '@/shared/types';
import { Skeleton } from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';

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
	const parseResult = RootBlockSchema.safeParse(root);

	if (!parseResult.success) {
		return (
			<BublikErrorState
				error={{
					status: 400,
					title: 'Invalid log schema',
					description: 'Log payload has unsupported format'
				}}
			/>
		);
	}

	return <SessionBlockPicker blocks={parseResult.data.root} />;
};

export function SessionLoading() {
	return (
		<div className="p-6 space-y-6">
			{/* Header Section */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-64 rounded-md" />
					<Skeleton className="h-6 w-20 rounded-md" />
				</div>

				<div className="space-y-2">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="flex items-center gap-2">
							<Skeleton className="h-4 w-4 rounded-md" />
							<Skeleton className="h-4 w-64 rounded-md" />
						</div>
					))}
				</div>
			</div>

			{/* Parameters Section */}
			<div className="space-y-4">
				<div className="flex justify-between items-center">
					<Skeleton className="h-6 w-32 rounded-md" />
					<Skeleton className="h-6 w-20 rounded-md" />
				</div>

				<div className="border rounded-lg">
					<div className="grid grid-cols-2 bg-muted p-3">
						<div>
							<Skeleton className="h-4 w-24 rounded-md" />
						</div>
						<div>
							<Skeleton className="h-4 w-24 rounded-md" />
						</div>
					</div>
					<div className="divide-y">
						{[1, 2, 3].map((i) => (
							<div key={i} className="grid grid-cols-2 p-3">
								<div>
									<Skeleton className="h-4 w-24 rounded-md" />
								</div>
								<div>
									<Skeleton className="h-4 w-48 rounded-md" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Test Log Section */}
			<div className="space-y-4">
				<Skeleton className="h-6 w-32 rounded-md" />

				{/* Filters */}
				<div className="flex items-center gap-4 flex-wrap">
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-24 rounded-md" />
						<div className="flex gap-1">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-8 w-8 rounded-md" />
							))}
						</div>
					</div>

					<div className="flex gap-2">
						{[1, 2, 3, 4].map((i) => (
							<Skeleton key={i} className="h-8 w-24 rounded-md" />
						))}
					</div>
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-20 rounded-md" />
							<Skeleton className="h-6 w-24 rounded-md" />
						</div>
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-24 rounded-md" />
							<Skeleton className="h-6 w-24 rounded-md" />
						</div>
					</div>
					<div className="flex gap-2">
						<div className="px-3 py-1 border rounded">
							<Skeleton className="h-4 w-20 rounded-md" />
						</div>
						<div className="px-3 py-1 border rounded">
							<Skeleton className="h-4 w-20 rounded-md" />
						</div>
					</div>
				</div>

				{/* Log Table */}
				<div className="border rounded-lg">
					<div className="grid grid-cols-6 bg-gray-50 border-b border-border-primary p-3">
						{[
							'No.',
							'Level',
							'Entity Name',
							'User Name',
							'Timestamp',
							'Log Content'
						].map((header) => (
							<div key={header}>
								<Skeleton className="h-4 w-24 rounded-md" />
							</div>
						))}
					</div>
					<div className="divide-y">
						{Array.from({ length: 10 }).map((_, i) => (
							<div key={i} className="grid grid-cols-6 p-3">
								<div>
									<Skeleton className="h-4 w-8 rounded-md" />
								</div>
								<div>
									<Skeleton className="h-4 w-16 rounded-md" />
								</div>
								<div>
									<Skeleton className="h-4 w-32 rounded-md" />
								</div>
								<div>
									<Skeleton className="h-4 w-24 rounded-md" />
								</div>
								<div>
									<Skeleton className="h-4 w-24 rounded-md" />
								</div>
								<div>
									<Skeleton className="h-4 w-full rounded-md" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
