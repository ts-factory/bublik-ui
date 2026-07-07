/* SPDX-License-Identifier: Apache-2.0 */

export interface ExpectedBadge {
	variant: 'expected' | 'unexpected' | 'transparent';
	label: string;
}

/** Disposition badge for a tri-state expected flag.
 * true = expected (green), false = unexpected (red), null = none (neutral). */
export function expectedBadge(
	expected: boolean | null | undefined
): ExpectedBadge {
	if (expected === true) return { variant: 'expected', label: 'Expected' };
	if (expected === false) return { variant: 'unexpected', label: 'Unexpected' };
	return { variant: 'transparent', label: 'None' };
}
