/* SPDX-License-Identifier: Apache-2.0 */
import {
	ButtonTw,
	DrawerContent,
	DrawerRoot,
	Icon
} from '@/shared/tailwind-ui';

import {
	ClassifyFields,
	buildSubmitHandler,
	type ClassifyForm
} from './classify-form';
import { MatchScope } from './match-scope';

export interface ClassifyDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: ClassifyForm;
	projectId?: number;
	submit: Parameters<typeof buildSubmitHandler>[0];
}

export function ClassifyDrawer({
	open,
	onOpenChange,
	form,
	projectId,
	submit
}: ClassifyDrawerProps) {
	const onSubmit = buildSubmitHandler(submit, () => onOpenChange(false));

	// Modal (like the History drawer) traps focus; portal layers the panel above
	// the table so clicks land inside, not on rows behind.
	return (
		<DrawerRoot open={open} onOpenChange={onOpenChange}>
			<DrawerContent
				portal
				className="z-[55] w-[28rem] max-w-[90vw] flex flex-col"
			>
				<div className="flex items-center justify-between px-5 py-4 border-b border-border-primary">
					<span className="text-base font-semibold">Classify failure</span>
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="grid place-items-center w-7 h-7 rounded hover:bg-primary-wash"
						aria-label="Close"
					>
						<Icon name="CrossSimple" size={16} />
					</button>
				</div>

				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex flex-col gap-4 p-5 overflow-y-auto"
				>
					<ClassifyFields form={form} projectId={projectId} />

					<div className="pt-2 border-t border-border-primary">
						<MatchScope form={form} />
					</div>

					<ButtonTw
						type="submit"
						variant="primary"
						size="md"
						rounded="lg"
						className="justify-center w-full"
					>
						{form.formState.isSubmitting ? (
							<Icon
								name="ProgressIndicator"
								size={18}
								className="animate-spin"
							/>
						) : (
							'Classify'
						)}
					</ButtonTw>
				</form>
			</DrawerContent>
		</DrawerRoot>
	);
}
