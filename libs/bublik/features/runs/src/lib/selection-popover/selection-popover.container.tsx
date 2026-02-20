/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC, useCallback, useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { useGetRunDetailsQuery } from '@/services/bublik-api';
import { useNavigateWithProject } from '@/bublik/features/projects';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import { parseDetailDate } from '@/shared/utils';

import { useRunsSelection } from '../hooks';
import { useRunsSidebarState } from '../sidebar';
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
	const { data, isLoading, isError, error } = useGetRunDetailsQuery(runId);

	const handleRemove = () => removeSelection(runId);

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
	const location = useLocation();
	const navigateWithProject = useNavigateWithProject();
	const { compareIds, resetSelect } = useRunsSelection();
	const { lastListUrl } = useRunsSidebarState();
	const [shouldRedirectToRuns, setShouldRedirectToRuns] = useState(false);

	const handleResetClick = useCallback(() => {
		const isComparePage = !!matchPath('/compare', location.pathname);
		const isMultiplePage = !!matchPath('/multiple', location.pathname);

		if (isComparePage || isMultiplePage) {
			setShouldRedirectToRuns(true);
		}

		resetSelect();
	}, [location.pathname, resetSelect]);

	useEffect(() => {
		if (!shouldRedirectToRuns || compareIds.length > 0) {
			return;
		}

		navigateWithProject(lastListUrl || '/runs', { replace: true });
		setShouldRedirectToRuns(false);
	}, [compareIds.length, lastListUrl, navigateWithProject, shouldRedirectToRuns]);

	return (
		<SelectionPopover
			compareIds={compareIds}
			onResetClick={handleResetClick}
			renderItem={(runId) => <SelectedResultItemContainer runId={runId} />}
		/>
	);
};
