/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useRef, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useGetIssueQuery } from '@/services/bublik-api';
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
import { LoginRequired } from '@/bublik/features/auth';

import { IssueFields } from './issue-form.component';
import { useIssueForm } from './issue-form.hooks';
import { type IssueForm } from './issue-form.types';
import { issueToFormValues } from './issue-form.utils';
import { buildIssueSubmitHandler } from './issue-mutations.utils';
import { useDeleteIssue, useSaveIssue } from './issue-mutations.hooks';
import { DESTRUCTIVE_FILL_CLASS } from '../classification/classification.constants';
import { useLazyDialog } from '../shared/lazy-dialog.hooks';

export interface IssueDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: IssueForm;
	issue?: Issue | null;
	projectId?: number;
	lockProject?: boolean;
}

export function IssueDrawer({
	open,
	onOpenChange,
	form,
	issue,
	projectId,
	lockProject = false
}: IssueDrawerProps) {
	const isSubmitting = form.formState.isSubmitting;
	const isEdit = Boolean(issue);

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
				className="w-screen max-w-3xl flex flex-col"
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

				<IssueDrawerForm
					form={form}
					issue={issue}
					projectId={projectId}
					lockProject={lockProject}
					onDone={() => onOpenChange(false)}
					onCancel={() => handleOpenChange(false)}
				/>
			</DrawerContent>
		</DrawerRoot>
	);
}

interface IssueDrawerFormProps {
	form: IssueForm;
	issue?: Issue | null;
	projectId?: number;
	lockProject: boolean;
	onDone: () => void;
	onCancel: () => void;
}

/** The drawer's scrolling body: the fields, and the footer pinned under them. */
function IssueDrawerForm({
	form,
	issue,
	projectId,
	lockProject,
	onDone,
	onCancel
}: IssueDrawerFormProps) {
	const save = useSaveIssue();
	const scrollableRef = useRef<HTMLDivElement>(null);
	const isSubmitting = form.formState.isSubmitting;
	const isEdit = Boolean(issue);

	const onSubmit = buildIssueSubmitHandler(
		(values) => save({ values, issue, projectId }),
		form,
		onDone
	);

	return (
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
					lockProject={lockProject}
					container={scrollableRef}
				/>

				{/* Shadowed whether or not the body scrolls: the description fills
				    the drawer, so the footer always sits on the editor's edge. */}
				<div className="sticky bottom-0 z-20 mt-auto -mx-6 flex gap-3 bg-white px-6 py-4 shadow-sticky">
					<ButtonTw
						type="button"
						variant="secondary"
						size="md"
						rounded="lg"
						disabled={isSubmitting}
						onClick={onCancel}
						className="justify-center flex-1"
					>
						Cancel
					</ButtonTw>
					<ButtonTw
						type="submit"
						variant="primary"
						size="md"
						rounded="lg"
						disabled={isSubmitting}
						className="justify-center flex-1"
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
								? 'Save Issue'
								: 'Create Issue'}
						</span>
					</ButtonTw>
				</div>
			</form>
		</div>
	);
}

export interface NewIssueButtonProps {
	/** Prefills the project; with `lockProject` it also hides the picker. */
	projectId?: number;
	lockProject?: boolean;
	size?: 'xss' | 'md';
	label?: string;
}

export function NewIssueButton({
	projectId,
	lockProject = false,
	size = 'xss',
	label = 'New Issue'
}: NewIssueButtonProps) {
	const [open, setOpen] = useState(false);
	const form = useIssueForm(null, projectId);

	function handleOpen() {
		// `projectId` can change while the button stays mounted (the page's
		// project filter), so the defaults are rebuilt on every open.
		form.reset(issueToFormValues(null, projectId));
		setOpen(true);
	}

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) form.reset();
	}

	return (
		<>
			<LoginRequired message="Log in to create issues">
				<Tooltip content="Record a new issue">
					<ButtonTw
						variant={open ? 'primary' : 'secondary'}
						size={size}
						onClick={handleOpen}
						className="justify-center whitespace-nowrap"
						data-testid="issue-create"
					>
						<Icon name="FilePlus" className="mr-1 size-5" />
						{label}
					</ButtonTw>
				</Tooltip>
			</LoginRequired>
			<IssueDrawer
				open={open}
				onOpenChange={handleOpenChange}
				form={form}
				projectId={projectId}
				lockProject={lockProject}
			/>
		</>
	);
}

export interface EditIssueButtonProps {
	issueId: number;
	projectId?: number;
	issue?: Issue;
	iconOnly?: boolean;
}

export function EditIssueButton({
	issueId,
	projectId,
	issue,
	iconOnly = false
}: EditIssueButtonProps) {
	const [open, setOpen] = useLazyDialog();

	return (
		<>
			<LoginRequired message="Log in to edit issues">
				<Tooltip content="Edit title, description, bug key and state">
					<ButtonTw
						variant="secondary"
						size="xss"
						onClick={() => setOpen(true)}
						className={cn(
							'whitespace-nowrap',
							iconOnly ? 'justify-center' : 'justify-start'
						)}
						data-testid="issue-edit"
						aria-label="Edit issue"
					>
						<Icon
							name="Edit"
							size={iconOnly ? 16 : 20}
							className={iconOnly ? '' : 'mr-1'}
						/>
						{iconOnly ? null : 'Edit'}
					</ButtonTw>
				</Tooltip>
			</LoginRequired>
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

export function IssueDeleteButton({
	issueId,
	title,
	projectId,
	iconOnly = false,
	onDeleted
}: IssueDeleteButtonProps) {
	const [isOpen, setIsOpen] = useLazyDialog();
	const deleteIssue = useDeleteIssue();

	async function handleConfirm() {
		setIsOpen(false);

		try {
			await deleteIssue({ issueId, projectId });
			onDeleted?.();
		} catch {
			return;
		}
	}

	return (
		<>
			<LoginRequired message="Log in to delete issues">
				<Tooltip content="Delete this issue, its rules and their stamps">
					<ButtonTw
						variant="destruction-secondary"
						size="xss"
						onClick={() => setIsOpen(true)}
						className={cn(
							'whitespace-nowrap',
							iconOnly ? 'justify-center' : 'justify-start',
							DESTRUCTIVE_FILL_CLASS
						)}
						data-testid="issue-delete"
						aria-label="Delete issue"
					>
						<Icon
							name="Bin"
							size={iconOnly ? 16 : 20}
							className={iconOnly ? '' : 'mr-1'}
						/>
						{iconOnly ? null : 'Delete'}
					</ButtonTw>
				</Tooltip>
			</LoginRequired>
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
