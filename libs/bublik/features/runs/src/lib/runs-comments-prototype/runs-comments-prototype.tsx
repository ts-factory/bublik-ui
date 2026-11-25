/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/*
 * PROTOTYPE, throwaway: what should run comments look like on the /runs page?
 *
 * Four variants on the existing /runs table, switched by `?variant=A|B|C|D`
 * and the floating bar at the bottom; without the param the page is as it is
 * today. Nothing here is meant to be merged as written: no tests, no error
 * handling, and the comments are fetched one request per visible run, as the
 * runs list does not carry them. Read-only: nothing here writes a comment.
 */
import {
	ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { bublikAPI } from '@/services/bublik-api';
import { routes } from '@/router';
import { RunsData } from '@/shared/types';
import {
	ButtonTw,
	cn,
	getRunStatusInfo,
	Icon,
	Markdown,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	DESCRIPTION_MARKDOWN_CLASS,
	DescriptionBlock,
	DescriptionCell
} from '@/bublik/features/result-classification';

const VARIANTS = [
	{ key: 'A', name: 'Comment column' },
	{ key: 'B', name: 'Corner chip' },
	{ key: 'C', name: 'Line under the row' },
	{ key: 'D', name: 'Comments panel' }
] as const;

type RunsCommentVariant = (typeof VARIANTS)[number]['key'];

const VARIANT_PARAM = 'variant';

function isVariant(value: string | null): value is RunsCommentVariant {
	return VARIANTS.some((variant) => variant.key === value);
}

/** The variant the URL asks for; `null` is the page as it is today. */
function useRunsCommentVariant(): RunsCommentVariant | null {
	const [searchParams] = useSearchParams();
	const value = searchParams.get(VARIANT_PARAM);

	return isVariant(value) ? value : null;
}

/** One request per run: fine for a prototype, not for the real thing. */
function useRunComment(runId: number, skip = false): string {
	const { data } = bublikAPI.useGetRunCommentQuery({ runId }, { skip });

	return data?.comment?.trim() ?? '';
}

const COMMENT_TEXT_CLASS = 'text-[0.6875rem] font-medium leading-[1.125rem]';

const HEADING = /^#{1,6}\s/;

function firstLine(text: string): string {
	return (
		text
			.split('\n')
			.map((line) => line.trim())
			.find(Boolean) ?? ''
	);
}

/* ------------------------------------------------------------------ */
/* A: a Comment column, one line that opens the full text              */
/* ------------------------------------------------------------------ */

function CommentColumnCell({ runId }: { runId: number }) {
	const comment = useRunComment(runId);

	if (!comment) return null;

	return (
		// The row selects on a click; a click on the comment only opens it.
		<div
			className={cn(COMMENT_TEXT_CLASS, 'w-[18rem]')}
			onClick={(event) => event.stopPropagation()}
		>
			<DescriptionCell
				value={comment}
				title={`Run ${runId}`}
				overlay
				expandLabel="Show full comment"
				lineClassName={HEADING.test(comment) ? 'font-semibold' : undefined}
			/>
		</div>
	);
}

const COMMENT_COLUMN: ColumnDef<RunsData> = {
	id: 'comment_prototype',
	header: 'Comment',
	accessorKey: 'id',
	cell: (cell) => <CommentColumnCell runId={cell.row.original.id} />,
	enableSorting: false,
	meta: { headerClassName: 'pl-2.5' }
};

/* ------------------------------------------------------------------ */
/* B: a corner chip on the row's top border, as "Baseline" is drawn    */
/* ------------------------------------------------------------------ */

/** The result table's corner marks: a bordered tray of small uppercase chips. */
const ROW_CORNER_CLASS =
	'absolute -top-3 left-1 z-[11] inline-flex h-[1.375rem] w-max max-w-[32rem] items-center gap-1 whitespace-nowrap rounded border border-border-primary bg-bg-primary p-0.5';
const ROW_CORNER_CHIP_CLASS =
	'inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.02em] leading-[0.75rem] transition-colors';

interface CornerChipProps {
	runId: number;
	comment: string;
	isRowHovered: boolean;
}

function CommentCornerChip({ runId, comment, isRowHovered }: CornerChipProps) {
	if (!comment) {
		// What "Use as baseline" is on a hovered result row. A stub: comments
		// are written on the run page, the prototype writes nothing.
		return isRowHovered ? (
			<LinkWithProject
				to={routes.run({ runId })}
				className={cn(ROW_CORNER_CLASS, 'group')}
			>
				<span
					className={cn(
						ROW_CORNER_CHIP_CLASS,
						'text-text-menu group-hover:bg-primary-wash group-hover:text-primary'
					)}
				>
					<Icon name="AddSymbol" size={10} />
					Add comment
				</span>
			</LinkWithProject>
		) : null;
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label="Show full comment"
					className={cn(ROW_CORNER_CLASS, 'group text-left')}
					onClick={(event) => event.stopPropagation()}
				>
					<span
						className={cn(
							ROW_CORNER_CHIP_CLASS,
							'bg-badge-0 text-text-primary group-hover:bg-primary-wash group-hover:text-primary'
						)}
					>
						Comment
					</span>
					<Markdown
						inline
						className="block min-w-0 truncate pr-1 text-[0.6875rem] font-medium leading-none text-text-menu [&_*]:inline [&_a]:pointer-events-none"
					>
						{firstLine(comment)}
					</Markdown>
				</button>
			</PopoverTrigger>
			<CommentPopoverContent runId={runId} comment={comment} />
		</Popover>
	);
}

function CommentPopoverContent({
	runId,
	comment
}: {
	runId: number;
	comment: string;
}) {
	return (
		<PopoverContent
			portal
			align="start"
			sideOffset={4}
			className="flex max-h-[60vh] max-w-[min(56rem,90vw)] flex-col rounded-lg bg-bg-elevated p-1 shadow-popover outline-none"
		>
			<div className="flex items-center justify-between gap-4 px-2 py-1.5">
				<h2 className="text-sm font-semibold leading-5 text-text-primary">
					Run {runId}
				</h2>
				<ButtonTw asChild variant="secondary" size="xss">
					<LinkWithProject to={routes.run({ runId })}>Open run</LinkWithProject>
				</ButtonTw>
			</div>
			<Separator className="my-1 h-px shrink-0" />
			<div className="min-h-0 overflow-auto">
				<Markdown breaks className={`p-2 ${DESCRIPTION_MARKDOWN_CLASS}`}>
					{comment}
				</Markdown>
			</div>
		</PopoverContent>
	);
}

/* ------------------------------------------------------------------ */
/* C: the comment as a second line of the row                          */
/* ------------------------------------------------------------------ */

function CommentStripRow({
	runId,
	comment,
	colSpan
}: {
	runId: number;
	comment: string;
	colSpan: number;
}) {
	return (
		<tr data-testid="runs-row-comment">
			<td colSpan={colSpan} className="p-0">
				{/* Pulled up over the 4px between rows, so it reads as the same card. */}
				<div
					className={cn(
						COMMENT_TEXT_CLASS,
						'-mt-1 flex items-start gap-3 rounded-br border-t border-border-primary bg-bg-primary px-3 py-2'
					)}
				>
					<span className="shrink-0 text-[0.625rem] font-semibold uppercase leading-[1.125rem] tracking-[0.02em] text-text-menu">
						Comment
					</span>
					<div className="min-w-0 max-w-[56rem] flex-1">
						<DescriptionBlock
							value={comment}
							title={`Run ${runId}`}
							overlay
							expandLabel="Show full comment"
							className="max-h-[3.375rem]"
						/>
					</div>
				</div>
			</td>
		</tr>
	);
}

/* ------------------------------------------------------------------ */
/* D: a panel beside the table with the page's comments                */
/* ------------------------------------------------------------------ */

interface PanelState {
	activeRunId: number | null;
	activate: (runId: number, from: 'row' | 'panel') => void;
}

const PanelContext = createContext<PanelState>({
	activeRunId: null,
	activate: () => undefined
});

function useCommentsPanel(): PanelState {
	return useContext(PanelContext);
}

function CommentsPanelProvider({ children }: { children: ReactNode }) {
	const [activeRunId, setActiveRunId] = useState<number | null>(null);

	const activate = useCallback((runId: number, from: 'row' | 'panel') => {
		setActiveRunId(runId);
		const target =
			from === 'row'
				? document.getElementById(`runs-comment-entry-${runId}`)
				: document.querySelector(
						`[data-testid="runs-row"][data-run-id="${runId}"]`
				  );
		target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}, []);

	const value = useMemo(
		() => ({ activeRunId, activate }),
		[activeRunId, activate]
	);

	return (
		<PanelContext.Provider value={value}>{children}</PanelContext.Provider>
	);
}

/** In the Actions column: says the run has a comment and finds it in the panel. */
function CommentPanelMarker({ runId }: { runId: number }) {
	const comment = useRunComment(runId);
	const { activeRunId, activate } = useCommentsPanel();

	if (!comment) return null;

	return (
		<ButtonTw
			variant={activeRunId === runId ? 'primary' : 'secondary'}
			size="xss"
			onClick={(event) => {
				event.stopPropagation();
				activate(runId, 'row');
			}}
		>
			<Icon name="Chat" size={16} className="mr-1.5" />
			Comment
		</ButtonTw>
	);
}

function CommentsPanelEntry({
	run,
	onHasComment
}: {
	run: RunsData;
	onHasComment: (runId: number, has: boolean) => void;
}) {
	const comment = useRunComment(run.id);
	const { activeRunId, activate } = useCommentsPanel();
	const { bg } = getRunStatusInfo(run.conclusion);
	const has = comment !== '';

	useEffect(() => onHasComment(run.id, has), [onHasComment, run.id, has]);

	if (!has) return null;

	return (
		<li
			id={`runs-comment-entry-${run.id}`}
			className={cn(
				'rounded-lg border bg-bg-primary transition-colors',
				activeRunId === run.id ? 'border-primary' : 'border-border-primary'
			)}
		>
			<button
				type="button"
				className="flex w-full items-center gap-2 px-3 pt-2 text-left"
				onClick={() => activate(run.id, 'panel')}
			>
				<span className={cn('size-2 shrink-0 rounded-full', bg)} />
				<span className="text-[0.75rem] font-semibold leading-[1.125rem] text-text-primary">
					Run {run.id}
				</span>
				<span className={cn(COMMENT_TEXT_CLASS, 'text-text-menu')}>
					{run.start ? format(new Date(run.start), 'MMM dd, HH:mm') : null}
				</span>
			</button>
			<div className={cn(COMMENT_TEXT_CLASS, 'px-3 pb-3 pt-1')}>
				<DescriptionBlock
					value={comment}
					title={`Run ${run.id}`}
					overlay
					expandLabel="Show full comment"
					className="max-h-[6.75rem]"
				/>
			</div>
		</li>
	);
}

function CommentsPanel({ runs }: { runs: RunsData[] }) {
	const [withComment, setWithComment] = useState<Record<number, boolean>>({});
	const onHasComment = useCallback(
		(runId: number, has: boolean) =>
			setWithComment((prev) =>
				prev[runId] === has ? prev : { ...prev, [runId]: has }
			),
		[]
	);
	const count = runs.filter((run) => withComment[run.id]).length;

	return (
		<aside className="sticky top-0 flex max-h-screen w-[22rem] shrink-0 flex-col gap-2 overflow-auto rounded bg-bg-primary p-3">
			<h2 className="text-[0.6875rem] font-semibold leading-[0.875rem] text-text-primary">
				Comments
				<span className="ml-1.5 font-medium text-text-menu">
					{count} of {runs.length} runs on this page
				</span>
			</h2>
			{count === 0 ? (
				<p className={cn(COMMENT_TEXT_CLASS, 'text-text-menu')}>
					No run on this page has a comment.
				</p>
			) : null}
			<ul className="flex flex-col gap-2">
				{runs.map((run) => (
					<CommentsPanelEntry
						key={run.id}
						run={run}
						onHasComment={onHasComment}
					/>
				))}
			</ul>
		</aside>
	);
}

/* ------------------------------------------------------------------ */
/* Wiring for the runs table                                           */
/* ------------------------------------------------------------------ */

/** The table's columns as the variant wants them. */
function prototypeColumns(
	columns: ColumnDef<RunsData>[],
	variant: RunsCommentVariant | null
): ColumnDef<RunsData>[] {
	if (variant === 'A') {
		const at = columns.findIndex((column) => column.id === 'important_tags');

		return [...columns.slice(0, at), COMMENT_COLUMN, ...columns.slice(at)];
	}

	if (variant === 'D') {
		return columns.map((column) =>
			column.header === 'Actions'
				? {
						...column,
						cell: (cell) => (
							<div className="flex flex-col items-start gap-1">
								{typeof column.cell === 'function' ? column.cell(cell) : null}
								<CommentPanelMarker runId={cell.row.original.id} />
							</div>
						)
				  }
				: column
		);
	}

	return columns;
}

/** Wraps the table: only D adds something around it. */
function RunsCommentsPrototypeLayout({
	variant,
	runs,
	children
}: {
	variant: RunsCommentVariant | null;
	runs: RunsData[];
	children: ReactNode;
}) {
	if (variant !== 'D') return children;

	return (
		<CommentsPanelProvider>
			<div className="flex items-start gap-1">
				<div className="min-w-0 flex-1">{children}</div>
				<CommentsPanel runs={runs} />
			</div>
		</CommentsPanelProvider>
	);
}

/* ------------------------------------------------------------------ */
/* The floating switcher                                               */
/* ------------------------------------------------------------------ */

function isTyping(target: EventTarget | null): boolean {
	return (
		target instanceof HTMLElement &&
		(target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable)
	);
}

/**
 * Cycles today's page and the variants, through the URL so a variant can be
 * shared. In a production build it shows only when the URL already names a
 * variant, so a stray merge cannot put it in front of users.
 */
function RunsCommentsPrototypeSwitcher() {
	const [searchParams, setSearchParams] = useSearchParams();
	const variant = useRunsCommentVariant();
	const visible = import.meta.env.DEV || searchParams.has(VARIANT_PARAM);

	const cycle = useCallback(
		(step: 1 | -1) => {
			// Today's page is one of the stops, before A.
			const stops = [null, ...VARIANTS.map(({ key }) => key)];
			const next =
				stops[(stops.indexOf(variant) + step + stops.length) % stops.length];
			const params = new URLSearchParams(searchParams);

			if (next) params.set(VARIANT_PARAM, next);
			else params.delete(VARIANT_PARAM);

			setSearchParams(params, { replace: true });
		},
		[searchParams, setSearchParams, variant]
	);

	useEffect(() => {
		if (!visible) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (isTyping(event.target) || event.metaKey || event.ctrlKey) return;
			if (event.key === 'ArrowLeft') cycle(-1);
			if (event.key === 'ArrowRight') cycle(1);
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [cycle, visible]);

	if (!visible) return null;

	const current = VARIANTS.find(({ key }) => key === variant);
	const arrowClass =
		'grid size-6 place-items-center rounded-full hover:bg-bg-primary/20';

	return (
		<div
			className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-text-primary px-2 py-1.5 text-[0.75rem] font-semibold leading-[1.125rem] text-bg-primary shadow-popover"
			data-testid="runs-comments-prototype-switcher"
		>
			<button
				type="button"
				aria-label="Previous variant"
				className={arrowClass}
				onClick={() => cycle(-1)}
			>
				←
			</button>
			<span className="min-w-[13rem] text-center">
				<span className="mr-2 font-medium opacity-70">Prototype</span>
				{current ? `${current.key} (${current.name})` : 'Off (page as today)'}
			</span>
			<button
				type="button"
				aria-label="Next variant"
				className={arrowClass}
				onClick={() => cycle(1)}
			>
				→
			</button>
		</div>
	);
}

export {
	CommentCornerChip,
	CommentStripRow,
	RunsCommentsPrototypeLayout,
	RunsCommentsPrototypeSwitcher,
	prototypeColumns,
	useCommentsPanel,
	useRunComment,
	useRunsCommentVariant
};
export type { RunsCommentVariant };
