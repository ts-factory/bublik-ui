/* SPDX-License-Identifier: Apache-2.0 */

export interface MatchFlags {
	matchParameters: boolean;
	matchVerdicts: boolean;
	matchImportantTags: boolean;
	matchAllTags: boolean;
}

export const DEFAULT_MATCH_FLAGS: MatchFlags = {
	matchParameters: true,
	matchVerdicts: true,
	matchImportantTags: true,
	matchAllTags: false
};

export interface Preset {
	label: string;
	flags: MatchFlags;
}

export const PRESETS: Preset[] = [
	{
		label: 'Path only',
		flags: {
			matchParameters: false,
			matchVerdicts: false,
			matchImportantTags: false,
			matchAllTags: false
		}
	},
	{
		label: 'Path + Verdicts',
		flags: {
			matchParameters: false,
			matchVerdicts: true,
			matchImportantTags: false,
			matchAllTags: false
		}
	},
	{
		label: 'Path + Parameters',
		flags: {
			matchParameters: true,
			matchVerdicts: false,
			matchImportantTags: false,
			matchAllTags: false
		}
	},
	{
		label: 'Path + Parameters + Verdicts',
		flags: {
			matchParameters: true,
			matchVerdicts: true,
			matchImportantTags: false,
			matchAllTags: false
		}
	},
	{
		label: 'Path + Parameters + Verdicts + Important tags',
		flags: {
			matchParameters: true,
			matchVerdicts: true,
			matchImportantTags: true,
			matchAllTags: false
		}
	},
	{
		label: 'Path + Parameters + Verdicts + All tags',
		flags: {
			matchParameters: true,
			matchVerdicts: true,
			matchImportantTags: false,
			matchAllTags: true
		}
	}
];

function flagsEqual(a: MatchFlags, b: MatchFlags): boolean {
	return (
		a.matchParameters === b.matchParameters &&
		a.matchVerdicts === b.matchVerdicts &&
		a.matchImportantTags === b.matchImportantTags &&
		a.matchAllTags === b.matchAllTags
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
	if (flags.matchImportantTags) chips.push('Important tags');
	if (flags.matchAllTags) chips.push('All tags');
	return chips;
}

export function applyMutualExclusion(
	flags: MatchFlags,
	changed: keyof MatchFlags
): MatchFlags {
	if (changed === 'matchAllTags' && flags.matchAllTags) {
		return { ...flags, matchImportantTags: false };
	}
	if (changed === 'matchImportantTags' && flags.matchImportantTags) {
		return { ...flags, matchAllTags: false };
	}
	return flags;
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
