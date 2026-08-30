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
} from './classify-form';

export interface ClassifyDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: ClassifyForm;
	projectId?: number;
	submit: Parameters<typeof buildSubmitHandler>[0];
}

/**
 * Deliberately built to the history global search form's proportions — see
 * `history-global-search-form/global-search-form/global-search-form.component.tsx`.
 * These are the app's two form drawers, and they should not feel like two
 * different applications.
 *
 * The header is genuinely shared — `DrawerFormHeader` in `@/shared/tailwind-ui`.
 * The sticky footer is still mirrored markup, because the search form's carries
 * two buttons and a hint line and this one carries neither; that is the same
 * convention `classification-table` follows for `run-table`: name the
 * reference, keep the class strings in step.
 */
export function ClassifyDrawer({
	open,
	onOpenChange,
	form,
	projectId,
	submit
}: ClassifyDrawerProps) {
	const onSubmit = buildSubmitHandler(submit, () => onOpenChange(false));
	const [scrollableRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();

	// `portal` escapes the trigger's stacking context — the trigger sits in a
	// table row, which would otherwise paint over the panel. z-[55] clears the
	// z-50 dialog layer but stays under the nested `SelectInput` dropdown
	// (z-[60]) so its options open in front of the drawer, not behind it.
	return (
		<DrawerRoot open={open} onOpenChange={onOpenChange}>
			<DrawerContent
				portal
				// `portal` is a React portal, and React events bubble through the
				// component tree rather than the DOM one — so without this, a click
				// on the drawer reaches the table cell that rendered the trigger
				// (`handleRowClick` in `result-table.component.tsx`), toggles row
				// state, and re-renders the row out from under the drawer. The data
				// attribute is that same handler's opt-out, for its DOM-side check.
				onClick={(event) => event.stopPropagation()}
				data-stop-row-click="true"
				className="z-[55] w-screen max-w-3xl flex flex-col"
				data-testid="classify-drawer"
			>
				<div className="px-6 py-4 border-b border-border-primary shrink-0">
					<DrawerFormHeader
						name="Classify Failure"
						description="Record why this result failed, and decide which future results inherit the verdict."
						onClose={() => onOpenChange(false)}
					/>
				</div>

				{/* The issue picker's popup portals in here rather than to
				    `document.body`: this is a modal dialog, and Radix reads a click
				    on a body-level popup as a click outside — which closes the
				    drawer instead of selecting the option. */}
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

						{/* Negative margins cancel the form's padding so the bar bleeds
						    the full width of the drawer, and the shadow appears only once
						    there is actually something scrolled under it. */}
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
								className="justify-center w-full"
								data-testid="classify-submit"
							>
								{form.formState.isSubmitting ? (
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
								<span>Classify</span>
							</ButtonTw>
						</div>
					</form>
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}
