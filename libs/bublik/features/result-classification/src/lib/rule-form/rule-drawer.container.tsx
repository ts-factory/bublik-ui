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
import { LoginRequired } from '@/bublik/features/auth';

import { RuleFields } from './rule-form.component';
import { useRuleForm } from './rule-form.hooks';
import { type RuleForm, type RuleFormSeed } from './rule-form.types';
import { useLazyDialog } from '../shared/lazy-dialog.hooks';
import { buildRuleSubmitHandler } from './rule-mutations.utils';
import { useDeleteRule, useSaveRule } from './rule-mutations.hooks';
import { DESTRUCTIVE_FILL_CLASS } from '../classification/classification.constants';

export interface RuleDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: RuleForm;
	rule?: IssueRule | null;
	lockIssue?: boolean;
	/** The seeded test's path, so the picker can show it before any search. */
	testPath?: string | null;
}

export function RuleDrawer({
	open,
	onOpenChange,
	form,
	rule,
	lockIssue = false,
	testPath
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
							testPath={testPath}
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
										? 'Save Rule'
										: 'Create Rule'}
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
	size?: 'xss' | 'md';
	label?: string;
}

/**
 * Authoring a rule from scratch: the test picker searches every test with
 * results in the project, by package path.
 */
export function NewRuleButton({
	rule,
	projectId,
	issueId,
	testId,
	lockIssue = false,
	size = 'xss',
	label = 'New Rule'
}: NewRuleButtonProps) {
	const [open, setOpen] = useState(false);
	const seed = { rule, projectId, issueId, testId };
	const form = useRuleForm(seed);

	function handleOpenChange(next: boolean) {
		setOpen(next);
		if (!next) form.reset();
	}

	return (
		<>
			<LoginRequired message="Log in to create rules">
				<Tooltip content="Write a new rule">
					<ButtonTw
						variant={open ? 'primary' : 'secondary'}
						size={size}
						onClick={() => setOpen(true)}
						className="justify-center whitespace-nowrap"
						data-testid="rule-create"
					>
						<Icon name="FilePlus" className="mr-1 size-5" />
						{label}
					</ButtonTw>
				</Tooltip>
			</LoginRequired>
			<RuleDrawer
				open={open}
				onOpenChange={handleOpenChange}
				form={form}
				lockIssue={lockIssue}
				testPath={rule?.test_path}
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

	return (
		<>
			<LoginRequired message="Log in to edit rules">
				<Tooltip content="Edit this rule’s category, disposition and active state">
					<ButtonTw
						variant="secondary"
						size="xss"
						onClick={() => setOpen(true)}
						className={cn(
							'whitespace-nowrap',
							iconOnly ? 'justify-center' : 'justify-start'
						)}
						data-testid="rule-edit"
						aria-label="Edit rule"
					>
						<Icon name="Edit" size={16} className={iconOnly ? '' : 'mr-1'} />
						{iconOnly ? null : 'Edit'}
					</ButtonTw>
				</Tooltip>
			</LoginRequired>
			{open !== null ? (
				<LazyRuleDrawer
					open={open}
					onOpenChange={setOpen}
					seed={{ rule }}
					rule={rule}
				/>
			) : null}
		</>
	);
}

export interface DuplicateRuleButtonProps {
	rule: IssueRule;
	iconOnly?: boolean;
}

/**
 * Starts a new rule from this one — same issue and test, a matcher you can
 * change. The way to vary a rule that already has stamps, whose matcher is
 * locked.
 */
export function DuplicateRuleButton({
	rule,
	iconOnly = false
}: DuplicateRuleButtonProps) {
	const [open, setOpen] = useLazyDialog();

	return (
		<>
			<LoginRequired message="Log in to create rules">
				<Tooltip content="Start a new rule from this one — same issue and test, a matcher you can change">
					<ButtonTw
						variant="secondary"
						size="xss"
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
							size={16}
							className={iconOnly ? '' : 'mr-1'}
						/>
						{iconOnly ? null : 'Duplicate'}
					</ButtonTw>
				</Tooltip>
			</LoginRequired>
			{open !== null ? (
				<LazyRuleDrawer open={open} onOpenChange={setOpen} seed={{ rule }} />
			) : null}
		</>
	);
}

function LazyRuleDrawer({
	open,
	onOpenChange,
	seed,
	rule
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	seed: RuleFormSeed;
	rule?: IssueRule;
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
			testPath={seed.rule?.test_path}
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
			<LoginRequired message="Log in to delete rules">
				<Tooltip content="Delete this rule and every stamp it laid">
					<ButtonTw
						variant="destruction-secondary"
						size="xss"
						onClick={() => setIsOpen(true)}
						className={cn(
							'whitespace-nowrap',
							iconOnly ? 'justify-center' : 'justify-start',
							DESTRUCTIVE_FILL_CLASS
						)}
						data-testid="rule-delete"
						aria-label="Delete rule"
					>
						<Icon name="Bin" size={16} className={iconOnly ? '' : 'mr-1'} />
						{iconOnly ? null : 'Delete'}
					</ButtonTw>
				</Tooltip>
			</LoginRequired>
			{isOpen !== null ? (
				<ConfirmDialog
					open={isOpen}
					onOpenChange={setIsOpen}
					title="Delete this rule?"
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
