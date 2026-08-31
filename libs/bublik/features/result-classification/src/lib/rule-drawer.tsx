/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useState } from 'react';

import { useIsScrollbarVisible } from '@/shared/hooks';
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
import type { IssueRule } from '@/shared/types';

import {
	RuleFields,
	useRuleForm,
	type RuleForm,
	type RuleFormSeed
} from './rule-form';
import { useLazyDialog } from './use-lazy-dialog';
import {
	buildRuleSubmitHandler,
	useDeleteRule,
	useSaveRule
} from './use-rule-mutations';
import { DESTRUCTIVE_FILL_CLASS } from './classification-colors';

export interface RuleDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	form: RuleForm;
	/** Absent for a create. */
	rule?: IssueRule | null;
	/** Fixed by the page — the issue page pins its issue. */
	lockIssue?: boolean;
	/** Names a test the option list may not carry. See `TestPicker`. */
	testName?: string | null;
}

/**
 * The rule editor, in `ClassifyDrawer`'s shell. Same width, same header, same
 * sticky footer — a rule written here and a rule written by classifying a
 * result are the same object, and the two forms should say so.
 */
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
				// See `ClassifyDrawer` for why all three of these are here: the
				// portal escapes the row's stacking context, the stopPropagation
				// keeps React's portal events out of the row handler, and z-[55]
				// sits between the dialog layer and the select dropdowns.
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

				{/* The issue and test popups portal in here rather than to
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
								// Rules carry no uniqueness constraint, so a second click
								// while the first is in flight creates a second identical
								// rule rather than failing.
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
	/** Fixed by the page — the issue page pins its issue. */
	lockIssue?: boolean;
	/** Names a seeded test the option list may not carry. */
	testName?: string | null;
	size?: 'xss' | 'md';
	label?: string;
}

/**
 * Opens an empty rule drawer, seeded with whatever the caller already knows.
 *
 * Owns the form, so closing and reopening starts clean rather than resuming an
 * abandoned draft. Hidden for non-admins: every write is admin-only server-side
 * and cannot be relaxed per project, so a button that always 403s is worse than
 * no button.
 */
export function NewRuleButton({
	rule,
	projectId,
	issueId,
	testId,
	lockIssue = false,
	testName,
	size = 'xss',
	label = 'New rule'
}: NewRuleButtonProps) {
	const [open, setOpen] = useState(false);
	const { isAdmin } = useAuth();
	const seed = { rule, projectId, issueId, testId };
	const form = useRuleForm(seed);

	if (!isAdmin) return null;

	function handleOpenChange(next: boolean) {
		setOpen(next);
		// Back to the seed rather than to blank: reopening from the same row
		// should offer the same starting point it did the first time.
		if (!next) form.reset();
	}

	return (
		<>
			<ButtonTw
				variant="primary"
				size={size}
				onClick={() => setOpen(true)}
				className="justify-center whitespace-nowrap"
				data-testid="rule-create"
			>
				<Icon name="FilePlus" size={size === 'md' ? 20 : 16} className="mr-1" />
				{label}
			</ButtonTw>
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
	const { isAdmin } = useAuth();

	if (!isAdmin) return null;

	return (
		<>
			<Tooltip content="Edit this rule’s category, disposition and active state">
				<ButtonTw
					variant="secondary"
					size="xss"
					onClick={() => setOpen(true)}
					className="justify-center whitespace-nowrap"
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

/**
 * A new rule prefilled from an existing one — the workflow the serializer's
 * "Create a new rule instead" points at, and the only way to write a different
 * matcher for a test that already has one.
 */
export function DuplicateRuleButton({
	rule,
	iconOnly = false
}: DuplicateRuleButtonProps) {
	const [open, setOpen] = useLazyDialog();
	const { isAdmin } = useAuth();

	if (!isAdmin) return null;

	return (
		<>
			<Tooltip content="Start a new rule from this one — same issue and test, a matcher you can change">
				<ButtonTw
					variant="secondary"
					size="xss"
					onClick={() => setOpen(true)}
					className="justify-center whitespace-nowrap"
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
				// Every value copied — including the matcher, which is the thing you
				// came here to change — but no `rule` handed to the drawer, so it
				// opens in *create* mode: nothing is locked, and submit POSTs.
				// That split is why `RuleFormSeed.rule` and `RuleDrawer.rule` are
				// separate: one seeds the values, the other says which rule is
				// being edited.
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

/**
 * Owns the form, so that `useRuleForm` runs only once the drawer is wanted —
 * see `useLazyDialog` for why that matters in a hundred-row table.
 */
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
				// Back to the seed rather than to blank: reopening from the same row
				// should offer the same starting point it did the first time.
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
	const { isAdmin } = useAuth();
	const [isOpen, setIsOpen] = useLazyDialog();
	const deleteRule = useDeleteRule();

	if (!isAdmin) return null;

	async function handleConfirm() {
		setIsOpen(false);

		try {
			await deleteRule({ ruleId: rule.id, projectId: rule.project });
		} catch {
			// The toast already carries the message; there is nothing to correct
			// here the way there is in a form.
		}
	}

	return (
		<>
			<Tooltip content="Delete this rule and every stamp it laid">
				<ButtonTw
					variant="destruction-secondary"
					size="xss"
					onClick={() => setIsOpen(true)}
					className={cn(
						'justify-center whitespace-nowrap',
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
