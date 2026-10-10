/* SPDX-License-Identifier: Apache-2.0 */
import type { ClassifyMatcherOverride } from '@/shared/types';

/**
 * Which of the result's own dimensions the captured rule should be gated on.
 * The test path is always part of the match and has no flag.
 *
 * There used to be a fourth flag separating important tags from all tags. The
 * server no longer takes that instruction: `ResultViewSet.classify` captures
 * important **and** relevant tags together as its default, and the only way to
 * narrow it is to send the exact tag list — which the drawer does not have. One
 * honest toggle beats two that quietly did the same thing.
 */
export interface MatchFlags {
	matchParameters: boolean;
	matchVerdicts: boolean;
	matchTags: boolean;
}

export const DEFAULT_MATCH_FLAGS: MatchFlags = {
	matchParameters: true,
	matchVerdicts: true,
	matchTags: true
};

export interface Preset {
	label: string;
	flags: MatchFlags;
}

export const PRESETS: Preset[] = [
	{
		label: 'Path only',
		flags: { matchParameters: false, matchVerdicts: false, matchTags: false }
	},
	{
		label: 'Path + Verdicts',
		flags: { matchParameters: false, matchVerdicts: true, matchTags: false }
	},
	{
		label: 'Path + Parameters',
		flags: { matchParameters: true, matchVerdicts: false, matchTags: false }
	},
	{
		label: 'Path + Parameters + Verdicts',
		flags: { matchParameters: true, matchVerdicts: true, matchTags: false }
	},
	{
		label: 'Path + Parameters + Verdicts + Tags',
		flags: { matchParameters: true, matchVerdicts: true, matchTags: true }
	}
];

function flagsEqual(a: MatchFlags, b: MatchFlags): boolean {
	return (
		a.matchParameters === b.matchParameters &&
		a.matchVerdicts === b.matchVerdicts &&
		a.matchTags === b.matchTags
	);
}

export function presetForFlags(flags: MatchFlags): string {
	const hit = PRESETS.find((p) => flagsEqual(p.flags, flags));
	return hit ? hit.label : 'Custom';
}

export function chipsForFlags(flags: MatchFlags): string[] {
	const chips = ['Path'];
	if (flags.matchParameters) chips.push('Params');
	if (flags.matchVerdicts) chips.push('Verdicts');
	if (flags.matchTags) chips.push('Tags');
	return chips;
}

/**
 * Turn the flags into the `matcher` the classify endpoint understands.
 *
 * The endpoint reads each key with a default drawn from the result itself, so
 * an **absent** key means "capture this from the result" and a **present but
 * empty** one means "ignore this criterion". There is nothing to send for a
 * flag that is on, and nothing the client needs to know about the result's
 * actual parameters or verdicts to turn one off.
 *
 * All three on is the server's own default, so it sends no matcher at all.
 */
export function matcherForFlags(
	flags: MatchFlags
): ClassifyMatcherOverride | undefined {
	const matcher: ClassifyMatcherOverride = {};

	if (!flags.matchParameters) matcher.parameters = {};
	if (!flags.matchVerdicts) matcher.verdicts = [];
	if (!flags.matchTags) matcher.tags = [];

	return Object.keys(matcher).length ? matcher : undefined;
}

export function chipsForRule(rule: {
	parameters?: Record<string, string> | null;
	verdicts?: string[] | null;
	tags?: string[] | null;
}): string[] {
	const chips = ['Path'];
	if (Object.keys(rule.parameters ?? {}).length) chips.push('Params');
	if ((rule.verdicts ?? []).length) chips.push('Verdicts');
	if ((rule.tags ?? []).length) chips.push('Tags');
	return chips;
}
