/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback } from 'react';

import type { IssueCategory, ResultIssueRef } from '@/shared/types';
import { ResultIssueBadges } from '@/bublik/features/result-classification';

import { useHistoryFormSearchState } from '../../../slice';

export interface IssueBadgesProps {
	issues?: ResultIssueRef[];
}

/**
 * The issues behind a result, shown under its obtained result.
 *
 * Rendering lives in the result-classification lib; what this adds is the
 * history page's filter wiring. Clicking a category chip toggles it exactly as
 * ticking the box in Edit Search would — the same submit path, so the page
 * resets to 1 and refetches. It cannot reuse the `onBadgeClick` helper the tag
 * and verdict chips use: those write the table's client-side `globalFilter`,
 * while `categories` is a query param the backend filters on.
 *
 * The verdict chip needs none of that, so it is rendered straight from the lib
 * on the result's own line — see `ClassificationVerdict`. History offers no
 * Classify trigger at all; classifying is done from the run.
 */
export function IssueBadges({ issues }: IssueBadgesProps) {
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
			selectedCategories={selectedCategories}
			onCategoryClick={handleCategoryClick}
			withSeparator
		/>
	);
}
