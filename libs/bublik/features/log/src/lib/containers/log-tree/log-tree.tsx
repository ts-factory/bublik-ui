/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useCallback, useMemo, useRef, useState } from 'react';

import { getErrorMessage, useGetTreeByRunIdQuery } from '@/services/bublik-api';
import {
	CardHeader,
	Icon,
	Skeleton,
	TooltipProvider
} from '@/shared/tailwind-ui';

import { getTreeOnlyWithErrors } from './utils';

import { TreeView } from './tree-view';
import { TreeHeader } from '../../components';
import { useLogPage } from '../../hooks';

export const TreeLoading = () => {
	return (
		<div className="flex flex-col flex-grow bg-white rounded-md">
			<CardHeader label="Tree">
				<div className="flex items-stretch h-full gap-2">
					<Skeleton className="w-[26px] h-full rounded-md max-w-[217px]" />
					<Skeleton className="w-[57px] h-full rounded-md max-w-[217px]" />
					<Skeleton className="w-[120px] h-full rounded-md max-w-[217px]" />
				</div>
			</CardHeader>
			<div className="flex flex-col w-full h-full gap-1 px-4 pt-1 overflow-hidden">
				{Array.from({ length: 45 }).map((_, idx) => (
					<Skeleton
						key={idx}
						className="flex-shrink-0 w-full h-[22px] rounded"
					/>
				))}
			</div>
		</div>
	);
};

export interface TreeErrorProps {
	error: unknown;
}

export const TreeError = ({ error = { status: 400 } }: TreeErrorProps) => {
	const { status, title, description } = getErrorMessage(error);

	return (
		<div className="flex items-center w-full h-full p-4">
			<div className="flex items-start gap-4">
				<Icon
					name="TriangleExclamationMark"
					size={36}
					className="flex-shrink-0 text-text-unexpected"
				/>
				<div>
					<h2 className="text-lg font-bold">
						{status} {title}
					</h2>
					<p className="text-base">{description}</p>
				</div>
			</div>
		</div>
	);
};

export interface TreeContainerProps {
	runId: string;
}

export const TreeContainer: FC<TreeContainerProps> = ({ runId }) => {
	const { focusId, isShowingRunLog, showRunLog } = useLogPage();
	const { data, isLoading, error } = useGetTreeByRunIdQuery(runId);
	const [showOnlyErrors, setShowOnlyErrors] = useState(false);

	const treeWithOnlyErrors = useMemo(() => {
		if (!data) return null;

		const treeOnlyWithErrors = getTreeOnlyWithErrors(data);

		if (!treeOnlyWithErrors) return null;

		return { ...data, tree: treeOnlyWithErrors };
	}, [data]);

	const scrollToFocusRef = useRef<(() => void) | undefined>();

	const handleScrollToFocusClick = useCallback(() => {
		scrollToFocusRef.current?.();
	}, []);

	const handleNokClick = useCallback(() => {
		setShowOnlyErrors((prev) => !prev);
	}, []);

	if (isLoading) return <TreeLoading />;

	if (error) {
		return (
			<div className="flex flex-col flex-grow bg-white rounded-md">
				<TreeHeader
					hasErrors={treeWithOnlyErrors !== null}
					isNokMode={showOnlyErrors}
					isShowingRunLog={isShowingRunLog}
					onScrollToFocusClick={handleScrollToFocusClick}
					onRunButtonClick={showRunLog}
					onNokClick={handleNokClick}
				/>
				<div className="w-full h-full">
					<TreeError error={error} />
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col flex-grow bg-white rounded-md">
			<TreeHeader
				hasErrors={treeWithOnlyErrors !== null}
				isNokMode={showOnlyErrors}
				isShowingRunLog={isShowingRunLog}
				onScrollToFocusClick={handleScrollToFocusClick}
				onRunButtonClick={showRunLog}
				onNokClick={handleNokClick}
			/>

			<div className="w-full h-full">
				<TooltipProvider disableHoverableContent>
					{data && !showOnlyErrors && (
						<TreeView
							data={data}
							itemSize={28}
							focusId={focusId?.toString() || data.mainPackage}
							ref={scrollToFocusRef}
						/>
					)}
					{data && treeWithOnlyErrors && showOnlyErrors && (
						<TreeView
							data={treeWithOnlyErrors}
							itemSize={28}
							focusId={focusId?.toString() || data.mainPackage}
							ref={scrollToFocusRef}
						/>
					)}
				</TooltipProvider>
			</div>
		</div>
	);
};
