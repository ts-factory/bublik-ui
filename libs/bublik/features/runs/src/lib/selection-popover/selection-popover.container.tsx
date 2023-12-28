/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { useGetRunDetailsQuery } from '@/services/bublik-api';

import { parseDetailDate } from '@/shared/utils';

import { useRunsSelection } from '../hooks';
import {
	SelectedResultItem,
	SelectionPopover
} from './selection-popover.component';

import { Skeleton } from '@/shared/tailwind-ui';

export interface SelectedResultItemContainerProps {
	runId: string;
}

export const SelectedResultItemContainer: FC<
	SelectedResultItemContainerProps
> = ({ runId }) => {
	const { removeSelection } = useRunsSelection();
	const { data, isLoading, isError } = useGetRunDetailsQuery(runId);

	const handleRemove = () => removeSelection(runId);

	if (isLoading) return <Skeleton className="h-[54px] rounded" />;

	if (isError) {
		return (
			<div className="h-[32px] border border-border-primary">
				Something went wrong...
			</div>
		);
	}

	if (!data) return <div>No data!</div>;

	const { main_package, conclusion, start } = data;

	return (
		<SelectedResultItem
			name={main_package}
			status={conclusion}
			start={parseDetailDate(start)}
			onRemoveClick={handleRemove}
		/>
	);
};

export const SelectionPopoverContainer = () => {
	const { compareIds, resetSelect } = useRunsSelection();

	return (
		<SelectionPopover
			compareIds={compareIds}
			onResetClick={resetSelect}
			renderItem={(runId) => <SelectedResultItemContainer runId={runId} />}
		/>
	);
};
