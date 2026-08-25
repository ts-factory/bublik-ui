/* SPDX-License-Identifier: Apache-2.0 */

export interface ExpectedBadge {
	variant: 'expected' | 'unexpected' | 'triage';
	label: string;
}

/** Disposition badge for a tri-state expected flag.
 * true = expected (green), false = unexpected (red), null = none (violet).
 * Violet, not neutral: "nobody decided" must not look like "already handled". */
export function expectedBadge(
	expected: boolean | null | undefined
): ExpectedBadge {
	if (expected === true) return { variant: 'expected', label: 'Expected' };
	if (expected === false) return { variant: 'unexpected', label: 'Unexpected' };
	return { variant: 'triage', label: 'None' };
}
