/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { ResultIssueRef } from '@/shared/types';

import { ResultIssueBadges } from '@/bublik/features/result-classification';

export interface IssueBadgesProps {
	issues?: ResultIssueRef[];
}

/** Issue key + category badges for classifications stamped on a result,
 * shown under the obtained result. Rendering itself lives in the
 * result-classification lib — this wrapper only keeps the history column
 * API stable. */
export function IssueBadges({ issues }: IssueBadgesProps) {
	return <ResultIssueBadges issues={issues} />;
}
