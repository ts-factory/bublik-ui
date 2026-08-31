/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useRef, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetIssueQuery } from '@/services/bublik-api';
import {
	ButtonTw,
	ConfirmDialog,
	Dialog,
	DialogClose,
	DialogPortal,
	Icon,
	ModalContent,
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
import { useCanManageIssues } from './use-can-manage-issues';

export interface IssueModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: IssueForm;
	/** Absent for a create. */
	issue?: Issue | null;
	projectId?: number;
}

/**
 * A modal, not a drawer.
 *
 * The classify drawer earns its full height: it carries three sections, a
 * matcher and a scope. An issue is four fields — title, description, tracker
 * key, state — and a full-height panel around four fields is mostly empty
 * panel. It follows `CreateUserModal` / `UsersModalLayout` instead, which is
 * what the rest of the app uses for a short form.
 *
 * The rule editor stays a drawer: it has the fields to justify one.
 */
export function IssueModal({
	open,
	onOpenChange,
	form,
	issue,
	projectId
}: IssueModalProps) {
	const save = useSaveIssue();
	// The tracker combobox portals into this node rather than to
	// `document.body`: this is a modal dialog, and a click on a body-level popup
	// reads as a click outside — which closes the modal instead of selecting the
	// option.
	const contentRef = useRef<HTMLDivElement>(null);
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
		<Dialog open={open} onOpenChange={handleOpenChange}>
			{/* Portalled, unlike `CreateUserModal` — that one opens from a toolbar
			    button, these open from inside a table row. `dialogContentStyles` is
			    `position: fixed`, which escapes overflow clipping but not a
			    stacking context, so without this the row can paint over the modal.
			    Same reason `ClassifyDrawer` takes its `portal` prop. */}
			<DialogPortal>
				<ModalContent
					ref={contentRef}
					// React events bubble through the component tree rather than the DOM
					// one, so without this a click inside the modal reaches the table
					// cell that rendered the trigger and toggles row state, re-rendering
					// the row out from under it. The data attribute is that handler's
					// own DOM-side opt-out.
					onClick={(event) => event.stopPropagation()}
					data-stop-row-click="true"
					className="w-full sm:max-w-lg p-6 bg-white sm:rounded-lg md:shadow min-w-[420px] z-10 relative overflow-auto max-h-[85vh]"
					data-testid="issue-modal"
				>
					<DialogClose
						disabled={isSubmitting}
						className="absolute grid p-1 transition-colors rounded-md right-4 top-4 place-items-center text-text-menu hover:bg-primary-wash hover:text-primary"
						aria-label="Close"
					>
						<Icon name="Cross" size={14} />
					</DialogClose>
					<h1 className="mb-1 text-2xl font-bold leading-tight tracking-tight text-text-primary">
						{isEdit ? 'Edit Issue' : 'New Issue'}
					</h1>
					<p className="mb-6 text-sm text-text-menu">
						{isEdit
							? 'An issue is the cause identity. Its rules decide which results carry it.'
							: 'Record a cause now; attach rules to it from a failing result or from this issue’s page.'}
					</p>

					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-6"
					>
						<IssueFields
							form={form}
							projectId={projectId}
							mode={isEdit ? 'edit' : 'create'}
							container={contentRef}
						/>

						<div className="flex justify-end gap-2">
							<ButtonTw
								type="button"
								variant="secondary"
								size="md"
								rounded="lg"
								disabled={isSubmitting}
								onClick={() => handleOpenChange(false)}
							>
								Cancel
							</ButtonTw>
							<ButtonTw
								type="submit"
								variant="primary"
								size="md"
								rounded="lg"
								// The request is not idempotent — a second click while the
								// first is in flight creates a second issue.
								disabled={isSubmitting}
								className="justify-center"
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
				</ModalContent>
			</DialogPortal>
		</Dialog>
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
	const { canManage, reason } = useCanManageIssues();
	const form = useIssueForm();

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) form.reset();
	}

	return (
		<>
			<Tooltip content={reason || 'Record a new issue'}>
				<ButtonTw
					variant="primary"
					size={size}
					disabled={!canManage}
					onClick={() => setOpen(true)}
					className="justify-center whitespace-nowrap"
					data-testid="issue-create"
				>
					<Icon
						name="FilePlus"
						size={size === 'md' ? 20 : 16}
						className="mr-1"
					/>
					{label}
				</ButtonTw>
			</Tooltip>
			<IssueModal
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
	const { canManage, reason } = useCanManageIssues();

	return (
		<>
			<Tooltip content={reason || 'Edit title, description, bug key and state'}>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!canManage}
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
				<LazyIssueModal
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
 * Owns the form and the fetch, so neither happens until the modal is wanted —
 * see `useLazyDialog` for why that matters in a hundred-row table.
 */
function LazyIssueModal({
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
		<IssueModal
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
	const { canManage, reason } = useCanManageIssues();
	const [isOpen, setIsOpen] = useLazyDialog();
	const deleteIssue = useDeleteIssue();

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
			<Tooltip
				content={reason || 'Delete this issue, its rules and their stamps'}
			>
				<ButtonTw
					variant="destruction-secondary"
					size="xss"
					disabled={!canManage}
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
