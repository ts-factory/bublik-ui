/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	FormEvent,
	MutableRefObject,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useChat, type UIMessage } from '@tanstack/ai-react';
import {
	CheckIcon,
	CopyIcon,
	DownloadIcon,
	FoldHorizontalIcon,
	RefreshCwIcon,
	UnfoldHorizontalIcon
} from 'lucide-react';

import { config } from '@/bublik/config';
import {
	bublikAPI,
	BUBLIK_TAG,
	useGetChatModelsQuery,
	useGetChatThreadQuery,
	useCancelChatRunMutation,
	type ChatContextUsage,
	type ChatModel,
	type ChatProvider
} from '@/services/bublik-api';
import { useNavigateWithProject } from '@/bublik/features/projects';
import { useCopyToClipboard, useLocalStorage } from '@/shared/hooks';
import { ButtonTw, Icon, Tooltip, cn, toast } from '@/shared/tailwind-ui';

import {
	ContextUsageIndicator,
	Conversation,
	ConversationContent,
	ConversationScrollButton,
	EffortSelect,
	FileCard,
	Loader,
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	ModelSelect,
	PromptInput,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
	Response,
	StreamingIndicator,
	Suggestion,
	Suggestions,
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
	getToolOutput,
	getToolStatus,
	isPartStreaming,
	parseGeneratedFile
} from './elements';
import { serverPersistence, reviveCreatedAt } from './persistence';
import { sanitizeWireMessages } from './sanitize';
import { regroupTrailingReasoning } from './regroup-reasoning';
import { createResumableConnection } from './connection';
import {
	threadToMarkdown,
	downloadMarkdown,
	messageText
} from './thread-markdown';
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

function chatUrl(selection: Selection, effort: string | null): string {
	const params = new URLSearchParams({
		provider: selection.provider,
		model: selection.model
	});
	if (effort) params.set('effort', effort);
	return `${config.rootUrl}/api/v2/chat?${params.toString()}`;
}

/**
 * Model/effort picker state. Owned by ChatPanel (it drives the thread remount
 * key) but rendered inside the prompt input toolbar, so it is threaded down
 * through ChatThread -> ChatThreadConversation.
 */
interface ModelControls {
	providers: ChatProvider[];
	selection: Selection;
	onSelectionChange: (selection: Selection) => void;
	selectedModel: ChatModel | undefined;
	effort: string | null;
	onEffortChange: (effort: string) => void;
}

export function ChatFeature() {
	return (
		<div className="flex h-full gap-1 p-2">
			<aside className="w-[300px] flex-shrink-0 overflow-hidden bg-white rounded-md">
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
	const { data, isLoading, error } = useGetChatModelsQuery(undefined, {
		refetchOnMountOrArgChange: true
	});

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
				p.models.map((m) => ({
					provider: p.id,
					providerName: p.name,
					model: m
				}))
			),
		[providers]
	);

	const [selection, setSelection] = useLocalStorage<Selection | null>(
		'chat-model-selection',
		null
	);
	const [effort, setEffort] = useLocalStorage<string | null>(
		'chat-reasoning-effort',
		null
	);
	const [centered, setCentered] = useLocalStorage<boolean>(
		'chat-centered-layout',
		true
	);
	// Latest live messages, written by the conversation on each render so the
	// header export actions can read them at click time without re-rendering
	// the panel on every streamed token.
	const messagesRef = useRef<UIMessage[]>([]);

	function exportMarkdown(): string | null {
		const markdown = threadToMarkdown(messagesRef.current);
		if (!markdown) {
			toast.error('Nothing to export yet');
			return null;
		}
		return markdown;
	}

	function handleCopyMarkdown() {
		const markdown = exportMarkdown();
		if (markdown === null) return;
		navigator.clipboard
			.writeText(markdown)
			.then(() => toast.success('Thread copied as Markdown'))
			.catch(() => toast.error('Failed to copy to clipboard'));
	}

	function handleDownloadMarkdown() {
		const markdown = exportMarkdown();
		if (markdown === null) return;
		downloadMarkdown(`chat-${threadId ?? 'thread'}.md`, markdown);
	}

	// Initialise the selection from `default_model` (falling back to the first
	// model) once the config has loaded.
	useEffect(() => {
		if (selection || flatModels.length === 0) return;
		const fallback = {
			provider: flatModels[0].provider,
			model: flatModels[0].model.id
		};
		const next =
			data?.default_model &&
			flatModels.some(
				(m) =>
					m.provider === data.default_model?.provider &&
					m.model.id === data.default_model?.model
			)
				? {
						provider: data.default_model.provider,
						model: data.default_model.model
				  }
				: fallback;
		setSelection(next);
	}, [data?.default_model, flatModels, selection, setSelection]);

	const selectedModel: ChatModel | undefined = useMemo(
		() =>
			flatModels.find(
				(m) =>
					m.provider === selection?.provider &&
					m.model.id === selection?.model
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
	}, [selectedModel, setEffort]);

	return (
		<div className="flex flex-col flex-grow min-h-0">
			<header className="flex items-center justify-between bg-white gap-2 py-1 px-4 h-9 border-b border-border-primary rounded-t-md">
				<div className="flex items-center gap-2">
					<h1 className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
						Chat
					</h1>
				</div>
				<div className="flex items-center gap-1">
					<ButtonTw
						size="xss"
						variant="secondary"
						onClick={handleCopyMarkdown}
						title="Copy thread as Markdown"
					>
						<CopyIcon className="mr-1 size-3.5" />
						Copy
					</ButtonTw>
					<ButtonTw
						size="xss"
						variant="secondary"
						onClick={handleDownloadMarkdown}
						title="Download thread as Markdown"
					>
						<DownloadIcon className="mr-1 size-3.5" />
						Download
					</ButtonTw>
					<ButtonTw
						size="xss"
						variant="secondary"
						onClick={() => setCentered((v) => !v)}
						title={
							centered
								? 'Let the thread span the whole width'
								: 'Constrain the thread to a centered column'
						}
					>
						{centered ? (
							<>
								<UnfoldHorizontalIcon className="mr-1 size-3.5" />
								Full Width
							</>
						) : (
							<>
								<FoldHorizontalIcon className="mr-1 size-3.5" />
								Center
							</>
						)}
					</ButtonTw>
				</div>
			</header>
			{isLoading ? (
				<div className="flex items-center justify-center flex-grow bg-white rounded-b-xl text-[0.8125rem] text-text-secondary">
					Loading models…
				</div>
			) : error || flatModels.length === 0 ? (
				<NoModelsState />
			) : selection && threadId ? (
				/*
				 * Remount the thread when the thread id changes, not on model/effort
				 * change. The connection uses dynamic URL getters that read the
				 * current model/effort from the url prop on each request.
				 */
				<ChatThread
					key={threadId}
					threadId={threadId}
					url={chatUrl(selection, effort)}
					centered={centered}
					messagesRef={messagesRef}
					modelControls={{
						providers,
						selection,
						onSelectionChange: setSelection,
						selectedModel,
						effort,
						onEffortChange: setEffort
					}}
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

/**
 * Drop the in-flight run's output (everything after the last user message) from
 * the seed when a run is still active.
 *
 * The live Redis replay rebuilds the active run from scratch, but assistant
 * messages are persisted under client-generated ids (`msg-<ts>-<rand>`, see
 * `generateMessageId` in @tanstack/ai) that are regenerated on each replay --
 * so a seeded copy and the replayed copy don't reconcile by id and render
 * twice. Keeping only up to the last user message (the replay never re-emits
 * user messages) lets the replay be the sole source for the active turn while
 * preserving every user message. Finished threads have no replay, so the full
 * history is kept.
 */
function seedForActiveRun(
	messages: UIMessage[],
	hasActiveRun: boolean
): UIMessage[] {
	if (!hasActiveRun) return messages;
	let lastUserIdx = -1;
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === 'user') {
			lastUserIdx = i;
			break;
		}
	}
	return lastUserIdx === -1 ? messages : messages.slice(0, lastUserIdx + 1);
}

/**
 * Loads the thread's persisted history before mounting the conversation, then
 * seeds it into `useChat` via `initialMessages`. This is what fixes resume:
 * `useChat`'s async `getItem` hydration races the live Redis replay and is
 * discarded when the replay (assistant-only) arrives first, dropping every user
 * message. Providing the history synchronously at construction sidesteps the
 * race -- the conversation starts populated and the replay merges by message id.
 */
function ChatThread({
	threadId,
	url,
	centered,
	messagesRef,
	modelControls
}: {
	threadId: string;
	url: string;
	centered: boolean;
	messagesRef: MutableRefObject<UIMessage[]>;
	modelControls: ModelControls;
}) {
	// A brand-new thread has no row yet (404); treat that (and any error) as an
	// empty history rather than blocking the chat. `isLoading` is only true on the
	// first fetch with no cached data, so a background refetch never re-gates.
	const { data, isLoading } = useGetChatThreadQuery(threadId);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center flex-grow bg-white rounded-b-xl text-[0.8125rem] text-text-secondary">
				Loading conversation…
			</div>
		);
	}

	// Sanitizing heals already-corrupted threads (materialized fan-out messages,
	// same id stored twice -- see sanitize.ts); seedForActiveRun then drops the
	// in-flight turn so the live replay owns it.
	const persisted = sanitizeWireMessages(
		((data?.messages ?? []) as UIMessage[]).map(reviveCreatedAt)
	);
	const initialMessages = seedForActiveRun(
		persisted,
		Boolean(data?.active_run_id)
	);

	return (
		<ChatThreadConversation
			threadId={threadId}
			url={url}
			centered={centered}
			initialMessages={initialMessages}
			initialContextUsage={data?.context_usage ?? null}
			messagesRef={messagesRef}
			modelControls={modelControls}
		/>
	);
}

/** Live context-meter state: persisted seed, then updated by CUSTOM events. */
interface ContextUsageState {
	tokens: number;
	compacted: boolean;
	contextLimit: number | null | undefined;
}

function initialUsageState(
	usage: ChatContextUsage | null
): ContextUsageState | null {
	if (!usage) return null;
	return {
		tokens: usage.tokens,
		compacted: Boolean(usage.compacted),
		contextLimit: usage.context_limit,
	};
}

function ChatThreadConversation({
	threadId,
	url,
	centered,
	initialMessages,
	initialContextUsage,
	messagesRef,
	modelControls
}: {
	threadId: string;
	url: string;
	centered: boolean;
	initialMessages: UIMessage[];
	initialContextUsage: ChatContextUsage | null;
	messagesRef: MutableRefObject<UIMessage[]>;
	modelControls: ModelControls;
}) {
	const dispatch = useDispatch();
	const [input, setInput] = useState('');
	// Context meter, seeded from the thread's persisted usage then updated live
	// by the server's CUSTOM events (context usage at run end, compaction
	// mid-run). Resets naturally with the thread remount (key=threadId).
	const [contextUsage, setContextUsage] = useState<ContextUsageState | null>(
		() => initialUsageState(initialContextUsage)
	);
	// Once a live CUSTOM event has been received, prefer it over REST data
	// (which may be stale from a cached response or an in-flight refetch).
	const liveRef = useRef(false);
	// A stale RTK Query cache entry can seed the meter with null/tokens=0 after
	// the server has already persisted real usage; resync from the prop when a
	// fresh detail response arrives, unless a live event arrived first.
	useEffect(() => {
		if (!liveRef.current) {
			setContextUsage(initialUsageState(initialContextUsage));
		}
	}, [initialContextUsage]);

	function handleCustomEvent(name: string, value: unknown, _context: { toolCallId?: string }) {
		liveRef.current = true;
		if (name === 'bublik.chat.context_usage') {
			const v = value as {
				tokens?: unknown;
				context_limit?: unknown;
			} | null;
			const tokens = v?.tokens;
			const contextLimit = v?.context_limit;
			if (typeof tokens === 'number') {
				setContextUsage((prev) => ({
					tokens,
					compacted: prev?.compacted ?? false,
					contextLimit:
						typeof contextLimit === 'number'
							? contextLimit
							: prev?.contextLimit,
				}));
			}
		} else if (name === 'bublik.chat.compacted') {
			setContextUsage((prev) =>
				prev
					? { ...prev, compacted: true }
					: { tokens: 0, compacted: true, contextLimit: null }
			);
			toast.info(
				'Older messages were summarized to fit the model context; the visible conversation is unaffected.'
			);
		}
	}
	// Same stability trick as urlRef below: the connection object must not be
	// recreated when render state changes, so it reads the handler via a ref.
	const onCustomEventRef = useRef(handleCustomEvent);
	onCustomEventRef.current = handleCustomEvent;
	// Constrain the conversation + input to a readable centered column without
	// moving the scrollbar off the panel edge.
	const contentWidth = cn('w-full', centered && 'mx-auto max-w-4xl');
	// Decoupled subscribe/send transport so a run keeps streaming server-side when
	// this thread is left or the page is reloaded; `live` re-subscribes on mount
	// and resumes the in-progress run.
	// Use a ref so the connection object stays stable (and StickToBottom keeps its
	// scroll position) when model/effort changes update the url prop.
	const urlRef = useRef(url);
	urlRef.current = url;
	const connection = useMemo(() => {
		const thread = encodeURIComponent(threadId);
		return createResumableConnection({
			sendUrl: () => `${urlRef.current}&thread=${thread}`,
			subscribeUrl: () =>
				`${config.rootUrl}/api/v2/chat/subscribe?thread=${thread}`
		});
	}, [threadId]);
	const { messages, sendMessage, reload, isLoading, error, stop, status } =
		useChat({
			id: threadId,
			live: true,
			connection,
			// Seed the conversation synchronously so the live replay can't clobber the
			// persisted history (which holds the user messages). See ChatThread above.
			initialMessages,
			persistence: serverPersistence,
			// A finished response means the thread was just persisted (created or
			// updated); refresh the sidebar so the new thread + auto title appear.
			onFinish: () => {
				dispatch(bublikAPI.util.invalidateTags([BUBLIK_TAG.Chat]));
			},
			onCustomEvent: onCustomEventRef.current
		});

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed || isLoading) return;
		setInput('');
		void sendMessage(trimmed);
	}

	const [cancelChatRun] = useCancelChatRunMutation();

	// `stop()` alone only aborts this client's SSE subscription -- the run keeps
	// streaming in the background (status stays `running`), so the thread stays
	// "streaming" and re-streams on reload. Cancel it server-side too, then stop
	// the local subscription for an instant UI response; the server's terminal
	// error event reconciles the persisted message.
	function handleStop() {
		void cancelChatRun({ threadId });
		stop();
	}

	// Keep the header's export actions fed with the latest messages (see
	// ChatPanel.messagesRef). Export uses the raw order; only the rendered list
	// regroups trailing reasoning into the next turn.
	messagesRef.current = messages;

	// A message's trailing reasoning is the model deciding its next step, so it
	// belongs at the head of the following turn -- otherwise the copy/actions bar
	// (which follows all parts) renders below reasoning meant for the next
	// message. See regroup-reasoning.ts.
	const displayMessages = useMemo(
		() => regroupTrailingReasoning(messages),
		[messages]
	);

	const { providers, selection, onSelectionChange, selectedModel, effort } =
		modelControls;
	const lastMessage = messages[messages.length - 1];
	// The run is in flight but nothing has streamed back yet.
	const showLoader =
		isLoading &&
		(!lastMessage ||
			lastMessage.role !== 'assistant' ||
			lastMessage.parts.length === 0);
	const busy = status === 'streaming' || status === 'submitted';

	return (
		// `relative` anchors the floating composer; the conversation scrolls the
		// full panel height behind it.
		<main className="relative flex flex-col flex-grow min-h-0 bg-white rounded-b-md">
			<Conversation>
				{/* Extra bottom padding keeps the last message clear of the composer. */}
				<ConversationContent
					className={cn(
						contentWidth,
						'pb-40',
						messages.length === 0 && 'flex min-h-full flex-col'
					)}
				>
					{messages.length === 0 ? (
						<EmptyState onSuggestion={(s) => void sendMessage(s)} />
					) : (
						displayMessages.map((message, idx) => (
							<ChatMessage
								key={message.id}
								message={message}
								isStreaming={isLoading && idx === displayMessages.length - 1}
								onRetry={
									!isLoading && idx === displayMessages.length - 1
										? () => void reload()
										: undefined
								}
							/>
						))
					)}
					{showLoader ? <Loader /> : null}
					{error ? (
						<p
							role="alert"
							className="mt-3 px-3 py-2 text-[0.8125rem] rounded-md text-bg-error bg-bg-error/10"
						>
							{error.message}
						</p>
					) : null}
				</ConversationContent>
				{/* Lifted above the floating composer. */}
				<ConversationScrollButton className="bottom-44" />
			</Conversation>
			{/* Floating composer: a solid white block (plus a short fade above it)
			    so scrolled messages can't show through around the input. The
			    wrapper ignores pointer events so the conversation stays
			    scrollable; only the input itself captures them. `right-3` stops
			    the block short of the thin scrollbar (see ConversationContent's
			    scrollClassName) so it stays visible; the gap sits over the
			    content's px-6 padding, so no message text shows in it. */}
			<div className="pointer-events-none absolute bottom-0 left-0 right-3">
				<div className="h-8 bg-gradient-to-t from-white to-transparent" />
				<div className="rounded-b-xl bg-white px-4 pb-4">
					{/* The composer keeps a fixed readable width; the layout toggle
					    only affects the thread column. */}
					<div className="pointer-events-auto mx-auto w-full max-w-4xl">
						<PromptInput onSubmit={handleSubmit}>
							<PromptInputTextarea
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Ask about runs, results, logs, history…"
							/>
							<PromptInputToolbar>
								<PromptInputTools>
									<ModelSelect
										providers={providers}
										value={encodeSelection(selection)}
										onValueChange={(v) => onSelectionChange(decodeSelection(v))}
										encode={(provider, model) =>
											encodeSelection({ provider, model })
										}
									/>
									{selectedModel?.supports_reasoning_effort &&
									selectedModel.reasoning_efforts.length > 0 &&
									effort ? (
										<EffortSelect
											efforts={selectedModel.reasoning_efforts}
											value={effort}
											onValueChange={modelControls.onEffortChange}
										/>
									) : null}
									<ContextUsageIndicator
										tokens={contextUsage?.tokens}
										limit={
											contextUsage?.contextLimit ??
											selectedModel?.limit?.context
										}
										compacted={contextUsage?.compacted}
									/>
								</PromptInputTools>
								<PromptInputSubmit
									status={status}
									type={busy ? 'button' : 'submit'}
									onClick={busy ? handleStop : undefined}
									disabled={!busy && !input.trim()}
								/>
							</PromptInputToolbar>
						</PromptInput>
					</div>
				</div>
			</div>
		</main>
	);
}

function EmptyState({
	onSuggestion
}: {
	onSuggestion: (suggestion: string) => void;
}) {
	const examples = [
		'List the test runs from today',
		'Give me an overview of run 12345',
		'Show unexpected results for the latest run'
	];
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 text-center w-full">
			<Icon name="Bulb" className="size-10 text-primary" />
			<div>
				<p className="text-[1rem] font-semibold text-text-primary">
					Ask anything about your test results
				</p>
				<p className="text-[0.8125rem] text-text-secondary">
					The assistant can query runs, results, logs, history and the
					dashboard.
				</p>
			</div>
			<Suggestions>
				{examples.map((example) => (
					<Suggestion
						key={example}
						suggestion={example}
						onClick={onSuggestion}
					/>
				))}
			</Suggestions>
		</div>
	);
}

function ChatMessage({
	message,
	isStreaming,
	onRetry
}: {
	message: UIMessage;
	isStreaming: boolean;
	onRetry?: () => void;
}) {
	const from = message.role === 'user' ? 'user' : 'assistant';
	const lastPart = message.parts[message.parts.length - 1];
	const waitingForText =
		isStreaming &&
		message.parts.length > 0 &&
		lastPart.type !== 'text';

	return (
		<Message from={from}>
			<MessageContent from={from}>
				{message.parts.map((part, idx) => (
					<MessagePartView
						key={idx}
						part={part}
						message={message}
						isUser={from === 'user'}
						isStreaming={isPartStreaming(
							isStreaming,
							idx,
							message.parts.length
						)}
					/>
				))}
				{waitingForText ? <StreamingIndicator /> : null}
			</MessageContent>
			{from === 'assistant' && !isStreaming ? (
				<AssistantMessageActions message={message} onRetry={onRetry} />
			) : null}
		</Message>
	);
}

function AssistantMessageActions({
	message,
	onRetry
}: {
	message: UIMessage;
	onRetry?: () => void;
}) {
	const [isCopied, setIsCopied] = useState(false);
	const timeoutRef = useRef<number>(0);
	const [, copy] = useCopyToClipboard();

	useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

	// Reasoning and tool calls are not copyable; a turn without response text
	// (e.g. reasoning-only) gets no copy button.
	const text = messageText(message);
	if (!text && !onRetry) return null;

	async function handleCopy() {
		const success = await copy(text);
		if (success) {
			setIsCopied(true);
			window.clearTimeout(timeoutRef.current);
			timeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000);
		} else {
			toast.error('Failed to copy to clipboard');
		}
	}

	return (
		<MessageActions>
			{text ? (
				<Tooltip content="Copy response">
					<MessageAction
						onClick={() => void handleCopy()}
						aria-label="Copy response"
					>
						{isCopied ? (
							<CheckIcon className="size-3.5" />
						) : (
							<CopyIcon className="size-3.5" />
						)}
					</MessageAction>
				</Tooltip>
			) : null}
			{onRetry ? (
				<Tooltip content="Retry response">
					<MessageAction onClick={onRetry} aria-label="Retry response">
						<RefreshCwIcon className="size-3.5" />
					</MessageAction>
				</Tooltip>
			) : null}
		</MessageActions>
	);
}

function MessagePartView({
	part,
	message,
	isUser,
	isStreaming
}: {
	part: UIMessage['parts'][number];
	message: UIMessage;
	isUser: boolean;
	isStreaming: boolean;
}) {
	switch (part.type) {
		case 'text':
			// User input is shown verbatim; assistant replies render as markdown.
			return isUser ? (
				<div className="whitespace-pre-wrap break-words">{part.content}</div>
			) : (
				<Response>{part.content}</Response>
			);
		case 'thinking':
			return (
				<Reasoning isStreaming={isStreaming}>
					<ReasoningTrigger />
					<ReasoningContent>{part.content}</ReasoningContent>
				</Reasoning>
			);
		case 'tool-call': {
			const { output, errorText } = getToolOutput(part, message);
			// A successful generate_file call renders as a download card;
			// running/error/unparsable states fall back to the generic tool card.
			if (part.name === 'generate_file' && !errorText) {
				const file = parseGeneratedFile(output);
				if (file) return <FileCard file={file} className="my-1" />;
			}
			return (
				<Tool>
					<ToolHeader name={part.name} status={getToolStatus(part)} />
					<ToolContent>
						<ToolInput input={part.arguments} />
						<ToolOutput output={output} errorText={errorText} />
					</ToolContent>
				</Tool>
			);
		}
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
