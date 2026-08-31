/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useIsScrollbarVisible } from '@/shared/hooks';
import { useGetIssueQuery } from '@/services/bublik-api';
import { useAuth } from '@/bublik/features/auth';
import {
	ButtonTw,
	ConfirmDialog,
	DrawerContent,
	DrawerFormHeader,
	DrawerRoot,
	Icon,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';
import type { Issue } from '@/shared/types';

import { IssueFields, useIssueForm, type IssueForm } from './issue-form';
import {
	buildIssueSubmitHandler,
	useDeleteIssue,
	useSaveIssue
} from './use-issue-mutations';
import { DESTRUCTIVE_FILL_CLASS } from './classification-colors';
import { useLazyDialog } from './use-lazy-dialog';

export interface IssueDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: IssueForm;
	/** Absent for a create. */
	issue?: Issue | null;
	projectId?: number;
}

/**
 * Built to `ClassifyDrawer`'s proportions, and for the same reason it was built
 * to the history search form's: these are the app's form drawers, and they
 * should not feel like different applications. The header is genuinely shared —
 * `DrawerFormHeader` in `@/shared/tailwind-ui`.
 */
export function IssueDrawer({
	open,
	onOpenChange,
	form,
	issue,
	projectId
}: IssueDrawerProps) {
	const save = useSaveIssue();
	const [scrollableRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	const isSubmitting = form.formState.isSubmitting;
	const isEdit = Boolean(issue);

	const onSubmit = buildIssueSubmitHandler(
		(values) => save({ values, issue, projectId }),
		form,
		() => onOpenChange(false)
	);

	// Escape, the backdrop and the header's cross all route through here. None
	// of them may take the form away while the request it describes is still in
	// flight — if it fails, this is where the message has to land.
	function handleOpenChange(next: boolean) {
		if (!next && isSubmitting) return;

		onOpenChange(next);
	}

	return (
		<DrawerRoot open={open} onOpenChange={handleOpenChange}>
			<DrawerContent
				// `portal` escapes the trigger's stacking context — the trigger sits
				// in a table row, which would otherwise paint over the panel. z-[55]
				// clears the z-50 dialog layer but stays under the nested
				// `SelectInput` dropdown (z-[60]) so its options open in front of the
				// drawer, not behind it.
				portal
				// `portal` is a React portal, and React events bubble through the
				// component tree rather than the DOM one — so without this, a click
				// on the drawer reaches the table cell that rendered the trigger and
				// toggles row state, re-rendering the row out from under the drawer.
				onClick={(event) => event.stopPropagation()}
				data-stop-row-click="true"
				className="z-[55] w-screen max-w-3xl flex flex-col"
				data-testid="issue-drawer"
			>
				<div className="px-6 py-4 border-b border-border-primary shrink-0">
					<DrawerFormHeader
						name={isEdit ? 'Edit Issue' : 'New Issue'}
						description={
							isEdit
								? 'An issue is the cause identity. Its rules decide which results carry it.'
								: 'Record a cause now; attach rules to it from a failing result or from this issue’s page.'
						}
						onClose={() => handleOpenChange(false)}
					/>
				</div>

				{/* The tracker combobox portals in here rather than to
				    `document.body`: this is a modal dialog, and a click on a
				    body-level popup reads as a click outside — which closes the
				    drawer instead of selecting the option. */}
				<div
					ref={scrollableRef}
					className="flex flex-col flex-1 min-h-0 overflow-y-auto styled-scrollbar"
				>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col flex-1 gap-6 px-6 pt-6"
					>
						<IssueFields
							form={form}
							projectId={projectId}
							mode={isEdit ? 'edit' : 'create'}
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
								// The request is not idempotent — a second click while the
								// first is in flight creates a second issue.
								disabled={isSubmitting}
								className="justify-center w-full"
								data-testid="issue-submit"
							>
								{isSubmitting ? (
									<Icon
										name="ProgressIndicator"
										size={20}
										className="mr-1.5 animate-spin"
									/>
								) : (
									<Icon name="Edit" size={20} className="mr-1.5" />
								)}
								<span>
									{isSubmitting
										? isEdit
											? 'Saving…'
											: 'Creating…'
										: isEdit
										? 'Save issue'
										: 'Create issue'}
								</span>
							</ButtonTw>
						</div>
					</form>
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}

export interface NewIssueButtonProps {
	projectId?: number;
	/** `xss` in a toolbar, `md` in an empty state. */
	size?: 'xss' | 'md';
	label?: string;
}

/**
 * Opens an empty issue drawer. Owns the form so that closing and reopening
 * starts clean rather than resuming an abandoned draft — the same split
 * `ClassifyButton` uses.
 *
 * Hidden for non-admins: every write is `@check_action_permission
 * ('manage_issues')`, which resolves to admin-only and cannot be relaxed
 * per-project. A button that always 403s is worse than no button.
 */
export function NewIssueButton({
	projectId,
	size = 'xss',
	label = 'New issue'
}: NewIssueButtonProps) {
	const [open, setOpen] = useState(false);
	const { isAdmin } = useAuth();
	const form = useIssueForm();

	if (!isAdmin) return null;

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) form.reset();
	}

	return (
		<>
			<ButtonTw
				variant="primary"
				size={size}
				onClick={() => setOpen(true)}
				className="justify-center whitespace-nowrap"
				data-testid="issue-create"
			>
				<Icon name="FilePlus" size={size === 'md' ? 20 : 16} className="mr-1" />
				{label}
			</ButtonTw>
			<IssueDrawer
				open={open}
				onOpenChange={handleOpenChange}
				form={form}
				projectId={projectId}
			/>
		</>
	);
}

export interface EditIssueButtonProps {
	issueId: number;
	projectId?: number;
	/** Skips the fetch when the caller already holds the row. */
	issue?: Issue;
	/** Table rows want the icon alone; the issue header has room for the word. */
	iconOnly?: boolean;
}

export function EditIssueButton({
	issueId,
	projectId,
	issue,
	iconOnly = false
}: EditIssueButtonProps) {
	const [open, setOpen] = useLazyDialog();
	const { isAdmin } = useAuth();

	if (!isAdmin) return null;

	return (
		<>
			<Tooltip content="Edit title, description, bug key and state">
				<ButtonTw
					variant="secondary"
					size="xss"
					onClick={() => setOpen(true)}
					className="justify-center whitespace-nowrap"
					data-testid="issue-edit"
					aria-label="Edit issue"
				>
					<Icon name="Edit" size={14} className={iconOnly ? '' : 'mr-1'} />
					{iconOnly ? null : 'Edit'}
				</ButtonTw>
			</Tooltip>
			{open !== null ? (
				<LazyIssueDrawer
					open={open}
					onOpenChange={setOpen}
					issueId={issueId}
					issue={issue}
					projectId={projectId}
				/>
			) : null}
		</>
	);
}

/**
 * Owns the form and the fetch, so neither happens until the drawer is wanted —
 * see `useLazyDialog` for why that matters in a hundred-row table.
 */
function LazyIssueDrawer({
	open,
	onOpenChange,
	issueId,
	issue,
	projectId
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	issueId: number;
	issue?: Issue;
	projectId?: number;
}) {
	// A table row carries every field the form needs, so the fetch is skipped
	// there. It is not skipped on the issue page, where the header's own query
	// is the one that already has it — same cache entry, no second request.
	const { data: fetched } = useGetIssueQuery(
		issue ? skipToken : { issueId, projectId }
	);
	const current = issue ?? fetched;
	const form = useIssueForm(current);

	return (
		<IssueDrawer
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next);
				if (!next) form.reset();
			}}
			form={form}
			issue={current}
			projectId={projectId}
		/>
	);
}

export interface IssueDeleteButtonProps {
	issueId: number;
	title: string;
	projectId?: number;
	iconOnly?: boolean;
	onDeleted?: () => void;
}

/**
 * Delete, behind a confirmation that says what it actually does.
 *
 * "Close" is the reversible half of this pair and already sits beside it; the
 * difference between them is worth spelling out, because deleting is not
 * archiving — the cascade takes the rules and their stamps, so results that
 * read as explained go back to reading as unexplained.
 */
export function IssueDeleteButton({
	issueId,
	title,
	projectId,
	iconOnly = false,
	onDeleted
}: IssueDeleteButtonProps) {
	const { isAdmin } = useAuth();
	const [isOpen, setIsOpen] = useLazyDialog();
	const deleteIssue = useDeleteIssue();

	if (!isAdmin) return null;

	async function handleConfirm() {
		setIsOpen(false);

		try {
			await deleteIssue({ issueId, projectId });
			onDeleted?.();
		} catch {
			// The toast already carries the message; there is nothing to correct
			// here the way there is in a form.
		}
	}

	return (
		<>
			<Tooltip content="Delete this issue, its rules and their stamps">
				<ButtonTw
					variant="destruction-secondary"
					size="xss"
					onClick={() => setIsOpen(true)}
					className={cn(
						'justify-center whitespace-nowrap',
						DESTRUCTIVE_FILL_CLASS
					)}
					data-testid="issue-delete"
					aria-label="Delete issue"
				>
					<Icon name="Bin" size={14} className={iconOnly ? '' : 'mr-1'} />
					{iconOnly ? null : 'Delete'}
				</ButtonTw>
			</Tooltip>
			{isOpen !== null ? (
				<ConfirmDialog
					open={isOpen}
					onOpenChange={setIsOpen}
					title={`Delete ${title}?`}
					description={
						'This also deletes every rule under this issue and every stamp those rules laid, in every project. Results explained by them go back to counting as unexpected. To stop an issue applying without losing the history, close it instead.'
					}
					confirmLabel="Delete"
					onConfirmClick={handleConfirm}
					onCancelClick={() => setIsOpen(false)}
				/>
			) : null}
		</>
	);
}
