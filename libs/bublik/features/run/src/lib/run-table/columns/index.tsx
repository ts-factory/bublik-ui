/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { PopoverClose, PopoverPortal } from '@radix-ui/react-popover';
import { toast } from 'sonner';
import { groupBy } from 'remeda';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { skipToken } from '@reduxjs/toolkit/query';
import { To } from 'react-router-dom';

import {
	CreateTestCommentParams,
	EditTestCommentParams,
	MergedRun,
	NodeEntity,
	RunData,
	RunDataComment
} from '@/shared/types';
import { useConfirm } from '@/shared/hooks';
import {
	useCreateTestCommentMutation,
	useDeleteTestCommentMutation,
	useEditTestCommentMutation,
	useGetRunDetailsQuery
} from '@/services/bublik-api';
import {
	ButtonTw,
	cn,
	ConfirmDialog,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Icon,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
	TableNode,
	Tooltip
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { getTreeNode } from '@/bublik/run-utils';
import { HistorySearchBuilder } from '@/shared/utils';
import { stringifySearch } from '@/router';

import { badgeColumns } from './badge-columns';
import { ColumnId } from '../types';
import { COLUMN_GROUPS } from '../constants';

function getHistoryViewLink(
	path: string[],
	runIds: number[],
	maybeDate?: string
): To {
	const query = new HistorySearchBuilder(path.join('/')).withRunIds(runIds);
	if (maybeDate) query.withAnchorDate(maybeDate);

	return { pathname: '/history', search: stringifySearch(query.build()) };
}

interface HistoryRunLinksDropdownMenuProps {
	runIds: number[];
	path: string[];
}

function HistoryRunLinksDropdownMenu(props: HistoryRunLinksDropdownMenuProps) {
	const { runIds, path } = props;
	const [open, setOpen] = useState(false);
	const { data } = useGetRunDetailsQuery(props.runIds?.[0] ?? skipToken);
	const historyLink = getHistoryViewLink(path, runIds, data?.finish);

	return (
		<DropdownMenu onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<button
					className={cn(
						'inline-flex items-center justify-center transition-all appearance-none select-none text-[0.6875rem] font-semibold leading-[0.875rem] max-h-[26px] rounded-md hover:shadow-[inset_0_0_0_2px_#94b0ff]',
						'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
						'disabled:shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] disabled:bg-white disabled:hover:bg-white disabled:text-border-primary',
						'p-[3px]',
						open
							? 'bg-primary text-white'
							: 'hover:bg-primary-wash text-primary'
					)}
				>
					<Icon name="ArrowShortTop" size={18} className={cn('rotate-180')} />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuLabel>Open Direct Search</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<LinkWithProject to={historyLink} className="pl-2">
						<Icon
							name="BoxArrowRight"
							size={20}
							className="mr-2 text-primary"
						/>
						<span>History View Of Results In The Run</span>
					</LinkWithProject>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface GetColumnsOptions {
	projectId?: number;
	runIds?: number[];
}

function getColumns({ projectId, runIds }: GetColumnsOptions) {
	const helper = createColumnHelper<RunData | MergedRun>();

	const treeColumn: ColumnDef<RunData> = {
		id: ColumnId.Tree,
		accessorFn: getTreeNode,
		header: 'Tree',
		cell: ({ getValue, row }) => {
			const node = getValue<ReturnType<typeof getTreeNode>>();

			if (!node) return null;

			const { name, type } = node;

			return (
				<TableNode
					nodeName={name}
					nodeType={type}
					onClick={() => row.toggleExpanded()}
					isExpanded={row.getIsExpanded()}
					depth={row.depth}
					trailing={
						runIds && runIds.length === 1 && type === NodeEntity.Test ? (
							<HistoryRunLinksDropdownMenu
								runIds={runIds}
								path={row.original.path}
							/>
						) : null
					}
				/>
			);
		},
		enableSorting: false
	};

	const columns = [
		treeColumn,
		helper.accessor('objective', {
			id: ColumnId.Objective,
			header: 'Objective',
			cell: ({ cell }) => {
				const objective = cell.getValue();

				if (!objective) return;

				return (
					<Popover modal>
						<PopoverTrigger asChild>
							<button className="max-w-[15vw] 2xl:max-w-[20vw] text-left w-full group relative block h-full hover:bg-primary-wash px-2">
								<div className="absolute flex items-center right-0 top-1/2 -translate-y-1/2 z-10 h-full opacity-0 group-hover:opacity-100 transition-opacity">
									<div className="w-6 h-full bg-gradient-to-r from-transparent to-white" />
									<div className="grid place-items-center bg-white w-6 h-full pr-2">
										<Icon
											name="ChevronDown"
											size={16}
											className="text-primary"
										/>
									</div>
								</div>
								<pre className="truncate relative text-xs block max-w-[80ch] font-body">
									{objective}
								</pre>
							</button>
						</PopoverTrigger>
						<PopoverPortal>
							<PopoverPrimitive.Content
								align="start"
								sideOffset={0}
								className={cn(
									'outline-none bg-white shadow-popover p-1 rounded-lg z-50 -translate-y-[26px] -translate-x-[8px] transition-none',
									'rdx-state-open:animate-fade-in rdx-state-closed:animate-fade-out'
								)}
								style={{ transform: 'translateY(-74px) translateX(-4px)' }}
							>
								<h2 className="px-2 py-1.5 font-semibold text-xs">Objective</h2>
								<Separator className="h-px my-1" />
								<pre className="p-2 text-xs font-body">{objective}</pre>
							</PopoverPrimitive.Content>
						</PopoverPortal>
					</Popover>
				);
			},
			meta: { className: 'w-px px-0' }
		}),
		helper.accessor('comments', {
			id: ColumnId.Comments,
			header: () => <div className="px-2 text-left">Notes</div>,
			cell: ({ cell, row }) => {
				const comments = cell.getValue();

				if (!projectId) return null;
				if (!('result_id' in row.original)) return null;

				return (
					<TestComments
						comments={comments}
						testId={row.original.result_id}
						projectId={projectId}
					/>
				);
			},
			enableSorting: false,
			meta: { className: 'text-right w-px px-0' }
		}),
		...badgeColumns
	] as ColumnDef<RunData | MergedRun>[];

	const groupedColumns = groupBy(
		columns,
		(c) => COLUMN_GROUPS.find((g) => g.columns.includes(c.id as ColumnId))?.id
	);

	return Object.entries(groupedColumns).map(([id, columns]) => {
		const group = COLUMN_GROUPS.find((g) => g.id === id);

		return helper.group({
			id: id,
			header: group?.label as any,
			columns: columns as ColumnDef<RunData | MergedRun>[],
			meta: { className: group?.className }
		});
	});
}

function useTestComment() {
	const [createTestCommentMutation] = useCreateTestCommentMutation();
	const [editTestCommentMutation] = useEditTestCommentMutation();
	const [deleteTestCommentMutation] = useDeleteTestCommentMutation();

	async function createTestComment(params: CreateTestCommentParams) {
		try {
			const promise = createTestCommentMutation(params).unwrap();

			toast.promise(promise, {
				loading: 'Creating note...',
				error: 'Failed to create note!',
				success: 'Successfully created note.'
			});
		} catch (e) {
			if (e instanceof Error) toast.error(e.message);
			console.error(e);
		}
	}

	async function editTestComment(params: EditTestCommentParams) {
		if (params.comment === '' || !params.comment) {
			try {
				const promise = deleteTestCommentMutation(params).unwrap();
				toast.promise(promise, {
					loading: 'Deleting note...',
					error: 'Failed to delete note!',
					success: 'Successfully deleted note.'
				});
			} catch (e) {
				if (e instanceof Error) toast.error(e.message);
				console.error(e);
			}
			return;
		}

		try {
			const promise = editTestCommentMutation(params).unwrap();
			toast.promise(promise, {
				loading: 'Editing note...',
				error: 'Failed to edit note!',
				success: 'Successfully edited note.'
			});
		} catch (e) {
			if (e instanceof Error) toast.error(e.message);
			console.error(e);
		}
	}

	return { createTestComment, editTestComment };
}

const EditCommentSchema = z.object({ comment: z.string() });

type EditCommentForm = z.infer<typeof EditCommentSchema>;

interface CommentEditorProps {
	label: string;
	onSubmit: (form: EditCommentForm) => void;
	defaultValues?: EditCommentForm;
	variant?: 'form' | 'input';
	submitLabel?: string;
}

function CommentEditor(props: CommentEditorProps) {
	const {
		label,
		onSubmit,
		defaultValues = { comment: '' },
		variant = 'form',
		submitLabel
	} = props;
	const { register, handleSubmit, formState } = useForm<EditCommentForm>({
		defaultValues,
		resolver: zodResolver(
			EditCommentSchema.refine(
				(c) =>
					defaultValues.comment ? c.comment !== defaultValues.comment : true,
				{ path: ['comment'], message: 'Note must be different from current!' }
			)
		)
	});

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
			{variant === 'form' ? (
				<div className="flex items-center justify-between">
					<h2 className="text-[0.875rem] leading-[1.125rem] font-semibold text-left">
						{label}
					</h2>
					<PopoverClose>
						<Icon name="Cross" className="size-3 text-text-menu" />
					</PopoverClose>
				</div>
			) : null}
			<textarea
				{...register('comment')}
				className={cn(
					'w-full px-3.5 py-[7px] outline-none border border-border-primary rounded text-text-secondary transition-all hover:border-primary disabled:text-text-menu disabled:cursor-not-allowed focus:border-primary focus:shadow-text-field active:shadow-none focus:ring-transparent text-xs'
				)}
				placeholder="Example note..."
				rows={variant === 'form' ? 5 : undefined}
			/>
			{formState.errors.comment ? (
				<span className="text-text-unexpected">
					{formState.errors.comment.message}
				</span>
			) : null}
			<ButtonTw
				type="submit"
				variant="primary"
				size="xss"
				disabled={formState.isSubmitting}
			>
				{submitLabel ?? 'Submit'}
			</ButtonTw>
		</form>
	);
}

interface TestCommentsProps {
	testId: number;
	projectId: number;
	comments?: Array<RunDataComment>;
}

function TestComments(props: TestCommentsProps) {
	const { comments, testId, projectId } = props;
	const { createTestComment, editTestComment } = useTestComment();
	const { confirm, confirmation, decline, isVisible } = useConfirm();

	async function handleCreateTestCommentClick(comment: string) {
		await createTestComment({ testId, comment, projectId });
	}

	async function handleEditTestCommentClick(
		commentId: number,
		comment: string
	) {
		if (comment === '') {
			const isConfirmed = await confirmation();

			if (!isConfirmed) return;
		}

		await editTestComment({ commentId, testId, comment, projectId });
	}

	const [input, setInput] = useState('');
	const [editId, setEditId] = useState<number | null>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	if (!comments || !comments?.length) {
		return (
			<div className="flex items-center gap-1 justify-end pr-2">
				<Popover>
					<Tooltip content="Add Node">
						<PopoverTrigger asChild>
							<ButtonTw variant="secondary" size="xss" className="size-6">
								<Icon name="FilePlus" className="size-5 shrink-0" />
								<span className="sr-only">Add Note</span>
							</ButtonTw>
						</PopoverTrigger>
					</Tooltip>
					<PopoverPortal container={document.body}>
						<PopoverContent
							className={cn(
								'relative p-4 bg-white rounded-md w-96 shadow-popover'
							)}
							align="end"
							sideOffset={8}
						>
							<CommentEditor
								label="Add Note"
								onSubmit={(f) => handleCreateTestCommentClick(f.comment)}
							/>
						</PopoverContent>
					</PopoverPortal>
				</Popover>
			</div>
		);
	}

	const c = comments.at(0);

	if (!c) return;

	return (
		<div
			key={c.comment_id}
			className="flex items-center gap-2 justify-end max-w-[15vw] px-2"
		>
			<Popover
				onOpenChange={(open) => {
					if (open) return;
					setInput('');
					setEditId(null);
				}}
				modal
			>
				<pre className="truncate font-body block max-w-[80ch]">{c.comment}</pre>
				<Tooltip content="Show All Notes">
					<PopoverTrigger asChild>
						<ButtonTw variant="secondary" size="xss" className="size-6">
							<Icon name="ArrowLeanUp" className="size-5 rotate-180 shrink-0" />
						</ButtonTw>
					</PopoverTrigger>
				</Tooltip>
				<Popover>
					<Tooltip content="Edit Note">
						<PopoverTrigger asChild>
							<ButtonTw
								variant="secondary"
								size="xss"
								aria-label="Edit Note"
								className="size-6"
							>
								<Icon name="Edit" className="size-5 shrink-0" />
							</ButtonTw>
						</PopoverTrigger>
					</Tooltip>

					<PopoverPortal>
						<PopoverContent
							className={cn(
								'relative p-4 bg-white rounded-md w-96 shadow-popover'
							)}
							sideOffset={8}
							align="end"
						>
							<CommentEditor
								label="Edit Note"
								onSubmit={(f) =>
									handleEditTestCommentClick(Number(c.comment_id), f.comment)
								}
								defaultValues={{ comment: c.comment }}
								submitLabel="Edit"
							/>
						</PopoverContent>
					</PopoverPortal>
				</Popover>
				<PopoverPortal>
					<PopoverContent
						className="relative p-4 bg-white rounded-md w-96 shadow-popover"
						sideOffset={8}
						align="end"
					>
						<ConfirmDialog
							open={isVisible}
							title="Are you sure you want to delete this note?"
							description="This action cannot be undone."
							confirmLabel="Delete"
							onCancelClick={decline}
							onConfirmClick={confirm}
						/>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-[0.875rem] leading-[1.125rem] font-semibold text-left">
								Notes
							</h2>
							<PopoverClose className="size-6 grid place-items-center">
								<Icon name="Cross" className="size-3 text-text-menu" />
							</PopoverClose>
						</div>
						<ul className="flex flex-col gap-2">
							{comments.map((c) => (
								<li key={c.comment_id} className="flex gap-2">
									<div className="flex flex-col gap-1 bg-primary-wash rounded-md p-2 flex-1">
										<p className="text-left text-[11px]">{c.comment}</p>
										<span className="text-slate-500 text-right text-[11px] line-clamp-1">
											{format(new Date(c.updated), 'MMM dd, yyyy')} at{' '}
											{format(new Date(c.updated), 'HH:mm')}
										</span>
									</div>
									<div className="flex flex-col gap-2">
										<Tooltip content="Edit Note">
											<ButtonTw
												variant="ghost"
												size="xss"
												aria-label="Edit Note"
												className="size-6"
												onClick={() => {
													setInput(c.comment);
													setEditId(Number(c.comment_id));
													inputRef.current?.focus();
												}}
											>
												<Icon
													name="Edit"
													className="size-5 shrink-0 text-blue-500"
												/>
											</ButtonTw>
										</Tooltip>
										<Tooltip content="Delete Note">
											<ButtonTw
												variant="destruction-secondary"
												size="xss"
												aria-label="Delete Note"
												className="size-6"
												onClick={() =>
													handleEditTestCommentClick(Number(c.comment_id), '')
												}
											>
												<Icon name="Bin" className="size-5 shrink-0" />
											</ButtonTw>
										</Tooltip>
									</div>
								</li>
							))}
						</ul>
						<div className="mt-4 flex flex-col gap-2">
							<textarea
								className={cn(
									'w-full px-3.5 py-[7px] outline-none border border-border-primary rounded text-text-secondary transition-all hover:border-primary disabled:text-text-menu disabled:cursor-not-allowed focus:border-primary focus:shadow-text-field active:shadow-none focus:ring-transparent text-xs'
								)}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Add note..."
								ref={inputRef}
								rows={4}
							/>
							<div className="flex items-center gap-2">
								<ButtonTw
									onClick={async () => {
										if (!input) return;

										try {
											if (editId) {
												await handleEditTestCommentClick(editId, input);
											} else {
												await handleCreateTestCommentClick(input);
											}
										} catch (e) {
											return;
										}
										setEditId(null);
										setInput('');
									}}
									variant="primary"
									size="xs"
									className="flex-1"
								>
									{editId ? 'Edit' : 'Add Note'}
								</ButtonTw>
								{editId ? (
									<Tooltip content="Cancel">
										<button
											className="inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all appearance-none select-none text-primary bg-primary-wash disabled:shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] disabled:bg-white disabled:hover:bg-white disabled:text-border-primary px-1.5 text-[0.6875rem] font-semibold leading-[0.875rem] rounded-md hover:shadow-[inset_0_0_0_2px_#94b0ff] py-1.5 size-[30px]"
											onClick={() => {
												setEditId(null);
												setInput('');
												inputRef.current?.focus();
											}}
										>
											<Icon name="Cross" className="size-3.5" />
										</button>
									</Tooltip>
								) : null}
							</div>
						</div>
					</PopoverContent>
				</PopoverPortal>
			</Popover>
		</div>
	);
}

export { getColumns };
