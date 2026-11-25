/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { bublikAPI, getErrorMessage } from '@/services/bublik-api';
import { useCopyToClipboard } from '@/shared/hooks';
import {
	ButtonTw,
	cn,
	DrawerContent,
	DrawerFormHeader,
	DrawerRoot,
	Icon,
	MarkdownEditor,
	toast,
	Tooltip
} from '@/shared/tailwind-ui';
import {
	DESCRIPTION_MARKDOWN_CLASS,
	DescriptionBlock
} from '@/bublik/features/result-classification';

/** Shows the server's reason, e.g. a missing permission, instead of a generic failure. */
const toastError = (fallback: string) => (e: unknown) =>
	getErrorMessage(e).description || fallback;

const RunCommentFormSchema = z.object({
	comment: z.string()
});

type RunCommentFormValues = z.infer<typeof RunCommentFormSchema>;

/** About six lines of the comment; the rest opens over it, as on the issue page. */
const COMMENT_MAX_HEIGHT_CLASS = 'max-h-[6.75rem]';

const COMMENT_TEXT_CLASS = 'text-[0.6875rem] font-medium leading-[1.125rem]';

interface RunCommentFormContainerProps {
	runId: number;
	defaultValues: RunCommentFormValues;
}

/**
 * The run's comment in the info card: its label, starting where the labels
 * of the rows above start, with edit and copy beside it, and under it the
 * markdown, hugging its text, wrapped to the card and cut after a few lines
 * like an issue's description, with the full text a click away. A run
 * without a comment offers to add one. Edited in a drawer with the same
 * markdown editor issues use.
 */
function RunCommentFormContainer(props: RunCommentFormContainerProps) {
	const { runId, defaultValues } = props;
	const [isOpen, setIsOpen] = useState(false);
	const [, copy] = useCopyToClipboard();
	const comment = defaultValues.comment;

	function handleCopy() {
		copy(comment).then((success) => {
			if (success) toast.success('Copied to clipboard');
			else toast.error('Failed to copy to clipboard');
		});
	}

	return (
		<>
			{comment.trim() ? (
				<section aria-label="Run comment" className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<span className="text-text-menu text-[0.6875rem] font-medium leading-[0.875rem]">
							Comment
						</span>
						<div className="flex items-center gap-1">
							<Tooltip content="Edit Run Comment">
								<ButtonTw
									variant={isOpen ? 'primary' : 'secondary'}
									size="xss"
									className="size-6 shrink-0"
									onClick={() => setIsOpen(true)}
								>
									<Icon name="Edit" className="size-5 shrink-0" />
									<span className="sr-only">Edit</span>
								</ButtonTw>
							</Tooltip>
							<Tooltip content="Copy as markdown">
								<ButtonTw
									variant="secondary"
									size="xss"
									className="size-6 shrink-0"
									onClick={handleCopy}
								>
									<Icon name="PaperStack" className="size-5 shrink-0" />
									<span className="sr-only">Copy</span>
								</ButtonTw>
							</Tooltip>
						</div>
					</div>
					{/* Hugs the text, up to 56rem, rather than spanning the card. */}
					<div
						className={cn(COMMENT_TEXT_CLASS, 'w-fit min-w-0 max-w-[56rem]')}
						data-testid="run-comment-value"
					>
						<DescriptionBlock
							value={comment}
							title="Run comment"
							overlay
							expandLabel="Show full comment"
							className={COMMENT_MAX_HEIGHT_CLASS}
							data-testid="run-comment-block"
						/>
					</div>
				</section>
			) : (
				<button
					type="button"
					className={cn(
						COMMENT_TEXT_CLASS,
						'flex h-6 items-center gap-1.5 rounded border border-dashed border-border-primary px-2 text-text-primary transition-colors hover:border-primary hover:text-primary'
					)}
					onClick={() => setIsOpen(true)}
					data-testid="run-comment-add"
				>
					<Icon name="AddSymbol" size={14} className="shrink-0 text-primary" />
					<span>Add a comment</span>
				</button>
			)}
			<RunCommentDrawer
				runId={runId}
				comment={comment}
				open={isOpen}
				onOpenChange={setIsOpen}
			/>
		</>
	);
}

interface RunCommentDrawerProps {
	runId: number;
	comment: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function RunCommentDrawer({
	runId,
	comment,
	open,
	onOpenChange
}: RunCommentDrawerProps) {
	const form = useForm<RunCommentFormValues>({
		values: { comment },
		resolver: zodResolver(RunCommentFormSchema)
	});
	const isSubmitting = form.formState.isSubmitting;
	const [updateRunComment] = bublikAPI.useUpdateRunCommentMutation();
	const [createRunComment] = bublikAPI.useCreateRunCommentMutation();
	const [deleteRunComment] = bublikAPI.useDeleteRunCommentMutation();

	const draft = form.watch('comment');
	const isCreate = comment === '';
	const isDelete = draft.trim() === '' && !isCreate;

	function handleOpenChange(next: boolean) {
		if (!next && isSubmitting) return;
		if (!next) form.reset({ comment });

		onOpenChange(next);
	}

	function save(text: string): Promise<unknown> {
		if (text === '') {
			const promise = deleteRunComment({ runId }).unwrap();
			toast.promise(promise, {
				loading: 'Deleting comment...',
				success: 'Comment deleted successfully',
				error: toastError('Failed to delete comment')
			});
			return promise;
		}

		const promise = isCreate
			? createRunComment({ runId, comment: text }).unwrap()
			: updateRunComment({ runId, comment: text }).unwrap();
		toast.promise(promise, {
			loading: isCreate ? 'Creating comment...' : 'Updating comment...',
			success: isCreate
				? 'Comment created successfully'
				: 'Comment updated successfully',
			error: toastError(
				isCreate ? 'Failed to create comment' : 'Failed to update comment'
			)
		});
		return promise;
	}

	async function onSubmit({ comment: text }: RunCommentFormValues) {
		const next = text.trim() === '' ? '' : text;

		// Nothing to delete: an empty comment on a run without one just closes.
		if (next === '' && isCreate) {
			onOpenChange(false);
			return;
		}

		try {
			await save(next);
			onOpenChange(false);
		} catch {
			// The toast reports it; the drawer stays open with the text.
		}
	}

	return (
		<DrawerRoot open={open} onOpenChange={handleOpenChange}>
			<DrawerContent
				portal
				className="w-screen max-w-3xl flex flex-col"
				data-testid="run-comment-drawer"
			>
				<div className="px-6 py-4 border-b border-border-primary shrink-0">
					<DrawerFormHeader
						name={isCreate ? 'Add Comment' : 'Edit Comment'}
						description="Markdown is supported. Clear the text to delete the comment."
						onClose={() => handleOpenChange(false)}
					/>
				</div>
				<div className="flex flex-col flex-1 min-h-0 overflow-y-auto styled-scrollbar">
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col flex-1 gap-6 px-6 pt-6"
					>
						<MarkdownEditor
							label="Comment"
							minRows={8}
							fill
							breaks
							placeholder="Run comment..."
							previewClassName={DESCRIPTION_MARKDOWN_CLASS}
							data-testid="run-comment-editor"
							{...form.register('comment')}
						/>
						{/* Pinned under the editor, as in the issue drawer. */}
						<div className="sticky bottom-0 z-20 mt-auto -mx-6 flex gap-3 bg-bg-primary px-6 py-4 shadow-sticky">
							<ButtonTw
								type="button"
								variant="secondary"
								size="md"
								rounded="lg"
								disabled={isSubmitting}
								onClick={() => handleOpenChange(false)}
								className="justify-center flex-1"
							>
								Cancel
							</ButtonTw>
							<ButtonTw
								type="submit"
								variant={isDelete ? 'destruction' : 'primary'}
								size="md"
								rounded="lg"
								disabled={isSubmitting}
								className="justify-center flex-1"
							>
								{isSubmitting ? (
									<Icon
										name="ProgressIndicator"
										size={20}
										className="mr-1.5 animate-spin"
									/>
								) : null}
								<span>
									{isDelete ? 'Delete' : isCreate ? 'Create' : 'Update'}
								</span>
							</ButtonTw>
						</div>
					</form>
				</div>
			</DrawerContent>
		</DrawerRoot>
	);
}

export { RunCommentFormContainer };
