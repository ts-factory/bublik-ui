/* SPDX-License-Identifier: Apache-2.0 */
import { useWatch } from 'react-hook-form';

import { Checkbox, RadioGroup, RadioGroupItemWithLabel } from '@/shared/tailwind-ui';

import type { ClassifyForm } from './classify-form';
import {
	PRESETS,
	applyMutualExclusion,
	presetForFlags,
	type MatchFlags
} from './match-scope.utils';

function writeFlags(form: ClassifyForm, flags: MatchFlags) {
	form.setValue('matchParameters', flags.matchParameters, { shouldDirty: true });
	form.setValue('matchVerdicts', flags.matchVerdicts, { shouldDirty: true });
	form.setValue('matchImportantTags', flags.matchImportantTags, {
		shouldDirty: true
	});
	form.setValue('matchAllTags', flags.matchAllTags, { shouldDirty: true });
}

export function MatchScope({ form }: { form: ClassifyForm }) {
	const flags = useWatch({
		control: form.control,
		name: ['matchParameters', 'matchVerdicts', 'matchImportantTags', 'matchAllTags']
	});
	const current: MatchFlags = {
		matchParameters: flags[0],
		matchVerdicts: flags[1],
		matchImportantTags: flags[2],
		matchAllTags: flags[3]
	};
	const preset = presetForFlags(current);

	const toggle = (key: keyof MatchFlags, checked: boolean) => {
		writeFlags(form, applyMutualExclusion({ ...current, [key]: checked }, key));
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<span className="text-[0.8125rem] font-semibold">Match scope</span>
				<p className="text-xs text-text-menu">
					A classification auto-applies to future results that match the test
					path plus the dimensions below.
				</p>
			</div>

			<RadioGroup
				value={preset === 'Custom' ? '' : preset}
				onValueChange={(label) => {
					const hit = PRESETS.find((p) => p.label === label);
					if (hit) writeFlags(form, hit.flags);
				}}
				className="flex flex-col gap-1.5"
			>
				{PRESETS.map((p) => (
					<RadioGroupItemWithLabel
						key={p.label}
						id={`preset-${p.label}`}
						value={p.label}
						label={p.label}
					/>
				))}
			</RadioGroup>

			<div className="flex flex-col gap-2 pt-2 border-t border-border-primary">
				<span className="text-xs font-semibold text-text-menu">
					Advanced ({preset})
				</span>
				<div className="flex items-center gap-2 opacity-60">
					<Checkbox checked disabled />
					<span className="text-sm">Test path (always)</span>
				</div>
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<Checkbox
						checked={current.matchParameters}
						onCheckedChange={(c) => toggle('matchParameters', c === true)}
					/>
					Parameters
				</label>
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<Checkbox
						checked={current.matchVerdicts}
						onCheckedChange={(c) => toggle('matchVerdicts', c === true)}
					/>
					Verdicts
				</label>
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<Checkbox
						checked={current.matchImportantTags}
						onCheckedChange={(c) => toggle('matchImportantTags', c === true)}
					/>
					Important tags
				</label>
				<label className="flex items-center gap-2 text-sm cursor-pointer">
					<Checkbox
						checked={current.matchAllTags}
						onCheckedChange={(c) => toggle('matchAllTags', c === true)}
					/>
					All tags
				</label>
			</div>
		</div>
	);
}
