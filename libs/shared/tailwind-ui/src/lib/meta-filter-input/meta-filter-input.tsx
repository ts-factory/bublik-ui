/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	ChangeEvent,
	FocusEvent,
	KeyboardEvent,
	MouseEvent,
	ReactNode,
	SyntheticEvent,
	forwardRef,
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { mergeRefs } from '@react-aria/utils';

import {
	formatKeyValueForDisplay,
	normalizeKeyValueForSubmit
} from '@/shared/utils';

import {
	ExpressionError,
	ExpressionSegment,
	expressionAtoms,
	findValueOnlyAtom,
	isExpressionText,
	matchExpressionSuggestion,
	formatExpression,
	segmentExpression,
	splitExactValues,
	splitExpressions,
	validateExpression,
	wordAtCaret
} from './expression';
import { MetaFilterHelp } from './meta-filter-help';
import {
	MetaFilterSuggestionGroupRows,
	MetaFilterSuggestionList,
	MetaFilterSuggestionRow,
	getSuggestionOptionId
} from './meta-filter-suggestions';
import { MetaFilterChip, MetaFilterSuggestionGroup } from './types';
import { Icon } from '../icon';
import { Popover, PopoverAnchor } from '../popover';
import { Tooltip } from '../tooltip';
import { cn } from '../utils';

/** How many rows a group shows at once; typing narrows the rest. */
const ROWS_PER_GROUP = 8;
/** What an idle toolbar field keeps free for text typed and left there. */
const IDLE_INPUT_MIN_WIDTH = 40;
/** What the `+N` count takes, with the gap before it. */
const MORE_COUNT_WIDTH = 40;
/** The least of a chip worth showing cut short, rather than leaving a gap. */
const MIN_CUT_CHIP_WIDTH = 64;

interface MetaFilterInputProps {
	label: string;
	name?: string;
	placeholder?: string;
	chips: MetaFilterChip[];
	onChipsChange: (chips: MetaFilterChip[]) => void;
	/**
	 * The values to offer, grouped, in the submit form (`name=value`). Leave
	 * it out for a free-text field.
	 */
	suggestions?: readonly MetaFilterSuggestionGroup[];
	suggestionsLoading?: boolean;
	/**
	 * `false`: a value chip is always one of the suggestions, for a field
	 * that lists every value there is; typed text goes in as its first match.
	 * Expressions stay free. Defaults to `true`.
	 */
	allowCustomValues?: boolean;
	/** Called when the field first gets focus, so the lists load lazily. */
	onSuggestionsRequest?: () => void;
	keyValueDisplayDelimiter?: string;
	keyValueSubmitDelimiter?: string;
	/** The colour of a value chip, by value; unset, `bg-badge-0`. */
	chipClassName?: (value: string) => string | undefined;
	/** Called by the bin in the label row; unset, the bin empties the field. */
	onClear?: () => void;
	/** What a bare name means in the help: "run has the tag". */
	helpNoun?: string;
	helpExamples?: readonly string[];

	/**
	 * Keeps the label for assistive technology only and drops the help next
	 * to it: for a toolbar where the field explains itself by its place.
	 */
	hideLabel?: boolean;
	/** `toolbar`: the runs page's single row, with no bin (the page has its own reset); `form`: a field with its label on the border. */
	variant?: 'toolbar' | 'form';
	disabled?: boolean;
	className?: string;
}

const BRACES_ICON = (
	<svg
		width="14"
		height="14"
		viewBox="0 0 16 16"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.6"
		strokeLinecap="round"
		aria-hidden="true"
		className="shrink-0 text-primary"
	>
		<path d="M5.5 2.5c-2.4 2.6-2.4 8.4 0 11M10.5 2.5c2.4 2.6 2.4 8.4 0 11" />
	</svg>
);

function Segments({ segments }: { segments: ExpressionSegment[] }) {
	return (
		<>
			{segments.map((segment, index) => (
				<span
					key={index}
					className={cn(
						segment.kind === 'op' && 'font-semibold text-primary',
						segment.kind === 'not' && 'font-semibold text-text-unexpected',
						segment.kind === 'cmp' && 'text-text-menu',
						segment.kind === 'quote' && 'text-text-unexpected',
						segment.token &&
							'rounded-[3px] bg-primary-wash shadow-[inset_0_-2px_0_hsl(var(--colors-primary))]',
						segment.error &&
							'underline decoration-text-unexpected decoration-wavy decoration-[1.5px] underline-offset-4',
						segment.hint &&
							'underline decoration-text-menu decoration-dotted underline-offset-4'
					)}
				>
					{segment.text}
				</span>
			))}
		</>
	);
}

/**
 * One box for exact values and expressions. A value chip is picked from the
 * list or typed; as soon as the text holds an operator the same box becomes
 * an expression editor, which completes the name under the caret, validates
 * the expression against the backend grammar as it is typed, and on Enter
 * adds the whole text as one chip. Every chip is ANDed.
 */
const MetaFilterInput = forwardRef<HTMLDivElement, MetaFilterInputProps>(
	(
		{
			label,
			name,
			placeholder,
			chips,
			onChipsChange,
			suggestions,
			suggestionsLoading = false,
			allowCustomValues = true,
			onSuggestionsRequest,
			keyValueDisplayDelimiter,
			keyValueSubmitDelimiter,
			chipClassName,
			onClear,
			helpNoun,
			helpExamples,

			hideLabel = false,
			variant = 'form',
			disabled = false,
			className
		},
		ref
	) => {
		const [text, setText] = useState('');
		const [caret, setCaret] = useState(0);
		const [scrollLeft, setScrollLeft] = useState(0);
		const [isFocused, setIsFocused] = useState(false);
		const [isListOpen, setIsListOpen] = useState(false);
		const [highlightedIndex, setHighlightedIndex] = useState(-1);
		const [isSubmitted, setIsSubmitted] = useState(false);
		const [isExpressionForced, setIsExpressionForced] = useState(false);
		const [isHelpOpen, setIsHelpOpen] = useState(false);
		const inputRef = useRef<HTMLInputElement>(null);
		const fieldRef = useRef<HTMLDivElement>(null);
		const rowRef = useRef<HTMLDivElement>(null);
		const boxRef = useRef<HTMLDivElement>(null);
		const isToolbar = variant === 'toolbar';
		// The toolbar field is one line in the bar; with focus it opens as a
		// panel over what is below, every chip in full, so the bar never grows.
		const isExpanded = isToolbar && isFocused;
		const isRow = isToolbar && !isExpanded;

		/*
		 * The idle toolbar shows as many whole chips as fit and counts the rest
		 * as `+N`. Each change of the chips or of the width first renders every
		 * chip (`fitCount` null) to measure them, then keeps the ones that fit;
		 * both happen before paint.
		 */
		const [fitCount, setFitCount] = useState<number | null>(null);
		const [boxWidth, setBoxWidth] = useState(0);
		const chipsKey = chips.map((chip) => chip.id).join('\n');
		// Idle, an empty input takes no room: "Add…" shows only once open.
		const hasText = text !== '';

		useEffect(() => {
			const box = boxRef.current;
			if (!isToolbar || !box) return;

			const observer = new ResizeObserver(([entry]) =>
				setBoxWidth(Math.round(entry.contentRect.width))
			);
			observer.observe(box);
			return () => observer.disconnect();
		}, [isToolbar]);

		useLayoutEffect(() => {
			setFitCount(null);
		}, [chipsKey, boxWidth, isExpanded, hasText]);

		useLayoutEffect(() => {
			if (!isRow || fitCount !== null) return;
			const row = rowRef.current;
			const rowBox = row?.getBoundingClientRect();
			if (!row || !rowBox?.width) return;

			const boxes = Array.from(
				row.querySelectorAll<HTMLElement>('[data-testid="meta-filter-chip"]')
			).map((chip) => {
				const { left, right } = chip.getBoundingClientRect();
				return { left: left - rowBox.left, right: right - rowBox.left };
			});
			const room = rowBox.width - (hasText ? IDLE_INPUT_MIN_WIDTH : 0);

			if (!boxes.length || boxes[boxes.length - 1].right <= room) {
				setFitCount(boxes.length);
				return;
			}
			const limit = room - MORE_COUNT_WIDTH;
			const fitting = boxes.filter((box) => box.right <= limit).length;
			// The first chip that does not fit fills the rest of the row, cut
			// short, when enough of it shows; one chip always shows.
			const next = boxes[fitting];
			const cut = next && limit - next.left >= MIN_CUT_CHIP_WIDTH ? 1 : 0;
			setFitCount(Math.max(1, fitting + cut));
		}, [isRow, fitCount, hasText]);
		const pendingCaretRef = useRef<number | null>(null);
		// The text was a query for a pick since it was last edited: it filters
		// the list, it is not a value to add, and it goes when the field closes.
		const isQueryPickedRef = useRef(false);
		const inputId = useId();
		const listId = useId();
		const messageId = useId();

		const delimiters = useMemo(
			() => ({
				displayDelimiter: keyValueDisplayDelimiter,
				submitDelimiter: keyValueSubmitDelimiter
			}),
			[keyValueDisplayDelimiter, keyValueSubmitDelimiter]
		);
		const display = useCallback(
			(value: string) => formatKeyValueForDisplay(value, delimiters),
			[delimiters]
		);

		const hasSuggestions = suggestions !== undefined;
		const isExpression = isExpressionForced || isExpressionText(text);
		const trimmed = text.trim();
		const noun = helpNoun ?? 'tag';
		const nameOf = (item: string) => {
			const separator = item.indexOf('=');
			return separator < 0 ? item : item.slice(0, separator);
		};
		// The names of the metas offered as values only: an expression over one
		// of them would match nothing, as no expression parameter of the field
		// searches them.
		const hasValueOnlyGroups = (suggestions ?? []).some(
			(group) => group.valueOnly
		);
		const valueOnlyNames = useMemo(
			() =>
				new Set(
					(suggestions ?? [])
						.filter((group) => group.valueOnly)
						.flatMap((group) => group.items.map(nameOf))
				),
			[suggestions]
		);
		// The kind of each listed meta, by name, from the group it is offered
		// in: an expression chip takes the kind of the metas it names, so the
		// form can send it under that kind's parameter.
		const { kindByName, kinds } = useMemo(() => {
			const byName = new Map<string, string>();
			const all = new Set<string>();
			for (const group of suggestions ?? []) {
				if (!group.kind || group.valueOnly) continue;
				all.add(group.kind);
				for (const item of group.items) {
					const name = nameOf(item);
					if (!byName.has(name)) byName.set(name, group.kind);
				}
			}
			return { kindByName: byName, kinds: Array.from(all) };
		}, [suggestions]);
		// With metas of several kinds on offer, a chip says which kind it is.
		const hasKinds = kinds.length > 1;

		const grammarError =
			isExpression && trimmed ? validateExpression(text) : null;
		// The chips Enter adds: one per top-level `&` operand, as the joined
		// parameter is read back after a reload.
		const expressionParts =
			isExpression && trimmed && !grammarError ? splitExpressions(text) : [];
		const kindOfPart = (part: string): string | undefined =>
			expressionAtoms(part)
				.map((atom) => kindByName.get(atom.name))
				.find((kind) => kind !== undefined);
		const valueOnlyError = (): ExpressionError | null => {
			const found = findValueOnlyAtom(text, valueOnlyNames);
			if (!found) return null;
			return {
				message: `\`${formatExpression(
					found.atom
				)}\` can only be a value chip here: expressions do not search it`,
				start: found.start,
				end: found.end,
				tail: false
			};
		};
		// A chip goes under one kind's parameter, so a part naming two kinds is
		// refused; while the lists load, so is a name not yet known by kind.
		const kindError = (): ExpressionError | null => {
			// The parts are normalized; the spans come from the typed text.
			const typed = expressionAtoms(text);
			const spanOf = (name: string) =>
				typed.find((atom) => atom.name === name) ?? { start: 0, end: 0 };
			const routes = hasKinds || hasValueOnlyGroups;

			for (const part of expressionParts) {
				const atoms = expressionAtoms(part);
				const unknown = atoms.find((atom) => !kindByName.has(atom.name));
				if (suggestionsLoading && routes && unknown) {
					return {
						message: `The ${noun}s are still loading: press Enter again once they show, so \`${formatExpression(
							unknown.atom
						)}\` goes under its kind`,
						...spanOf(unknown.name),
						tail: false
					};
				}

				const kinded = atoms.flatMap((atom) => {
					const kind = kindByName.get(atom.name);
					return kind ? [{ ...atom, kind }] : [];
				});
				const first = kinded[0];
				const other = kinded.find((atom) => atom.kind !== first?.kind);
				if (!first || !other) continue;

				const spans = [spanOf(first.name), spanOf(other.name)];
				return {
					message: `\`${formatExpression(first.atom)}\` is a ${
						first.kind
					} and \`${formatExpression(other.atom)}\` is a ${
						other.kind
					}: an expression searches one kind of meta, so they go in as separate chips`,
					start: Math.min(...spans.map((span) => span.start)),
					end: Math.max(...spans.map((span) => span.end)),
					tail: false
				};
			}
			return null;
		};
		const valueOnlyFound =
			isExpression && trimmed && !grammarError ? valueOnlyError() : null;
		const kindFound =
			isExpression && trimmed && !grammarError && !valueOnlyFound
				? kindError()
				: null;
		const error: ExpressionError | null =
			grammarError ?? valueOnlyFound ?? kindFound;
		const isTailHint = Boolean(
			error?.tail && !isSubmitted && caret >= text.replace(/\s+$/, '').length
		);
		const knownValues = useMemo(
			() => new Set((suggestions ?? []).flatMap((group) => group.items)),
			[suggestions]
		);
		const isKnownValue = (value: string) =>
			allowCustomValues || knownValues.has(value);
		// An expression the grammar refuses only for its characters, or one over
		// a value-only meta, can still go in when it is a plain `&` list of
		// values: as value chips. Not one refused for its kind: that one is
		// an expression, to be fixed or retried.
		const splitValues =
			grammarError || valueOnlyFound ? splitExactValues(text) : null;
		const exactValues =
			splitValues &&
			splitValues.every((value) =>
				isKnownValue(normalizeKeyValueForSubmit(value, delimiters))
			)
				? splitValues
				: null;
		const isInvalid = Boolean(error) && !isTailHint && !exactValues;
		const word = isExpression ? wordAtCaret(text, caret) : null;
		const query = isExpression ? word?.query ?? '' : trimmed;

		/**
    |--------------------------------------------------
    | SUGGESTIONS
    |--------------------------------------------------
    */

		const checkedValues = useMemo(
			() =>
				new Set(
					chips.filter((chip) => !chip.isExpression).map((chip) => chip.value)
				),
			[chips]
		);

		const { groups, rows } = useMemo(() => {
			const groupRows: MetaFilterSuggestionGroupRows[] = [];
			const flat: MetaFilterSuggestionRow[] = [];
			const seen = new Set<string>();
			const lowerQuery = query.toLowerCase();
			const submitQuery = normalizeKeyValueForSubmit(
				query,
				delimiters
			).toLowerCase();

			for (const group of suggestions ?? []) {
				if (isExpression && group.valueOnly) continue;
				// What the query starts goes before what it merely occurs in, so
				// the first row is the one the user is most likely typing.
				const candidates: {
					row: Omit<MetaFilterSuggestionRow, 'index'>;
					prefix: boolean;
				}[] = [];

				for (const entry of group.items) {
					if (seen.has(entry)) continue;

					if (isExpression) {
						const match = matchExpressionSuggestion(entry, query);
						if (!match.ok) continue;
						seen.add(entry);
						candidates.push({
							prefix: match.prefix,
							row: {
								entry,
								text: match.insert,
								kind: group.kind,
								className: group.className
							}
						});
						continue;
					}

					const shown = display(entry);
					const lowerEntry = entry.toLowerCase();
					const lowerShown = shown.toLowerCase();
					if (
						lowerQuery &&
						!lowerEntry.includes(submitQuery) &&
						!lowerShown.includes(lowerQuery)
					) {
						continue;
					}
					seen.add(entry);
					candidates.push({
						prefix:
							!lowerQuery ||
							lowerEntry.startsWith(submitQuery) ||
							lowerShown.startsWith(lowerQuery),
						row: {
							entry,
							text: shown,
							kind: group.kind,
							className: group.className
						}
					});
				}

				const matched: MetaFilterSuggestionRow[] = [
					...candidates.filter((candidate) => candidate.prefix),
					...candidates.filter((candidate) => !candidate.prefix)
				]
					.slice(0, ROWS_PER_GROUP)
					.map((candidate, offset) => ({
						...candidate.row,
						index: flat.length + offset
					}));

				if (matched.length) {
					flat.push(...matched);
					groupRows.push({ label: group.label, rows: matched });
				}
			}

			return { groups: groupRows, rows: flat };
		}, [suggestions, query, isExpression, display, delimiters]);

		const isListVisible =
			hasSuggestions && isListOpen && isFocused && !disabled;
		// In expression mode Tab inserts the first match, which never commits
		// anything; in value mode only a row chosen with the arrows takes Enter,
		// so what is typed still goes in as a value.
		const activeIndex =
			isExpression && highlightedIndex < 0 && rows.length
				? 0
				: Math.min(highlightedIndex, rows.length - 1);
		const activeRow: MetaFilterSuggestionRow | undefined =
			isListVisible && activeIndex >= 0 ? rows[activeIndex] : undefined;
		// In expression mode Enter completes the word under the caret only with
		// a row chosen with the arrows: any name is a valid atom, the list holds
		// only some of them, and a match by substring would rewrite what was
		// typed. Otherwise Enter adds the expression as a chip; Tab completes.
		const wordText = word ? text.slice(word.start, word.end).toLowerCase() : '';
		const completion =
			isExpression &&
			activeRow &&
			highlightedIndex >= 0 &&
			activeRow.text.toLowerCase() !== wordText
				? activeRow
				: undefined;

		const openList = () => {
			if (hasSuggestions) setIsListOpen(true);
		};
		const closeList = () => {
			setIsListOpen(false);
			setHighlightedIndex(-1);
		};

		/**
    |--------------------------------------------------
    | EDITING
    |--------------------------------------------------
    */

		// Runs after every render on purpose: an edit sets `pendingCaretRef` and
		// the caret can only be placed once the new text is in the input. The
		// ref is cleared before any state is set, so it cannot loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useEffect(() => {
			const input = inputRef.current;
			if (pendingCaretRef.current === null || !input) return;

			const position = pendingCaretRef.current;
			pendingCaretRef.current = null;
			input.focus();
			input.setSelectionRange(position, position);
			setCaret(position);
			setScrollLeft(input.scrollLeft);
		});

		const replaceText = (nextText: string, nextCaret: number) => {
			pendingCaretRef.current = nextCaret;
			isQueryPickedRef.current = false;
			setText(nextText);
			setCaret(nextCaret);
			setHighlightedIndex(-1);
			setIsSubmitted(false);
		};

		const toggleValue = (value: string) => {
			const existing = chips.find(
				(chip) => !chip.isExpression && chip.value === value
			);
			onChipsChange(
				existing
					? chips.filter((chip) => chip !== existing)
					: [...chips, { id: nanoid(4), value, isExpression: false }]
			);
			// As the data table's faceted filters do, a pick keeps the query and
			// the highlighted row, so the arrows can go on ticking the list.
			isQueryPickedRef.current = true;
			openList();
		};

		/** Adds what is typed as a value chip; `false` when it cannot go in. */
		const addTypedValue = (): boolean => {
			const typed = normalizeKeyValueForSubmit(trimmed, delimiters);
			if (!typed) return true;
			const value = isKnownValue(typed) ? typed : rows[0]?.entry;
			if (!value) {
				// The message sits under the field, where the list would cover it.
				closeList();
				setIsSubmitted(true);
				return false;
			}

			if (!checkedValues.has(value)) {
				onChipsChange([
					...chips,
					{ id: nanoid(4), value, isExpression: false }
				]);
			}
			replaceText('', 0);
			closeList();
			return true;
		};

		const addValues = (values: string[]) => {
			const added = new Set(checkedValues);
			const next = [...chips];

			for (const raw of values) {
				const value = normalizeKeyValueForSubmit(raw, delimiters);
				if (!value || added.has(value)) continue;
				added.add(value);
				next.push({ id: nanoid(4), value, isExpression: false });
			}

			onChipsChange(next);
			replaceText('', 0);
			closeList();
		};

		const commitExpression = () => {
			if (!trimmed) return;
			if (error) {
				if (exactValues) {
					addValues(exactValues);
					return;
				}
				// The message sits under the field, where the list would cover it.
				closeList();
				setIsSubmitted(true);
				return;
			}

			// Once each, as value chips are: `a & a` narrows nothing further.
			const present = new Set(
				chips.filter((chip) => chip.isExpression).map((chip) => chip.value)
			);
			const added = expressionParts.filter((part) => {
				if (present.has(part)) return false;
				present.add(part);
				return true;
			});
			if (added.length) {
				onChipsChange([
					...chips,
					...added.map((part) => {
						const kind = kindOfPart(part);
						return {
							id: nanoid(4),
							value: part,
							isExpression: true,
							...(kind ? { kind } : {})
						};
					})
				]);
			}
			// The mode stays as the switch shows it: the next chip is likely
			// another expression, and only the switch takes it back to Value.
			setIsExpressionForced(true);
			replaceText('', 0);
			closeList();
		};

		const insertAtCaret = (row: MetaFilterSuggestionRow) => {
			if (!word) return;

			const after = text.slice(word.end);
			const insert = after ? row.text : `${row.text} `;
			replaceText(
				`${text.slice(0, word.start)}${insert}${after}`,
				word.start + insert.length
			);
			openList();
		};

		const pickRow = (row: MetaFilterSuggestionRow) => {
			if (isExpression) insertAtCaret(row);
			else toggleValue(row.entry);
		};

		const editChip = (chip: MetaFilterChip) => {
			onChipsChange(chips.filter((other) => other.id !== chip.id));
			setIsExpressionForced(true);
			const shown = formatExpression(chip.value);
			replaceText(shown, shown.length);
			openList();
		};

		const removeChip = (chip: MetaFilterChip) => {
			onChipsChange(chips.filter((other) => other.id !== chip.id));
		};

		const clearField = () => {
			replaceText('', 0);
			setIsExpressionForced(false);
			if (onClear) onClear();
			else onChipsChange([]);
		};

		/**
    |--------------------------------------------------
    | INPUT EVENTS
    |--------------------------------------------------
    */

		const syncCaret = (event: SyntheticEvent<HTMLInputElement>) => {
			const input = event.currentTarget;
			if (input.selectionStart !== null && input.selectionStart !== caret) {
				setCaret(input.selectionStart);
			}
			if (input.scrollLeft !== scrollLeft) setScrollLeft(input.scrollLeft);
		};

		const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
			const input = event.target;
			isQueryPickedRef.current = false;
			setText(input.value);
			setCaret(input.selectionStart ?? input.value.length);
			setScrollLeft(input.scrollLeft);
			setHighlightedIndex(-1);
			setIsSubmitted(false);
			// An operator switches to Expression for good, not only while it is
			// in the text: emptying the field keeps the mode.
			if (isExpressionText(input.value)) setIsExpressionForced(true);
			openList();
		};

		const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
			const { key } = event;

			if (key === 'ArrowDown' || key === 'ArrowUp') {
				event.preventDefault();
				openList();
				if (!rows.length) return;

				setHighlightedIndex((previous) => {
					const current = previous < 0 ? activeIndex : previous;
					if (!isListVisible || current < 0) {
						return key === 'ArrowDown' ? 0 : rows.length - 1;
					}
					if (key === 'ArrowDown') return (current + 1) % rows.length;
					return current <= 0 ? rows.length - 1 : current - 1;
				});
				return;
			}

			if (key === 'Escape') {
				if (isHelpOpen) {
					setIsHelpOpen(false);
				} else if (isListVisible) {
					event.preventDefault();
					closeList();
				} else if (isExpanded) {
					// The list is closed already: Esc folds the panel back.
					event.preventDefault();
					inputRef.current?.blur();
				}
				return;
			}

			if (key === 'Tab' && isExpression && activeRow) {
				event.preventDefault();
				insertAtCaret(activeRow);
				return;
			}

			// In value mode Tab fills in the row chosen with the arrows without
			// adding it, so an operator can follow and turn it into an expression.
			// With no row chosen Tab leaves the field, as it does in any input.
			if (
				key === 'Tab' &&
				!isExpression &&
				activeRow &&
				highlightedIndex >= 0
			) {
				event.preventDefault();
				const insert = `${activeRow.text} `;
				replaceText(insert, insert.length);
				setHighlightedIndex(-1);
				openList();
				return;
			}

			if (key === 'Enter' && !event.ctrlKey && !event.metaKey) {
				event.preventDefault();
				if (completion) insertAtCaret(completion);
				else if (isExpression) commitExpression();
				else if (activeRow && highlightedIndex >= 0)
					toggleValue(activeRow.entry);
				else if (trimmed && !isQueryPickedRef.current) addTypedValue();
				return;
			}

			if (key === 'Backspace' && !text && chips.length) {
				event.preventDefault();
				onChipsChange(chips.slice(0, -1));
			}
		};

		/*
		 * A form submitted with text still in the input takes it first, as Enter
		 * would, so Submit never drops what was typed. An expression that does
		 * not parse, or a value nothing matches in a field without custom
		 * values, stops the submit and says why in the field.
		 */
		const submitPendingRef = useRef<(event: Event) => void>();
		submitPendingRef.current = (event) => {
			if (!trimmed || disabled || isQueryPickedRef.current) return;
			let isRefused = false;
			if (isExpression) {
				isRefused = Boolean(error) && !exactValues;
				commitExpression();
			} else {
				isRefused = !addTypedValue();
			}
			if (isRefused) {
				event.preventDefault();
				event.stopPropagation();
				inputRef.current?.focus();
			}
		};

		useEffect(() => {
			const form = inputRef.current?.form;
			if (!form) return;

			// Capture runs before React's onSubmit, which listens at the root.
			const handleSubmit = (event: Event) => submitPendingRef.current?.(event);
			form.addEventListener('submit', handleSubmit, true);
			return () => form.removeEventListener('submit', handleSubmit, true);
		}, []);

		// The list opens with focus, not on click: focus moves the input as the
		// field opens, so the click that follows can land elsewhere.
		const handleFocus = (_: FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);
			onSuggestionsRequest?.();
			openList();
		};

		const handleBlur = (_: FocusEvent<HTMLInputElement>) => {
			setIsFocused(false);
			closeList();
			if (isQueryPickedRef.current) {
				isQueryPickedRef.current = false;
				setText('');
				setCaret(0);
				setScrollLeft(0);
			}
		};

		const handleFieldMouseDown = (event: MouseEvent<HTMLDivElement>) => {
			// Anywhere but the input and the buttons, chips' text included.
			const target = event.target as HTMLElement;
			if (disabled || target === inputRef.current || target.closest('button'))
				return;
			event.preventDefault();
			inputRef.current?.focus();
			openList();
		};

		const handleInputClick = () => openList();

		/**
    |--------------------------------------------------
    | MESSAGE
    |--------------------------------------------------
    */

		const lowerLabel = label.toLowerCase();
		let message: ReactNode = null;
		let messageTone: 'error' | 'hint' | 'ok' | null = null;
		if (!isExpression && trimmed && isSubmitted) {
			messageTone = 'error';
			message = suggestionsLoading
				? `The ${lowerLabel} are still loading. Press Enter again once they show.`
				: `No ${lowerLabel} match “${trimmed}”. Pick one from the list, or write an expression.`;
		}
		if (isExpression && trimmed) {
			if (error && exactValues) {
				messageTone = 'hint';
				message = `${error.message} · Enter adds ${
					exactValues.length === 1
						? 'it as a value chip'
						: `these as ${exactValues.length} value chips`
				}`;
			} else if (error) {
				messageTone = isTailHint ? 'hint' : 'error';
				message = isTailHint
					? `Keep typing: ${error.message
							.charAt(0)
							.toLowerCase()}${error.message.slice(1)}`
					: `${error.message}${isSubmitted ? '. Fix it to add the chip.' : ''}`;
			} else {
				messageTone = 'ok';
				message = completion
					? `Enter completes ${completion.text}, then adds the expression`
					: expressionParts.length > 1
					? `Valid expression · Enter adds ${expressionParts.length} chips, one per & operand`
					: `Valid ${
							(hasKinds && kindOfPart(expressionParts[0] ?? '')) || ''
					  } expression · Enter adds it as one chip`.replace('  ', ' ');
			}
		}
		// The toolbar keeps guidance out of the way: only a refused Enter says
		// anything there, inside the open panel.
		if (isToolbar && !(isExpanded && messageTone === 'error' && isSubmitted)) {
			message = null;
			messageTone = null;
		}

		const mirrorSegments =
			isExpression && text
				? segmentExpression(text, {
						error,
						token: error ? null : word && word.end > word.start ? word : null
				  })
				: null;

		const visibleChips =
			isRow && fitCount !== null ? chips.slice(0, fitCount) : chips;
		const hiddenChipCount = chips.length - visibleChips.length;

		const messageNode = (
			<div
				id={messageId}
				aria-live="polite"
				className={cn(
					'flex items-center gap-2 px-0.5 text-xs',
					message
						? cn('min-h-[22px] pt-1.5', isToolbar && 'basis-full')
						: isToolbar
						? 'absolute h-0 w-0 overflow-hidden'
						: 'h-0 overflow-hidden',
					messageTone === 'error' && 'text-text-unexpected',
					messageTone === 'hint' && 'text-text-menu',
					messageTone === 'ok' && 'text-text-secondary'
				)}
			>
				{messageTone === 'error' ? (
					<Icon
						name="InformationCircleExclamationMark"
						size={16}
						className="shrink-0"
					/>
				) : null}
				{messageTone === 'ok' ? (
					<Icon
						name="InformationCircleCheckmark"
						size={16}
						className="shrink-0 text-text-expected"
					/>
				) : null}
				<span>{message}</span>
			</div>
		);

		const field = (
			<div
				ref={mergeRefs(ref, fieldRef)}
				data-testid="meta-filter-input"
				data-mode={isExpression ? 'expression' : 'value'}
				data-expanded={isExpanded || undefined}
				onMouseDown={handleFieldMouseDown}
				className={cn(
					'relative flex w-full cursor-text items-center rounded-md border border-border-input bg-bg-primary transition-[border-color,box-shadow]',
					// Sized as the badge input beside it in the forms.
					isRow && 'h-10 py-1 pl-3 pr-2',
					// Open, the first line stays where the idle row was.
					isExpanded &&
						'absolute inset-x-0 top-0 z-40 min-h-10 flex-wrap py-[7px] pl-3 pr-2',
					!isToolbar && 'min-h-[40px] py-1.5 pl-2 pr-2',
					// Hover and focus as the date picker beside it in the runs bar.
					!disabled && 'hover:border-primary',
					isFocused && 'border-primary shadow-text-field',
					isInvalid && 'border-text-unexpected shadow-text-field-error',
					disabled &&
						'cursor-not-allowed border-border-primary bg-bg-body shadow-none'
				)}
			>
				{hideLabel ? (
					<label htmlFor={inputId} className="sr-only">
						{label}
					</label>
				) : (
					<span
						className={cn(
							'absolute -top-3 left-2 flex h-3 items-center gap-1 bg-bg-primary px-1 text-[0.875rem] font-medium leading-3 text-text-secondary',
							isFocused && 'text-text-primary'
						)}
					>
						<label htmlFor={inputId}>{label}</label>
						<MetaFilterHelp
							noun={helpNoun}
							examples={helpExamples?.map(formatExpression)}
							open={isHelpOpen}
							onOpenChange={setIsHelpOpen}
						/>
					</span>
				)}
				{/* In the toolbar it is compact and raised on the border as the date
				    picker's label, 4px clear of the chips. */}
				<span
					className={cn(
						'absolute right-2 flex items-center gap-1 bg-bg-primary px-1',
						isToolbar ? '-top-[13px]' : '-top-3'
					)}
				>
					{/* With no label to sit beside, the help joins the mode switch: the
					    text comparison and `!=` surprises are what a bar user hits. */}
					{hideLabel ? (
						<MetaFilterHelp
							noun={helpNoun}
							examples={helpExamples?.map(formatExpression)}
							open={isHelpOpen}
							onOpenChange={setIsHelpOpen}
							className={isToolbar ? 'size-4' : undefined}
						/>
					) : null}
					<span
						role="radiogroup"
						aria-label={`${label} input mode`}
						className={cn(
							'inline-flex items-center rounded border border-border-input bg-bg-primary',
							!isToolbar && 'gap-0.5 p-0.5'
						)}
					>
						{(['value', 'expression'] as const).map((mode) => {
							const isOn = (mode === 'expression') === isExpression;
							const isValueLocked = mode === 'value' && isExpressionText(text);

							return (
								<button
									key={mode}
									type="button"
									role="radio"
									aria-checked={isOn}
									// One tab stop for the group; the arrows move within it.
									tabIndex={isOn ? 0 : -1}
									data-mode-option={mode}
									disabled={disabled || isValueLocked}
									title={
										mode === 'value'
											? isValueLocked
												? 'The text contains an operator, so it can only be an expression'
												: 'Pick exact values as chips'
											: 'Typing an operator switches here automatically'
									}
									onMouseDown={(event) => event.preventDefault()}
									onClick={() => {
										setIsExpressionForced(mode === 'expression');
										pendingCaretRef.current = text.length;
									}}
									onKeyDown={(event) => {
										if (!event.key.startsWith('Arrow')) return;
										event.preventDefault();
										const other = mode === 'value' ? 'expression' : 'value';
										const target =
											event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
												`[data-mode-option="${other}"]`
											);
										if (!target || target.disabled) return;
										setIsExpressionForced(other === 'expression');
										target.focus();
									}}
									className={cn(
										'px-1.5 text-[0.625rem] font-semibold uppercase leading-[0.75rem] tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-default disabled:opacity-45',
										isToolbar ? 'rounded-[3px] py-px' : 'rounded py-0.5',
										isOn
											? 'bg-primary-wash text-primary'
											: 'text-text-secondary enabled:hover:bg-primary-wash enabled:hover:text-primary'
									)}
								>
									{mode === 'value' ? 'Value' : 'Expression'}
								</button>
							);
						})}
					</span>
					{isToolbar ? null : (
						<Tooltip content={`Clear ${lowerLabel}`}>
							<button
								type="button"
								aria-label={`Clear ${lowerLabel}`}
								disabled={disabled}
								onMouseDown={(event) => event.preventDefault()}
								onClick={clearField}
								className="inline-flex size-5 items-center justify-center rounded text-text-menu transition-colors hover:bg-primary-wash hover:text-primary"
							>
								<Icon name="Bin" size={14} />
							</button>
						</Tooltip>
					)}
				</span>

				{/* The idle toolbar is one row: the chips never wrap, and the ones
				    that do not fit fold into a count. The clipping lives here, not
				    on the field, whose label and mode switch sit on its border. */}
				<div
					className={cn(
						'flex min-w-0 flex-1 items-center gap-1',
						isRow ? 'flex-nowrap overflow-hidden' : 'flex-wrap'
					)}
					ref={rowRef}
				>
					{visibleChips.map((chip, index) => {
						const chipLabel = chip.isExpression
							? formatExpression(chip.value)
							: display(chip.value);
						const isCut =
							isRow && fitCount !== null && index === visibleChips.length - 1;
						const kindTitle =
							chip.kind && hasKinds
								? `${chip.kind.charAt(0).toUpperCase()}${chip.kind.slice(
										1
								  )} expression`
								: 'Expression';

						return (
							<span key={chip.id} className="contents">
								<span
									data-testid="meta-filter-chip"
									data-kind={chip.isExpression ? 'expression' : 'value'}
									data-expression-kind={chip.kind}
									data-value={chip.value}
									className={cn(
										// Sized as the badges in the tables: `badgeBaseStyles`.
										'inline-flex max-w-full items-center gap-0.5 rounded border border-transparent py-0.5 pl-2 pr-0.5 text-[0.75rem] font-medium leading-[1.125rem] text-text-primary',
										// Measured at full width; once fitted, only the last chip
										// shown may be cut short.
										isCut ? 'min-w-0 shrink' : 'shrink-0',
										chip.isExpression
											? 'border-text-menu/60 bg-transparent pl-0.5 font-mono'
											: cn('bg-badge-0', chipClassName?.(chip.value))
									)}
								>
									{chip.isExpression ? (
										<Tooltip content={`${kindTitle} · click to edit`}>
											<button
												type="button"
												aria-label={`${kindTitle}: ${chipLabel}. Activate to edit`}
												disabled={disabled}
												onMouseDown={(event) => event.preventDefault()}
												onClick={() => editChip(chip)}
												className={cn(
													'inline-flex min-w-0 items-center gap-1 rounded px-1 text-left transition-colors hover:bg-primary-wash',
													isRow
														? 'whitespace-nowrap'
														: '[overflow-wrap:anywhere]'
												)}
											>
												{BRACES_ICON}
												{chip.kind && hasKinds ? (
													<span className="text-[0.5625rem] font-semibold uppercase tracking-[0.02em] text-text-menu">
														{chip.kind}
													</span>
												) : null}
												<span
													className={
														isRow
															? 'min-w-0 truncate whitespace-pre'
															: 'whitespace-pre-wrap'
													}
												>
													<Segments segments={segmentExpression(chipLabel)} />
												</span>
											</button>
										</Tooltip>
									) : (
										<span
											className={
												isRow ? 'min-w-0 truncate' : '[overflow-wrap:anywhere]'
											}
										>
											{chipLabel}
										</span>
									)}
									<button
										type="button"
										aria-label={`Remove ${
											chip.isExpression ? 'expression ' : ''
										}${chipLabel}`}
										disabled={disabled}
										onMouseDown={(event) => event.preventDefault()}
										onClick={() => removeChip(chip)}
										// A 20px target, so the wrong filter is hard to hit.
										className="-my-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded text-text-menu transition-colors hover:bg-text-menu/15 hover:text-text-primary"
									>
										<Icon name="CrossSimple" size={12} />
									</button>
								</span>
							</span>
						);
					})}
					{hiddenChipCount > 0 ? (
						<button
							type="button"
							data-testid="meta-filter-more"
							aria-label={`Show ${hiddenChipCount} more filters`}
							disabled={disabled}
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => inputRef.current?.focus()}
							className="inline-flex shrink-0 items-center whitespace-nowrap rounded border border-transparent bg-primary-wash px-2 py-0.5 text-[0.75rem] font-medium leading-[1.125rem] text-primary"
						>
							+{hiddenChipCount}
						</button>
					) : null}

					<span
						className={cn(
							'relative h-6 overflow-hidden',
							// Idle, the input gives the chips the room; it grows back on focus.
							isRow
								? cn('flex-1', hasText ? 'min-w-[24px]' : 'min-w-0')
								: 'min-w-[160px] flex-[1_1_200px]'
						)}
					>
						{mirrorSegments ? (
							<span
								aria-hidden="true"
								className="pointer-events-none absolute left-0 top-0 h-6 whitespace-pre px-0.5 font-mono text-[13px] leading-6 text-text-primary"
								style={{ transform: `translateX(-${scrollLeft}px)` }}
							>
								<Segments segments={mirrorSegments} />
							</span>
						) : null}
						<input
							ref={inputRef}
							id={inputId}
							name={name}
							type="text"
							value={text}
							placeholder={
								chips.length
									? isRow
										? undefined
										: 'Add a value or an expression…'
									: placeholder ??
									  `Filter by ${lowerLabel}, or write an expression like a & !b`
							}
							disabled={disabled}
							autoComplete="off"
							spellCheck={false}
							role="combobox"
							aria-autocomplete="list"
							aria-expanded={isListVisible}
							aria-controls={isListVisible ? listId : undefined}
							aria-activedescendant={
								activeRow
									? getSuggestionOptionId(listId, activeRow.index)
									: undefined
							}
							aria-invalid={isInvalid}
							aria-describedby={messageId}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							onKeyUp={syncCaret}
							onSelect={syncCaret}
							onScroll={syncCaret}
							onClick={handleInputClick}
							onFocus={handleFocus}
							onBlur={handleBlur}
							className={cn(
								'absolute inset-0 m-0 h-6 w-full border-0 bg-transparent p-0 px-0.5 text-sm font-medium leading-6 text-text-primary caret-text-primary outline-none placeholder:font-normal placeholder:text-text-menu focus:ring-0',
								isExpression && 'font-mono text-[13px]',
								mirrorSegments && 'text-transparent'
							)}
						/>
					</span>
				</div>
				{isToolbar ? messageNode : null}
			</div>
		);

		return (
			<div
				ref={boxRef}
				className={cn(
					'relative flex w-full flex-col',
					// The bar keeps its one line while the field opens over it.
					isToolbar && 'h-10',
					className
				)}
			>
				{hasSuggestions ? (
					<Popover
						open={isListVisible}
						onOpenChange={(open) => {
							if (!open) closeList();
						}}
					>
						<PopoverAnchor asChild>{field}</PopoverAnchor>
						{isListVisible ? (
							<MetaFilterSuggestionList
								id={listId}
								label={label}
								mode={isExpression ? 'expression' : 'value'}
								allowCustomValues={allowCustomValues}
								query={query}
								groups={groups}
								checked={checkedValues}
								highlightedIndex={activeIndex}
								loading={suggestionsLoading}
								scopeNote={
									!isExpression
										? undefined
										: hasKinds
										? `An expression searches one kind of meta: ${kinds.join(
												', '
										  )}`
										: hasValueOnlyGroups
										? `Expressions match ${noun}s only; other metas go in as value chips`
										: undefined
								}
								fieldRef={fieldRef}
								onHighlight={setHighlightedIndex}
								onPick={pickRow}
							/>
						) : null}
					</Popover>
				) : (
					field
				)}
				{isToolbar ? null : messageNode}
			</div>
		);
	}
);

export { MetaFilterInput };
export type { MetaFilterInputProps };
