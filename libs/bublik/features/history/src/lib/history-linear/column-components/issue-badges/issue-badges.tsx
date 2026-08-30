/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback } from 'react';

import type { IssueCategory, ResultIssueRef } from '@/shared/types';
import { ResultIssueBadges } from '@/bublik/features/result-classification';

import { useHistoryFormSearchState } from '../../../slice';

export interface IssueBadgesProps {
	issues?: ResultIssueRef[];
	/** Drives the effect chip, and whether an unstamped row reads Untriaged. */
	hasError: boolean;
	/** The result the row describes, so it can be classified from here. */
	resultId: number;
	/**
	 * The row's own project. History spans projects, so this cannot be left to
	 * the `?project=` selector: a rule filed against the wrong project matches
	 * nothing and looks like a broken classify.
	 */
	projectId?: number;
}

/**
 * Classification of a result, shown under its obtained result.
 *
 * Rendering lives in the result-classification lib; what this adds is the
 * history page's filter wiring. Clicking a category chip toggles it exactly as
 * ticking the box in Edit Search would — the same submit path, so the page
 * resets to 1 and refetches. It cannot reuse the `onBadgeClick` helper the tag
 * and verdict chips use: those write the table's client-side `globalFilter`,
 * while `categories` is a query param the backend filters on.
 */
export function IssueBadges({
	issues,
	hasError,
	resultId,
	projectId
}: IssueBadgesProps) {
	const { form, handleGlobalSearchSubmit } = useHistoryFormSearchState();
	const selectedCategories = form.categories ?? [];

	const handleCategoryClick = useCallback(
		(category: IssueCategory) => {
			const selected = form.categories ?? [];

			handleGlobalSearchSubmit({
				...form,
				categories: selected.includes(category)
					? selected.filter((c) => c !== category)
					: [...selected, category]
			});
		},
		[form, handleGlobalSearchSubmit]
	);

	return (
		<ResultIssueBadges
			issues={issues}
			hasError={hasError}
			resultId={resultId}
			projectId={projectId}
			selectedCategories={selectedCategories}
			onCategoryClick={handleCategoryClick}
			withSeparator
		/>
	);
}
