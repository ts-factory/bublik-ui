/* SPDX-License-Identifier: Apache-2.0 */
import type { IssueCategory } from '@/shared/types';

/** Display tag for an issue option: bug key, else category, else #id. */
export function issueTag(o: {
	id: number;
	key: string | null;
	category: IssueCategory | null;
}): string {
	return o.key ?? o.category ?? `#${o.id}`;
}
