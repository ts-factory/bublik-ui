/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	type ComponentPropsWithRef,
	type FormEvent,
	type ReactNode,
	forwardRef,
	useId,
	useRef,
	useState
} from 'react';
import * as RadixToolbar from '@radix-ui/react-toolbar';
import { mergeRefs } from '@react-aria/utils';
import {
	Bold,
	Code,
	Heading,
	Italic,
	Link,
	List,
	ListOrdered,
	ListTodo,
	TextQuote
} from 'lucide-react';

import { cn } from '../utils';
import { ErrorMessage } from '../error-message';
import { FLOATING_LABEL_BACKDROP_CLASS, InputLabel } from '../input-label';
import { Markdown } from '../markdown';
import { Tooltip, TooltipProvider } from '../tooltip';
import {
	type MarkdownCommand,
	bold,
	bulletList,
	code,
	heading,
	italic,
	link,
	numberedList,
	quote,
	taskList
} from './markdown-commands';
import { useAutosize, useMarkdownCommands } from './markdown-editor.hooks';

type MarkdownEditorTab = 'write' | 'preview';

interface ToolbarAction {
	label: string;
	icon: ReactNode;
	command: MarkdownCommand;
	/** The key after ⌘/Ctrl, if the action has a shortcut. */
	shortcut?: string;
}

const ICON_CLASS = 'size-4';

const TOOLBAR_ACTIONS: ToolbarAction[] = [
	{
		label: 'Heading',
		icon: <Heading className={ICON_CLASS} />,
		command: heading
	},
	{
		label: 'Bold',
		icon: <Bold className={ICON_CLASS} />,
		command: bold,
		shortcut: 'B'
	},
	{
		label: 'Italic',
		icon: <Italic className={ICON_CLASS} />,
		command: italic,
		shortcut: 'I'
	},
	{
		label: 'Quote',
		icon: <TextQuote className={ICON_CLASS} />,
		command: quote
	},
	{
		label: 'Code',
		icon: <Code className={ICON_CLASS} />,
		command: code,
		shortcut: 'E'
	},
	{
		label: 'Link',
		icon: <Link className={ICON_CLASS} />,
		command: link,
		shortcut: 'K'
	},
	{
		label: 'Bulleted list',
		icon: <List className={ICON_CLASS} />,
		command: bulletList,
		shortcut: '⇧8'
	},
	{
		label: 'Numbered list',
		icon: <ListOrdered className={ICON_CLASS} />,
		command: numberedList,
		shortcut: '⇧7'
	},
	{
		label: 'Task list',
		icon: <ListTodo className={ICON_CLASS} />,
		command: taskList
	}
];

const MOD_KEY =
	typeof navigator !== 'undefined' && /Mac|iP(hone|ad)/.test(navigator.platform)
		? '⌘'
		: 'Ctrl+';

export type MarkdownEditorProps = ComponentPropsWithRef<'textarea'> & {
	label?: string;
	error?: string;
	/** Classes for the rendered preview, to match where the text is shown. */
	previewClassName?: string;
	/** Preview with `Markdown`'s `breaks`; pass it where the text is shown too. */
	breaks?: boolean;
	/** The textarea's starting height; it grows with the text from there. */
	minRows?: number;
	/**
	 * Take the height the parent flex column has left, scrolling inside past
	 * it, instead of growing with the text.
	 */
	fill?: boolean;
};

/**
 * A textarea for markdown with Write and Preview tabs, like a GitHub comment
 * box. The text stays plain markdown: the toolbar and shortcuts only insert
 * syntax, and Preview renders it with the same `Markdown` the app shows it
 * with afterwards.
 *
 * Takes the textarea's own props, so it works with `register` as well as a
 * controlled value. The textarea stays mounted on Preview to keep its undo
 * history.
 */
export const MarkdownEditor = forwardRef<
	HTMLTextAreaElement,
	MarkdownEditorProps
>(
	(
		{
			label,
			error,
			previewClassName,
			breaks = false,
			minRows = 5,
			fill = false,
			className,
			id,
			disabled,
			onInput,
			onKeyDown,
			onPaste,
			...props
		},
		ref
	) => {
		const generatedId = useId();
		const textareaId = id ?? generatedId;
		const textareaRef = useRef<HTMLTextAreaElement>(null);
		const [tab, setTab] = useState<MarkdownEditorTab>('write');
		const [previewText, setPreviewText] = useState('');
		const commands = useMarkdownCommands(textareaRef);
		const resize = useAutosize(textareaRef, !fill);
		const minHeight = `calc(${minRows} * 1.5rem + 1rem)`;
		const isPreview = tab === 'preview';

		function selectTab(next: MarkdownEditorTab) {
			if (next === 'preview') {
				setPreviewText(textareaRef.current?.value ?? '');
			}

			setTab(next);

			if (next === 'write') {
				requestAnimationFrame(() => textareaRef.current?.focus());
			}
		}

		return (
			<div
				className={cn('relative', fill && 'flex flex-col flex-1')}
				data-testid="markdown-editor"
			>
				{label ? (
					<InputLabel
						className={cn(
							'absolute top-[-11px] left-2 z-10',
							FLOATING_LABEL_BACKDROP_CLASS,
							disabled && 'text-text-menu'
						)}
						htmlFor={textareaId}
					>
						{label}
					</InputLabel>
				) : null}
				<div
					className={cn(
						'flex flex-col rounded border bg-white transition-all',
						fill && 'flex-1',
						error
							? 'border-bg-error focus-within:shadow-text-field-error'
							: 'border-border-primary hover:border-primary focus-within:border-primary focus-within:shadow-text-field'
					)}
				>
					<div className="flex items-stretch justify-between gap-2 pl-2 pr-1.5 border-b border-border-primary">
						{/* Full height, so the underline sits on the row's border; the
						    centred text stays clear of the floating label. */}
						<div role="tablist" aria-label="Editor mode" className="flex">
							<EditorTab
								selected={!isPreview}
								onSelect={() => selectTab('write')}
							>
								Write
							</EditorTab>
							<EditorTab
								selected={isPreview}
								onSelect={() => selectTab('preview')}
							>
								Preview
							</EditorTab>
						</div>
						{/* Stays on Preview, disabled, so the row keeps its height. */}
						<div className="flex items-center py-1.5">
							<MarkdownToolbar
								onCommand={commands.run}
								disabled={isPreview || Boolean(disabled)}
							/>
						</div>
					</div>

					<textarea
						{...props}
						id={textareaId}
						rows={minRows}
						disabled={disabled}
						hidden={isPreview}
						style={{ minHeight }}
						ref={mergeRefs(textareaRef, ref)}
						onInput={(event: FormEvent<HTMLTextAreaElement>) => {
							resize();
							onInput?.(event);
						}}
						onKeyDown={(event) => {
							onKeyDown?.(event);
							if (!event.defaultPrevented) commands.onKeyDown(event);
						}}
						onPaste={(event) => {
							onPaste?.(event);
							if (!event.defaultPrevented) commands.onPaste(event);
						}}
						className={cn(
							// `block` would win over the `hidden` attribute's display: none.
							isPreview ? 'hidden' : 'block',
							'w-full px-3.5 py-2 border-0 bg-transparent resize-none outline-none focus:ring-0 overflow-y-auto',
							fill ? 'flex-1' : 'max-h-[50vh]',
							'text-text-secondary font-medium text-[0.875rem] leading-[1.5rem] placeholder:text-text-menu placeholder:font-normal',
							'disabled:text-text-menu disabled:cursor-not-allowed',
							className
						)}
					/>

					{isPreview ? (
						<div
							role="tabpanel"
							className={cn(
								'px-3.5 py-2 overflow-y-auto',
								fill ? 'flex-1' : 'max-h-[50vh]'
							)}
							style={{ minHeight }}
							data-testid="markdown-editor-preview"
						>
							{previewText.trim() ? (
								<Markdown breaks={breaks} className={previewClassName}>
									{previewText}
								</Markdown>
							) : (
								<p className="text-[0.875rem] text-text-menu">
									Nothing to preview
								</p>
							)}
						</div>
					) : null}

					<div className="px-3.5 py-1.5 border-t border-border-primary text-[0.6875rem] leading-4 text-text-menu">
						<a
							href="https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax"
							target="_blank"
							rel="noreferrer"
							className="hover:text-primary hover:underline"
						>
							Markdown is supported
						</a>
					</div>
				</div>
				{error ? <ErrorMessage>{error}</ErrorMessage> : null}
			</div>
		);
	}
);

interface EditorTabProps {
	selected: boolean;
	onSelect: () => void;
	children: ReactNode;
}

function EditorTab({ selected, onSelect, children }: EditorTabProps) {
	return (
		<button
			type="button"
			role="tab"
			aria-selected={selected}
			onClick={onSelect}
			className={cn(
				'-mb-px flex items-center px-3 text-[0.8125rem] font-medium border-b-2 transition-colors',
				selected
					? 'border-primary text-text-primary'
					: 'border-transparent text-text-menu hover:text-primary'
			)}
		>
			{children}
		</button>
	);
}

interface MarkdownToolbarProps {
	onCommand: (command: MarkdownCommand) => void;
	disabled: boolean;
}

function MarkdownToolbar({ onCommand, disabled }: MarkdownToolbarProps) {
	return (
		<TooltipProvider delayDuration={400}>
			<RadixToolbar.Root
				aria-label="Formatting"
				className="flex items-center gap-0.5"
			>
				{TOOLBAR_ACTIONS.map((action) => (
					<Tooltip
						key={action.label}
						content={
							action.shortcut
								? `${action.label} (${MOD_KEY}${action.shortcut})`
								: action.label
						}
					>
						<RadixToolbar.Button
							type="button"
							aria-label={action.label}
							disabled={disabled}
							// Keep focus, and with it the selection, in the textarea.
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => onCommand(action.command)}
							className="grid rounded-md size-8 place-items-center text-text-menu transition-colors hover:bg-primary-wash hover:text-primary disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
						>
							{action.icon}
						</RadixToolbar.Button>
					</Tooltip>
				))}
			</RadixToolbar.Root>
		</TooltipProvider>
	);
}
