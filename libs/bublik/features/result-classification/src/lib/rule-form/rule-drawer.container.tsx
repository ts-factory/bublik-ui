/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';

import { useIsScrollbarVisible } from '@/shared/hooks';
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
import type { IssueRule } from '@/shared/types';

import { RuleFields } from './rule-form.component';
import { useRuleForm } from './rule-form.hooks';
import { type RuleForm, type RuleFormSeed } from './rule-form.types';
import { useLazyDialog } from '../shared/lazy-dialog.hooks';
import { useCanManageIssues } from '../shared/permissions.hooks';
import { buildRuleSubmitHandler } from './rule-mutations.utils';
import { useDeleteRule, useSaveRule } from './rule-mutations.hooks';
import { DESTRUCTIVE_FILL_CLASS } from '../classification/classification.constants';

export interface RuleDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: RuleForm;
	rule?: IssueRule | null;
	lockIssue?: boolean;
	testName?: string | null;
}

export function RuleDrawer({
	open,
	onOpenChange,
	form,
	rule,
	lockIssue = false,
	testName
}: RuleDrawerProps) {
	const save = useSaveRule();
	const [scrollableRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	const isSubmitting = form.formState.isSubmitting;
	const isEdit = Boolean(rule);

	const onSubmit = buildRuleSubmitHandler(
		(values) => save({ values, rule }),
		form,
		() => onOpenChange(false)
	);

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
				data-testid="rule-drawer"
			>
				<div className="px-6 py-4 border-b border-border-primary shrink-0">
					<DrawerFormHeader
						name={isEdit ? 'Edit Rule' : 'New Rule'}
						description={
							isEdit
								? 'Category and disposition can be revised at any time; the matcher cannot.'
								: 'A rule decides which results carry an issue, and whether those failures still count.'
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
						<RuleFields
							form={form}
							mode={isEdit ? 'edit' : 'create'}
							lockIssue={lockIssue}
							testName={testName}
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
								data-testid="rule-submit"
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
										? 'Save rule'
										: 'Create rule'}
								</span>
							</ButtonTw>
						</div>
					</form>
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}

export interface NewRuleButtonProps extends RuleFormSeed {
	lockIssue?: boolean;
	testName?: string | null;
	size?: 'xss' | 'md';
	label?: string;
}

export function NewRuleButton({
	rule,
	projectId,
	issueId,
	testId,
	lockIssue = false,
	testName,
	size = 'xss',
	label = 'New Rule'
}: NewRuleButtonProps) {
	const [open, setOpen] = useState(false);
	const { canManage, reason } = useCanManageIssues();
	const seed = { rule, projectId, issueId, testId };
	const form = useRuleForm(seed);

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) form.reset();
	}

	return (
		<>
			<Tooltip content={reason || 'Write a new rule'}>
				<ButtonTw
					variant={open ? 'primary' : 'secondary'}
					size={size}
					disabled={!canManage}
					onClick={() => setOpen(true)}
					className="justify-center whitespace-nowrap"
					data-testid="rule-create"
				>
					<Icon
						name="FilePlus"
						size={size === 'md' ? 20 : 16}
						className="mr-1"
					/>
					{label}
				</ButtonTw>
			</Tooltip>
			<RuleDrawer
				open={open}
				onOpenChange={handleOpenChange}
				form={form}
				lockIssue={lockIssue}
				testName={testName}
			/>
		</>
	);
}

export interface EditRuleButtonProps {
	rule: IssueRule;
	iconOnly?: boolean;
}

export function EditRuleButton({
	rule,
	iconOnly = false
}: EditRuleButtonProps) {
	const [open, setOpen] = useLazyDialog();
	const { canManage, reason } = useCanManageIssues();

	return (
		<>
			<Tooltip
				content={
					reason || 'Edit this rule’s category, disposition and active state'
				}
			>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!canManage}
					onClick={() => setOpen(true)}
					className={cn(
						'whitespace-nowrap',
						iconOnly ? 'justify-center' : 'justify-start'
					)}
					data-testid="rule-edit"
					aria-label="Edit rule"
				>
					<Icon name="Edit" size={14} className={iconOnly ? '' : 'mr-1'} />
					{iconOnly ? null : 'Edit'}
				</ButtonTw>
			</Tooltip>
			{open !== null ? (
				<LazyRuleDrawer
					open={open}
					onOpenChange={setOpen}
					seed={{ rule }}
					rule={rule}
					testName={rule.test_name}
				/>
			) : null}
		</>
	);
}

export interface DuplicateRuleButtonProps {
	rule: IssueRule;
	iconOnly?: boolean;
}

export function DuplicateRuleButton({
	rule,
	iconOnly = false
}: DuplicateRuleButtonProps) {
	const [open, setOpen] = useLazyDialog();
	const { canManage, reason } = useCanManageIssues();

	return (
		<>
			<Tooltip
				content={
					reason ||
					'Start a new rule from this one — same issue and test, a matcher you can change'
				}
			>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!canManage}
					onClick={() => setOpen(true)}
					className={cn(
						'whitespace-nowrap',
						iconOnly ? 'justify-center' : 'justify-start'
					)}
					data-testid="rule-duplicate"
					aria-label="Duplicate rule"
				>
					<Icon
						name="PaperStack"
						size={14}
						className={iconOnly ? '' : 'mr-1'}
					/>
					{iconOnly ? null : 'Duplicate'}
				</ButtonTw>
			</Tooltip>
			{open !== null ? (
				<LazyRuleDrawer
					open={open}
					onOpenChange={setOpen}
					seed={{ rule }}
					testName={rule.test_name}
				/>
			) : null}
		</>
	);
}

function LazyRuleDrawer({
	open,
	onOpenChange,
	seed,
	rule,
	testName
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	seed: RuleFormSeed;
	rule?: IssueRule;
	testName?: string | null;
}) {
	const form = useRuleForm(seed);

	return (
		<RuleDrawer
			open={open}
			onOpenChange={(next) => {
				onOpenChange(next);
				if (!next) form.reset();
			}}
			form={form}
			rule={rule}
			testName={testName}
		/>
	);
}

export interface RuleDeleteButtonProps {
	rule: IssueRule;
	iconOnly?: boolean;
}

export function RuleDeleteButton({
	rule,
	iconOnly = false
}: RuleDeleteButtonProps) {
	const { canManage, reason } = useCanManageIssues();
	const [isOpen, setIsOpen] = useLazyDialog();
	const deleteRule = useDeleteRule();

	async function handleConfirm() {
		setIsOpen(false);

		try {
			await deleteRule({ ruleId: rule.id, projectId: rule.project });
		} catch {
			return;
		}
	}

	return (
		<>
			<Tooltip content={reason || 'Delete this rule and every stamp it laid'}>
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
					data-testid="rule-delete"
					aria-label="Delete rule"
				>
					<Icon name="Bin" size={14} className={iconOnly ? '' : 'mr-1'} />
					{iconOnly ? null : 'Delete'}
				</ButtonTw>
			</Tooltip>
			{isOpen !== null ? (
				<ConfirmDialog
					open={isOpen}
					onOpenChange={setIsOpen}
					title={`Delete this rule on ${rule.test_name}?`}
					description={
						'This also deletes every stamp the rule laid, so results it was explaining go back to counting as unexpected. To stop it applying to future imports while keeping that history, disable it instead.'
					}
					confirmLabel="Delete"
					onConfirmClick={handleConfirm}
					onCancelClick={() => setIsOpen(false)}
				/>
			) : null}
		</>
	);
}
