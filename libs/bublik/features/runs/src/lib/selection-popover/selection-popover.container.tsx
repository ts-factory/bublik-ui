/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useCallback, useEffect, useState } from 'react';
import { linkOptions } from '@tanstack/react-router';

import { matchRoutePath, useRenderedLocation } from '@/router';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { useRouterNavigateWithProject } from '@/bublik/features/projects';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { Skeleton, useSelectionPopoverOpenState } from '@/shared/tailwind-ui';
import { parseDetailDate } from '@/shared/utils';

import { useRunsSelection } from '../hooks';
import { useRunsSidebarState } from '../sidebar';
import { RUNS_SELECTION_POPOVER_STORAGE_KEY } from './selection-popover.constants';
import {
	SelectedResultItem,
	SelectionPopover
} from './selection-popover.component';
export interface SelectedResultItemContainerProps {
	runId: string;
}

export const SelectedResultItemContainer: FC<
	SelectedResultItemContainerProps
> = ({ runId }) => {
	const { compareIds, removeSelection } = useRunsSelection();
	const { data, isLoading, isError, error } = useGetRunDetailsQuery(runId);
	const { resetOpenState } = useSelectionPopoverOpenState(
		RUNS_SELECTION_POPOVER_STORAGE_KEY
	);

	const handleRemove = () => {
		if (compareIds.length === 1) {
			resetOpenState();
		}
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

const RUNS = linkOptions({ to: '/runs' }).to;

export const SelectionPopoverContainer = () => {
	const { pathname } = useRenderedLocation();
	const navigateWithProject = useRouterNavigateWithProject();
	const { compareIds, resetSelect } = useRunsSelection();
	const { lastListUrl } = useRunsSidebarState();
	const [shouldRedirectToRuns, setShouldRedirectToRuns] = useState(false);

	const handleResetClick = useCallback(() => {
		const isComparePage = !!matchRoutePath({ to: '/compare' }, pathname);
		const isMultiplePage = !!matchRoutePath({ to: '/multiple' }, pathname);

		if (isComparePage || isMultiplePage) {
			setShouldRedirectToRuns(true);
		}

		resetSelect();
		trackEvent(analyticsEventNames.runsSelectionReset, {
			selectionCount: 0,
			source: 'selection_popover'
		});
	}, [pathname, resetSelect]);

	useEffect(() => {
		if (!shouldRedirectToRuns || compareIds.length > 0) {
			return;
		}

		// Back to the list the selection was made on, replacing the emptied page.
		navigateWithProject(lastListUrl || RUNS, { replace: true });
		setShouldRedirectToRuns(false);
	}, [
		compareIds.length,
		lastListUrl,
		navigateWithProject,
		shouldRedirectToRuns
	]);

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
