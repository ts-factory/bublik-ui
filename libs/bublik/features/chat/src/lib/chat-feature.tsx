/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
	useChat,
	fetchServerSentEvents,
	type UIMessage
} from '@tanstack/ai-react';

import { config } from '@/bublik/config';
import {
	bublikAPI,
	BUBLIK_TAG,
	useGetChatModelsQuery,
	type ChatModel
} from '@/services/bublik-api';
import { useNavigateWithProject } from '@/bublik/features/projects';
import { ButtonTw, Icon, cn } from '@/shared/tailwind-ui';

import { serverPersistence } from './persistence';
import { ChatThreadSidebar } from './sidebar/chat-thread-sidebar';

/** A concrete model selection: which provider + model id to run. */
interface Selection {
	provider: string;
	model: string;
}

const SELECTION_DELIMITER = '|||';

function encodeSelection(s: Selection): string {
	return `${s.provider}${SELECTION_DELIMITER}${s.model}`;
}

function decodeSelection(value: string): Selection {
	const [provider, model] = value.split(SELECTION_DELIMITER);
	return { provider, model };
}

function chatUrl(
	selection: Selection,
	effort: string | null
): string {
	const params = new URLSearchParams({
		provider: selection.provider,
		model: selection.model
	});
	if (effort) params.set('effort', effort);
	return `${config.rootUrl}/api/v2/chat?${params.toString()}`;
}

export function ChatFeature() {
	return (
		<div className="flex h-full gap-1 p-2">
			<aside className="w-[300px] flex-shrink-0 overflow-hidden bg-white rounded-xl">
				<ChatThreadSidebar />
			</aside>
			<div className="flex flex-col flex-1 min-w-0 gap-1">
				<ChatPanel />
			</div>
		</div>
	);
}

function ChatPanel() {
	const { threadId } = useParams();
	const navigate = useNavigateWithProject();
	const { data, isLoading, error } = useGetChatModelsQuery();

	// Every conversation needs a stable id (the persistence + AG-UI key). For a
	// bare `/chat`, mint one and move to `/chat/:threadId`; the thread row is
	// created lazily in Postgres on the first persisted message.
	useEffect(() => {
		if (!threadId) navigate(`/chat/${crypto.randomUUID()}`, { replace: true });
	}, [threadId, navigate]);

	const providers = useMemo(() => data?.providers ?? [], [data?.providers]);
	const flatModels = useMemo(
		() =>
			providers.flatMap((p) =>
				p.models.map((m) => ({ provider: p.id, providerName: p.display_name, model: m }))
			),
		[providers]
	);

	const [selection, setSelection] = useState<Selection | null>(null);
	const [effort, setEffort] = useState<string | null>(null);

	// Initialise the selection from `default_model` (falling back to the first
	// model) once the config has loaded.
	useEffect(() => {
		if (selection || flatModels.length === 0) return;
		const fallback = { provider: flatModels[0].provider, model: flatModels[0].model.name };
		const next =
			data?.default_model &&
			flatModels.some(
				(m) =>
					m.provider === data.default_model?.provider &&
					m.model.name === data.default_model?.model
			)
				? { provider: data.default_model.provider, model: data.default_model.model }
				: fallback;
		setSelection(next);
	}, [data?.default_model, flatModels, selection]);

	const selectedModel: ChatModel | undefined = useMemo(
		() =>
			flatModels.find(
				(m) => m.provider === selection?.provider && m.model.name === selection?.model
			)?.model,
		[flatModels, selection]
	);

	// Keep the effort in sync with the selected model: reset to its default when
	// the model changes, clear it when the model has no reasoning effort.
	useEffect(() => {
		if (!selectedModel?.supports_reasoning_effort) {
			setEffort(null);
			return;
		}
		setEffort(
			selectedModel.default_reasoning_effort ??
				selectedModel.reasoning_efforts[0] ??
				null
		);
	}, [selectedModel]);

	return (
		<div className="flex flex-col flex-grow min-h-0 gap-1">
			<header className="flex items-center justify-between px-6 py-4 bg-white rounded-t-xl">
				<div className="flex items-center gap-2">
					<Icon name="Bulb" className="size-5 text-primary" />
					<h1 className="text-[1.125rem] font-semibold text-text-primary">
						Bublik Assistant
					</h1>
				</div>
				{selection ? (
					<div className="flex items-center gap-2">
						<select
							value={encodeSelection(selection)}
							onChange={(e) => setSelection(decodeSelection(e.target.value))}
							className="rounded-md border border-border-primary bg-white px-2 py-1 text-[0.8125rem] text-text-primary focus:outline-none focus:border-primary"
						>
							{providers.map((p) => (
								<optgroup key={p.id} label={p.display_name}>
									{p.models.map((m) => (
										<option
											key={`${p.id}:${m.name}`}
											value={encodeSelection({ provider: p.id, model: m.name })}
										>
											{m.display_name}
										</option>
									))}
								</optgroup>
							))}
						</select>
						{selectedModel?.supports_reasoning_effort &&
						selectedModel.reasoning_efforts.length > 0 ? (
							<select
								value={effort ?? ''}
								onChange={(e) => setEffort(e.target.value)}
								className="rounded-md border border-border-primary bg-white px-2 py-1 text-[0.8125rem] text-text-primary focus:outline-none focus:border-primary"
								title="Reasoning effort"
							>
								{selectedModel.reasoning_efforts.map((eff) => (
									<option key={eff} value={eff}>
										{eff}
									</option>
								))}
							</select>
						) : null}
					</div>
				) : null}
			</header>
			{isLoading ? (
				<div className="flex items-center justify-center flex-grow bg-white rounded-b-xl text-[0.8125rem] text-text-secondary">
					Loading models…
				</div>
			) : error || flatModels.length === 0 ? (
				<NoModelsState />
			) : selection && threadId ? (
				/*
				 * Remount the thread when the thread id, model or effort changes:
				 * useChat recreates its client (and rehydrates from persistence) on
				 * id/connection change, so a `key` is the supported way to swap it.
				 */
				<ChatThread
					key={`${threadId}:${chatUrl(selection, effort)}`}
					threadId={threadId}
					url={chatUrl(selection, effort)}
				/>
			) : null}
		</div>
	);
}

function NoModelsState() {
	return (
		<div className="flex flex-col items-center justify-center flex-grow gap-3 bg-white rounded-b-xl text-center px-6">
			<Icon name="Bulb" className="size-10 text-primary" />
			<p className="text-[1rem] font-semibold text-text-primary">
				No chat models configured
			</p>
			<p className="max-w-md text-[0.8125rem] text-text-secondary">
				Ask an admin to create an active <span className="font-mono">ai</span>{' '}
				global configuration listing the available LLM providers and models.
			</p>
		</div>
	);
}

function ChatThread({ threadId, url }: { threadId: string; url: string }) {
	const dispatch = useDispatch();
	const [input, setInput] = useState('');
	const { messages, sendMessage, isLoading, error, stop } = useChat({
		id: threadId,
		connection: fetchServerSentEvents(url),
		persistence: serverPersistence,
		// A finished response means the thread was just persisted (created or
		// updated); refresh the sidebar so the new thread + auto title appear.
		onFinish: () => {
			dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.Chat]));
		}
	});

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed || isLoading) return;
		setInput('');
		void sendMessage(trimmed);
	}

	return (
		<main className="flex flex-col flex-grow min-h-0 bg-white rounded-b-xl">
			<div className="flex-grow overflow-y-auto px-6 py-4">
				{messages.length === 0 ? (
					<EmptyState />
				) : (
					<ul className="flex flex-col gap-4">
						{messages.map((message) => (
							<ChatMessage key={message.id} message={message} />
						))}
					</ul>
				)}
				{isLoading ? (
					<div className="mt-3 text-[0.8125rem] text-text-secondary animate-pulse">
						Assistant is thinking…
					</div>
				) : null}
				{error ? (
					<p
						role="alert"
						className="mt-3 px-3 py-2 text-[0.8125rem] rounded-md text-bg-error bg-bg-error/10"
					>
						{error.message}
					</p>
				) : null}
			</div>
			<form
				onSubmit={handleSubmit}
				className="flex items-end gap-2 p-4 border-t border-border-primary"
			>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
					}}
					rows={1}
					placeholder="Ask about runs, results, logs, history…"
					className="flex-grow resize-none rounded-lg border border-border-primary px-4 py-2 text-[0.875rem] focus:outline-none focus:border-primary"
				/>
				{isLoading ? (
					<ButtonTw type="button" variant="outline" onClick={stop}>
						Stop
					</ButtonTw>
				) : (
					<ButtonTw type="submit" variant="primary" disabled={!input.trim()}>
						Send
					</ButtonTw>
				)}
			</form>
		</main>
	);
}

function EmptyState() {
	const examples = [
		'List the test runs from today',
		'Give me an overview of run 12345',
		'Show unexpected results for the latest run'
	];
	return (
		<div className="flex flex-col items-center justify-center h-full gap-4 text-center">
			<Icon name="Bulb" className="size-10 text-primary" />
			<div>
				<p className="text-[1rem] font-semibold text-text-primary">
					Ask Bublik anything about your test results
				</p>
				<p className="text-[0.8125rem] text-text-secondary">
					The assistant can query runs, results, logs, history and the
					dashboard.
				</p>
			</div>
			<ul className="flex flex-col gap-1 text-[0.8125rem] text-text-secondary">
				{examples.map((e) => (
					<li key={e}>“{e}”</li>
				))}
			</ul>
		</div>
	);
}

function ChatMessage({ message }: { message: UIMessage }) {
	const isUser = message.role === 'user';
	return (
		<li className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
			<span className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-text-secondary">
				{isUser ? 'You' : 'Assistant'}
			</span>
			<div
				className={cn(
					'max-w-[80%] rounded-xl px-4 py-2 text-[0.875rem]',
					isUser
						? 'bg-primary text-white'
						: 'bg-primary-wash text-text-primary'
				)}
			>
				{message.parts.map((part, idx) => (
					<MessagePartView key={idx} part={part} />
				))}
			</div>
		</li>
	);
}

function MessagePartView({ part }: { part: UIMessage['parts'][number] }) {
	switch (part.type) {
		case 'text':
			return <div className="whitespace-pre-wrap break-words">{part.content}</div>;
		case 'thinking':
			return (
				<div className="my-1 text-[0.8125rem] italic text-text-secondary whitespace-pre-wrap">
					💭 {part.content}
				</div>
			);
		case 'tool-call':
			return <ToolCallView part={part} />;
		case 'tool-result':
			return null; // result is surfaced via the matching tool-call's output
		case 'structured-output':
			return (
				<pre className="my-1 overflow-x-auto rounded-md bg-white/60 p-2 text-[0.75rem]">
					{JSON.stringify(part.data ?? part.partial ?? part.raw, null, 2)}
				</pre>
			);
		default:
			return null;
	}
}

function ToolCallView({
	part
}: {
	part: Extract<UIMessage['parts'][number], { type: 'tool-call' }>;
}) {
	const [open, setOpen] = useState(false);
	const done = part.state === 'complete' || part.output !== undefined;
	return (
		<div className="my-1 rounded-md border border-border-primary bg-white/70">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-center gap-2 px-2 py-1 text-[0.75rem] font-medium text-text-primary"
			>
				<Icon
					name="SettingsSliders"
					className={cn('size-3.5', done ? 'text-primary' : 'text-text-menu')}
				/>
				<span className="font-mono">{part.name}</span>
				<span className="text-text-secondary">
					{done ? 'done' : part.state}
				</span>
				<Icon
					name="ChevronDown"
					className={cn('ml-auto size-3.5 transition-transform', open && 'rotate-180')}
				/>
			</button>
			{open ? (
				<div className="px-2 pb-2 text-[0.7188rem]">
					{part.arguments ? (
						<pre className="overflow-x-auto rounded bg-primary-wash p-1.5">
							{part.arguments}
						</pre>
					) : null}
					{part.output !== undefined ? (
						<pre className="mt-1 overflow-x-auto rounded bg-primary-wash p-1.5">
							{typeof part.output === 'string'
								? part.output
								: JSON.stringify(part.output, null, 2)}
						</pre>
					) : null}
				</div>
			) : null}
		</div>
	);
}
