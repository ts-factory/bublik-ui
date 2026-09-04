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

import { IssueFields } from './issue-form.component';
import { useIssueForm } from './issue-form.hooks';
import { type IssueForm } from './issue-form.types';
import { buildIssueSubmitHandler } from './issue-mutations.utils';
import { useDeleteIssue, useSaveIssue } from './issue-mutations.hooks';
import { DESTRUCTIVE_FILL_CLASS } from '../classification/classification.constants';
import { useLazyDialog } from '../shared/lazy-dialog.hooks';
import { useCanManageIssues } from '../shared/permissions.hooks';

export interface IssueModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: IssueForm;
	issue?: Issue | null;
	projectId?: number;
}

export function IssueModal({
	open,
	onOpenChange,
	form,
	issue,
	projectId
}: IssueModalProps) {
	const save = useSaveIssue();
	const contentRef = useRef<HTMLDivElement>(null);
	const isSubmitting = form.formState.isSubmitting;
	const isEdit = Boolean(issue);

	const onSubmit = buildIssueSubmitHandler(
		(values) => save({ values, issue, projectId }),
		form,
		() => onOpenChange(false)
	);

	function handleOpenChange(next: boolean) {
		if (!next && isSubmitting) return;

		onOpenChange(next);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogPortal>
				<ModalContent
					ref={contentRef}
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
	size?: 'xss' | 'md';
	label?: string;
}

export function NewIssueButton({
	projectId,
	size = 'xss',
	label = 'New Issue'
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
					variant={open ? 'primary' : 'secondary'}
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
	const { canManage, reason } = useCanManageIssues();

	return (
		<>
			<Tooltip content={reason || 'Edit title, description, bug key and state'}>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!canManage}
					onClick={() => setOpen(true)}
					className={cn(
						'whitespace-nowrap',
						iconOnly ? 'justify-center' : 'justify-start'
					)}
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
			return;
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
						'whitespace-nowrap',
						iconOnly ? 'justify-center' : 'justify-start',
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
