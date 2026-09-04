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

import {
	ClassifyFields,
	buildSubmitHandler,
	type ClassifyForm
} from './classify-form.component';

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
	const onSubmit = buildSubmitHandler(submit, form, () => onOpenChange(false));
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
				className="z-[55] w-screen max-w-3xl flex flex-col"
				data-testid="classify-drawer"
			>
				<div className="px-6 py-4 border-b border-border-primary shrink-0">
					<DrawerFormHeader
						name="Classify Failure"
						description="Record why this result failed, and decide which future results inherit the verdict."
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
								<span>{isSubmitting ? 'Classifying…' : 'Classify'}</span>
							</ButtonTw>
						</div>
					</form>
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}
