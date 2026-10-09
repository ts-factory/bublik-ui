/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useIsScrollbarVisible } from '@/shared/hooks';
import {
	ButtonTw,
	DrawerContent,
	DrawerFormHeader,
	DrawerRoot,
	Icon,
	cn
} from '@/shared/tailwind-ui';

import { ClassifyFields } from './classify-form.component';
import { buildSubmitHandler } from './classify-form.hooks';
import { type ClassifyForm } from './classify-form.types';

export interface ClassifyDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: ClassifyForm;
	projectId?: number;
	/**
	 * The results being classified, all of one run: one from a row's Classify
	 * button, several from the bulk bar. The match scope reads what they carry.
	 */
	resultIds: number[];
	submit: Parameters<typeof buildSubmitHandler>[0];
	/** See `ClassifyButtonProps.classified`. */
	classified?: boolean;
}

export function ClassifyDrawer({
	open,
	onOpenChange,
	form,
	projectId,
	resultIds,
	submit,
	classified = false
}: ClassifyDrawerProps) {
	const onSubmit = buildSubmitHandler(submit, form, () => onOpenChange(false));
	const several = resultIds.length > 1;
	const [scrollableRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	const isSubmitting = form.formState.isSubmitting;

	function handleOpenChange(next: boolean) {
		if (!next && isSubmitting) return;

		onOpenChange(next);
	}

	return (
		<DrawerRoot open={open} onOpenChange={handleOpenChange}>
			<DrawerContent
				portal
				onClick={(event) => event.stopPropagation()}
				data-stop-row-click="true"
				// Portaled to body, so the overlay must outrank the log preview
				// panel (z-50) it opens over, or the blur lands behind the preview.
				overlayClassName="z-[54]"
				className="z-[55] w-screen max-w-3xl flex flex-col"
				data-testid="classify-drawer"
				data-result-count={resultIds.length}
			>
				<div className="px-6 py-4 border-b border-border-primary shrink-0">
					<DrawerFormHeader
						name={
							several
								? `Classify ${resultIds.length} Results`
								: 'Classify Failure'
						}
						description={
							several
								? 'Record why these results failed under one issue, with a rule per test for future ones.'
								: classified
								? 'This result is already classified. Add another issue, or a verdict for this result only.'
								: 'Record why this result failed, and decide which future results inherit the verdict.'
						}
						onClose={() => handleOpenChange(false)}
					/>
				</div>

				<div
					ref={scrollableRef}
					className="flex flex-col flex-1 min-h-0 overflow-y-auto styled-scrollbar"
				>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col flex-1 gap-6 px-6 pt-6"
					>
						<ClassifyFields
							form={form}
							projectId={projectId}
							resultIds={resultIds}
							container={scrollableRef}
						/>

						<div
							className={cn(
								'sticky bottom-0 z-20 mt-auto -mx-6 bg-white px-6 py-4 backdrop-blur-sm',
								isScrollable && 'shadow-sticky'
							)}
						>
							<ButtonTw
								type="submit"
								variant="primary"
								size="md"
								rounded="lg"
								disabled={isSubmitting}
								className="justify-center w-full"
								data-testid="classify-submit"
							>
								{isSubmitting ? (
									<Icon
										name="ProgressIndicator"
										size={20}
										className="mr-1.5 animate-spin"
									/>
								) : (
									<Icon
										name="TriangleExclamationMark"
										size={20}
										className="mr-1.5"
									/>
								)}
								<span>
									{isSubmitting
										? 'Classifying…'
										: several
										? `Classify ${resultIds.length} results`
										: 'Classify'}
								</span>
							</ButtonTw>
						</div>
					</form>
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}
