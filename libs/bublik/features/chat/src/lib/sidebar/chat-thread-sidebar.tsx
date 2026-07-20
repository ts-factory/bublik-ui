/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2025-2026 OKTET LTD */
import { FormEvent, useState } from 'react';
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
	ConfirmDialog,
	Icon,
	Skeleton,
	toast,
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem
} from '@/shared/tailwind-ui';

export function ChatThreadSidebar() {
	const { threadId } = useParams();
	const navigate = useNavigateWithProject();
	const [showArchived, setShowArchived] = useState(false);
	const { data: threads, isLoading } = useGetChatThreadsQuery(
		showArchived ? { archived: true } : undefined
	);

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
		await promise;
		// Leaving the deleted thread open: start a fresh conversation.
		if (thread.id === threadId) handleNewChat();
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-border-primary">
				<span className="text-[0.8125rem] font-semibold text-text-primary">
					Threads
				</span>
				<ButtonTw size="xss" variant="primary" onClick={handleNewChat}>
					<Icon name="AddSymbol" className="size-4 mr-1" />
					New chat
				</ButtonTw>
			</div>

			<div className="flex-grow overflow-y-auto p-2">
				{isLoading ? (
					<Skeleton className="h-32 rounded-md" />
				) : !threads || threads.length === 0 ? (
					<p className="px-2 py-4 text-[0.8125rem] text-center text-text-secondary">
						No threads yet. Start a new chat.
					</p>
				) : (
					<ul className="flex flex-col gap-0.5">
						{threads.map((thread) => (
							<ThreadRow
								key={thread.id}
								thread={thread}
								isActive={thread.id === threadId}
								onDelete={() => handleDelete(thread)}
							/>
						))}
					</ul>
				)}
			</div>

			<div className="px-3 py-2 border-t border-border-primary">
				<label className="flex items-center gap-2 text-[0.75rem] text-text-secondary cursor-pointer">
					<input
						type="checkbox"
						checked={showArchived}
						onChange={(e) => setShowArchived(e.target.checked)}
					/>
					Show archived
				</label>
			</div>

			<ConfirmDialog
				open={isVisible}
				title="Delete thread"
				description={
					pendingDelete
						? `Delete "${pendingDelete.title || 'this thread'}"? This cannot be undone.`
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
					'flex-grow min-w-0 px-2 py-2 text-[0.8125rem] text-text-primary truncate',
					thread.is_archived && 'italic opacity-60'
				)}
				title={thread.title}
			>
				{thread.title || 'Untitled'}
			</LinkWithProject>
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label="Thread actions"
					className="px-2 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 text-text-menu"
				>
					<Icon name="SettingsSliders" className="size-3.5" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => setIsRenaming(true)}>
						Rename
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleArchiveToggle}>
						{thread.is_archived ? 'Unarchive' : 'Archive'}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</li>
	);
}
