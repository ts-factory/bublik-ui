/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */
import { FormEvent, useState } from 'react';
import { ArchiveIcon, ArchiveRestoreIcon, ChevronDownIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';

import {
	useGetChatThreadsQuery,
	useRenameChatThreadMutation,
	useSetChatThreadArchivedMutation,
	useDeleteChatThreadMutation,
	type ChatThreadListItem
} from '@/services/bublik-api';
import {
	LinkWithProject,
	useNavigateWithProject
} from '@/bublik/features/projects';
import { useConfirm } from '@/shared/hooks';
import {
	ButtonTw,
	cn,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	ConfirmDialog,
	Icon,
	Skeleton,
	toast,
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator
} from '@/shared/tailwind-ui';

export function ChatThreadSidebar() {
	const { threadId } = useParams();
	const navigate = useNavigateWithProject();
	const [archivedOpen, setArchivedOpen] = useState(false);
	// Poll so the background-streaming indicator appears/clears for threads other
	// than the active one (the active thread also refreshes via onFinish).
	const { data: threads, isLoading } = useGetChatThreadsQuery(
		{ archived: true },
		{ pollingInterval: 5000, refetchOnMountOrArgChange: true }
	);

	const activeThreads = threads?.filter((t) => !t.is_archived) ?? [];
	const archivedThreads = threads?.filter((t) => t.is_archived) ?? [];

	const [deleteThread] = useDeleteChatThreadMutation();
	const { confirmation, confirm, decline, isVisible } = useConfirm();
	const [pendingDelete, setPendingDelete] = useState<ChatThreadListItem | null>(
		null
	);

	function handleNewChat() {
		navigate(`/chat/${crypto.randomUUID()}`);
	}

	async function handleDelete(thread: ChatThreadListItem) {
		setPendingDelete(thread);
		const confirmed = await confirmation();
		setPendingDelete(null);
		if (!confirmed) return;

		const promise = deleteThread(thread.id).unwrap();
		toast.promise(promise, {
			success: 'Thread deleted',
			error: 'Failed to delete thread',
			loading: 'Deleting thread…'
		});
		try {
			await promise;
			// Leaving the deleted thread open: start a fresh conversation.
			if (thread.id === threadId) handleNewChat();
		} catch {
			// Error already surfaced via toast.promise above.
		}
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between gap-2 py-1 px-4 h-9 border-b border-border-primary">
				<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
					Threads
				</span>
				<ButtonTw size="xss" variant="secondary" onClick={handleNewChat}>
					<Icon name="AddSymbol" className="size-4 mr-1" />
					New Chat
				</ButtonTw>
			</div>

			<div className="flex-grow overflow-y-auto">
				{isLoading ? (
					<Skeleton className="h-32 rounded-md" />
				) : !threads || threads.length === 0 ? (
					<p className="px-2 py-4 text-[0.8125rem] text-center text-text-secondary">
						No threads yet. Start a new chat.
					</p>
				) : (
					<div className="flex flex-col">
						<section className="pb-1">
							<h3 className="px-3 text-[0.6875rem] font-semibold flex items-center text-text-primary uppercase tracking-wider h-9 border-b border-border-primary">
								Active
							</h3>
							{activeThreads.length === 0 ? (
								<p className="px-2 py-2 text-[0.8125rem] text-text-secondary">
									No active threads
								</p>
							) : (
								<ul className="flex flex-col gap-0.5 p-2">
									{activeThreads.map((thread) => (
										<ThreadRow
											key={thread.id}
											thread={thread}
											isActive={thread.id === threadId}
											onDelete={() => handleDelete(thread)}
										/>
									))}
								</ul>
							)}
						</section>

						<Collapsible
							open={archivedOpen}
							onOpenChange={setArchivedOpen}
							className=""
						>
							<CollapsibleTrigger className="flex border-y border-border-primary items-center gap-1 w-full px-3 py-1.5 h-9 text-[0.6875rem] font-semibold text-text-primary uppercase tracking-wider transition-colors focus:outline-none">
								<ChevronDownIcon
									className={cn(
										'size-3 transition-transform',
										archivedOpen ? 'rotate-0' : '-rotate-90'
									)}
								/>
								Archived ({archivedThreads.length})
							</CollapsibleTrigger>
							<CollapsibleContent>
								{archivedThreads.length === 0 ? (
									<p className="px-2 py-2 text-[0.8125rem] text-text-secondary">
										No archived threads
									</p>
								) : (
									<ul className="flex flex-col gap-0.5 p-2">
										{archivedThreads.map((thread) => (
											<ThreadRow
												key={thread.id}
												thread={thread}
												isActive={thread.id === threadId}
												onDelete={() => handleDelete(thread)}
											/>
										))}
									</ul>
								)}
							</CollapsibleContent>
						</Collapsible>
					</div>
				)}
			</div>

			<ConfirmDialog
				open={isVisible}
				title="Delete thread"
				description={
					pendingDelete
						? `Delete "${
								pendingDelete.title || 'this thread'
						  }"? This cannot be undone.`
						: 'Delete this thread? This cannot be undone.'
				}
				onCancelClick={decline}
				onConfirmClick={confirm}
			/>
		</div>
	);
}

interface ThreadRowProps {
	thread: ChatThreadListItem;
	isActive: boolean;
	onDelete: () => void;
}

function ThreadRow({ thread, isActive, onDelete }: ThreadRowProps) {
	const [isRenaming, setIsRenaming] = useState(false);
	const [title, setTitle] = useState(thread.title);
	const [renameThread] = useRenameChatThreadMutation();
	const [setArchived] = useSetChatThreadArchivedMutation();

	function submitRename(e: FormEvent) {
		e.preventDefault();
		const next = title.trim();
		setIsRenaming(false);
		if (!next || next === thread.title) {
			setTitle(thread.title);
			return;
		}
		const promise = renameThread({ id: thread.id, title: next }).unwrap();
		toast.promise(promise, {
			success: 'Thread renamed',
			error: 'Failed to rename thread',
			loading: 'Renaming…'
		});
	}

	function handleArchiveToggle() {
		const promise = setArchived({
			id: thread.id,
			is_archived: !thread.is_archived
		}).unwrap();
		toast.promise(promise, {
			success: thread.is_archived ? 'Thread unarchived' : 'Thread archived',
			error: 'Failed to update thread',
			loading: 'Updating…'
		});
	}

	if (isRenaming) {
		return (
			<li>
				<form onSubmit={submitRename} className="px-2 py-1">
					{/* eslint-disable-next-line jsx-a11y/no-autofocus */}
					<input
						autoFocus
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						onBlur={submitRename}
						className="w-full rounded-md border border-primary px-2 py-1 text-[0.8125rem] focus:outline-none"
					/>
				</form>
			</li>
		);
	}

	return (
		<li
			className={cn(
				'group flex items-center rounded-md hover:bg-primary-wash',
				isActive && 'bg-primary-wash'
			)}
		>
			<LinkWithProject
				to={`/chat/${thread.id}`}
				className={cn(
					'flex items-center gap-2 flex-grow min-w-0 px-2 py-2 text-[0.8125rem] text-text-primary',
					thread.is_archived && 'italic opacity-60'
				)}
				title={
					thread.is_streaming
						? `${thread.title || 'Untitled'} (streaming…)`
						: thread.title
				}
			>
				{thread.is_streaming ? (
					<span
						aria-label="Streaming"
						className="size-2 flex-shrink-0 rounded-full bg-primary animate-pulse"
					/>
				) : null}
				<span className="truncate">{thread.title || 'Untitled'}</span>
			</LinkWithProject>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Thread actions"
					className="px-2 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 text-text-menu"
				>
					<Icon name="ThreeDotsVertical" className="size-6" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-44">
					<DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="gap-2 px-2"
						onClick={() => setIsRenaming(true)}
					>
						<Icon name="Edit" className="size-3.5 shrink-0" />
						Rename
					</DropdownMenuItem>
					<DropdownMenuItem
						className="gap-2 px-2"
						onClick={handleArchiveToggle}
					>
						{thread.is_archived ? (
							<ArchiveRestoreIcon className="size-3.5 shrink-0" />
						) : (
							<ArchiveIcon className="size-3.5 shrink-0" />
						)}
						{thread.is_archived ? 'Unarchive' : 'Archive'}
					</DropdownMenuItem>
					<DropdownMenuItem
						className="gap-2 px-2 text-bg-error focus:text-bg-error focus:bg-bg-error/10"
						onClick={onDelete}
					>
						<Icon name="Bin" className="size-3.5 shrink-0" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</li>
	);
}
