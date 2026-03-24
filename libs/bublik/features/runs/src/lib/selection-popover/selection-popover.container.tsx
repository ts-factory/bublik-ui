/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

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
	const { compareIds, removeSelection } = useRunsSelection();
	const { data, isLoading, isError, error } = useGetRunDetailsQuery(runId);

	const handleRemove = () => {
		removeSelection(runId);
		trackEvent(analyticsEventNames.runsRowSelectionChange, {
			action: 'remove',
			selectionCount: Math.max(compareIds.length - 1, 0),
			source: 'selection_popover'
		});
	};

	if (isLoading) return <Skeleton className="h-[54px] rounded" />;

	if (isError) {
		return (
			<BublikErrorState
				error={error}
				className="h-[54px] rounded-md border border-border-primary"
				iconSize={16}
			/>
		);
	}

	if (!data) {
		return (
			<BublikEmptyState
				title="No data"
				description="Run details are unavailable"
				className="h-[54px] rounded-md border border-border-primary"
				contentClassName="px-2"
				hideIcon
				titleClassName="mt-0 text-xs"
				descriptionClassName="text-xs"
			/>
		);
	}

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

	const handleResetClick = () => {
		resetSelect();
		trackEvent(analyticsEventNames.runsSelectionReset, {
			selectionCount: 0,
			source: 'selection_popover'
		});
	};

	const handleCompareClick = () => {
		trackEvent(analyticsEventNames.runsSelectionAction, {
			action: 'compare',
			selectionCount: compareIds.length
		});
	};

	const handleMultipleClick = () => {
		trackEvent(analyticsEventNames.runsSelectionAction, {
			action: 'multiple',
			selectionCount: compareIds.length
		});
	};

	return (
		<SelectionPopover
			compareIds={compareIds}
			onResetClick={handleResetClick}
			onCompareClick={handleCompareClick}
			onMultipleClick={handleMultipleClick}
			renderItem={(runId) => <SelectedResultItemContainer runId={runId} />}
		/>
	);
};
