/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ResultIssueRef } from '@/shared/types';

import { ResultIssueBadges } from '@/bublik/features/result-classification';

export interface IssueBadgesProps {
	issues?: ResultIssueRef[];
	/** Drives the effect chip, and whether an unstamped row reads Untriaged. */
	hasError: boolean;
}

/** Classification of a result, shown under its obtained result. Rendering
 * itself lives in the result-classification lib — this wrapper only keeps the
 * history column API stable. */
export function IssueBadges(props: IssueBadgesProps) {
	return <ResultIssueBadges {...props} withSeparator />;
}
