/* SPDX-License-Identifier: Apache-2.0 */
import { useWatch } from 'react-hook-form';

import {
	Checkbox,
	RadioGroup,
	RadioGroupItemWithLabel
} from '@/shared/tailwind-ui';

import type { ClassifyForm } from '../classify/classify-form.types';
import { PRESETS, presetForFlags, type MatchFlags } from './match-scope.utils';

function writeFlags(form: ClassifyForm, flags: MatchFlags) {
	form.setValue('matchParameters', flags.matchParameters, {
		shouldDirty: true
	});
	form.setValue('matchVerdicts', flags.matchVerdicts, { shouldDirty: true });
	form.setValue('matchTags', flags.matchTags, { shouldDirty: true });
}

export function MatchScope({ form }: { form: ClassifyForm }) {
	const flags = useWatch({
		control: form.control,
		name: ['matchParameters', 'matchVerdicts', 'matchTags']
	});
	const current: MatchFlags = {
		matchParameters: flags[0],
		matchVerdicts: flags[1],
		matchTags: flags[2]
	};
	const preset = presetForFlags(current);

	const toggle = (key: keyof MatchFlags, checked: boolean) => {
		writeFlags(form, { ...current, [key]: checked });
	};

	return (
		// `pl-2`, as the section's headers and the fields' floating labels: the
		// text, the radios and the boxes all start on that one line.
		<div className="flex flex-col gap-4 pl-2">
			<p className="text-xs text-text-menu">
				A classification auto-applies to future results that match the test path
				plus the dimensions below.
			</p>

			<RadioGroup
				value={preset === 'Custom' ? '' : preset}
				onValueChange={(label) => {
					const hit = PRESETS.find((p) => p.label === label);
					if (hit) writeFlags(form, hit.flags);
				}}
				className="flex flex-col gap-2"
				data-testid="match-scope-preset"
				data-preset={preset}
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

			<div className="flex flex-col gap-2 pt-4 border-t border-border-primary">
				{/* Set as the section's subheaders are. The picked preset is the
				    radio above; only a combination no radio names is spelled out. */}
				<span className="mb-1 text-[0.75rem] font-semibold uppercase leading-[0.875rem] tracking-[0.1em] text-text-menu">
					Advanced
					{preset === 'Custom' ? (
						<span className="font-medium normal-case tracking-normal">
							{' '}
							· custom combination
						</span>
					) : null}
				</span>
				{/* The boxes' own labels, in the radios' type and 8px gap. */}
				<div className="flex flex-col gap-2 text-sm font-medium leading-none">
					<div className="text-text-menu">
						<Checkbox
							id="match-scope-path"
							label="Test path (always)"
							checked
							disabled
						/>
					</div>
					<Checkbox
						id="match-scope-parameters"
						label="Parameters"
						checked={current.matchParameters}
						onCheckedChange={(c) => toggle('matchParameters', c === true)}
						data-testid="match-scope-flag"
						data-flag="matchParameters"
					/>
					<Checkbox
						id="match-scope-verdicts"
						label="Verdicts"
						checked={current.matchVerdicts}
						onCheckedChange={(c) => toggle('matchVerdicts', c === true)}
						data-testid="match-scope-flag"
						data-flag="matchVerdicts"
					/>
					<Checkbox
						id="match-scope-tags"
						label="Tags (important and relevant)"
						checked={current.matchTags}
						onCheckedChange={(c) => toggle('matchTags', c === true)}
						data-testid="match-scope-flag"
						data-flag="matchTags"
					/>
				</div>
			</div>
		</div>
	);
}
