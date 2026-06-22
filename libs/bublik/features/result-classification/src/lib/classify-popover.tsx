/* SPDX-License-Identifier: Apache-2.0 */
import { useState } from 'react';
import { useWatch, type Control } from 'react-hook-form';

import {
	ButtonTw,
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/shared/tailwind-ui';

import {
	ClassifyFields,
	buildSubmitHandler,
	useClassifyForm,
	type ClassifyFormValues
} from './classify-form';
import { ClassifyDrawer } from './classify-drawer';
import { chipsForFlags, presetForFlags } from './match-scope.utils';
import { useClassify } from './use-classify';

export interface ClassifyPopoverProps {
	resultId: number;
	/** Project the result belongs to. On a run page this comes from the result
	 * itself, so classify works regardless of the global project selector. */
	projectId?: number;
}

function MatchingSummary({ control }: { control: Control<ClassifyFormValues> }) {
	const flags = useWatch({
		control,
		name: ['matchParameters', 'matchVerdicts', 'matchImportantTags', 'matchAllTags']
	});
	const current = {
		matchParameters: flags[0],
		matchVerdicts: flags[1],
		matchImportantTags: flags[2],
		matchAllTags: flags[3]
	};
	return (
		<div className="flex flex-col gap-1 px-3 py-2 rounded bg-primary-wash/60">
			<span className="text-xs font-semibold text-text-menu">
				Matching ({presetForFlags(current)})
			</span>
			<div className="flex flex-wrap gap-1">
				{chipsForFlags(current).map((chip) => (
					<span
						key={chip}
						className="px-1.5 py-0.5 text-[0.6875rem] rounded bg-white border border-border-primary"
					>
						{chip}
					</span>
				))}
			</div>
		</div>
	);
}

export function ClassifyPopover({ resultId, projectId }: ClassifyPopoverProps) {
	const [open, setOpen] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const { submit, canClassify } = useClassify(resultId, projectId);
	const form = useClassifyForm();

	const onSubmit = buildSubmitHandler(submit, () => setOpen(false));

	return (
		<>
			{/* Modal traps focus (like the History drawer); portal layers the
			    content above the table so clicks land inside, not on rows behind. */}
			<Popover open={open} onOpenChange={setOpen} modal>
				<PopoverTrigger asChild>
					<ButtonTw
						variant="secondary"
						size="xss"
						disabled={!canClassify}
						title={!canClassify ? 'Select a project first' : undefined}
					>
						<Icon name="TriangleExclamationMark" size={18} className="mr-1" />
						Classify
					</ButtonTw>
				</PopoverTrigger>
				{/* Above the z-50 crowd (tooltips/other popovers also portal to body
				    at z-50); otherwise a later z-50 portal paints over the popover and
				    clicks on it read as outside -> dismiss. */}
				<PopoverContent sideOffset={8} portal className="z-[100]">
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="min-w-[320px] p-4 bg-white rounded-md shadow-popover flex flex-col gap-4"
					>
						<span className="text-[0.875rem] font-semibold">Classify failure</span>

						<ClassifyFields form={form} projectId={projectId} />

						<MatchingSummary control={form.control} />

						<button
							type="button"
							onClick={() => {
								setOpen(false);
								setDrawerOpen(true);
							}}
							className="self-start text-xs font-medium text-primary hover:underline"
						>
							Customize match rules →
						</button>

						<ButtonTw
							type="submit"
							variant="primary"
							size="md"
							rounded="lg"
							className="justify-center w-full"
						>
							{form.formState.isSubmitting ? (
								<Icon name="ProgressIndicator" size={18} className="animate-spin" />
							) : (
								'Classify'
							)}
						</ButtonTw>
					</form>
				</PopoverContent>
			</Popover>

			<ClassifyDrawer
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
				form={form}
				projectId={projectId}
				submit={submit}
			/>
		</>
	);
}
