/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	type ReactNode
} from 'react';

import { useLocalStorage } from '@/shared/hooks';

import { ResultSelectionPopover } from './result-selection-popover.component';
import {
	classifyTargets,
	isClassifiable,
	toSelected,
	type ClassifyTargets,
	type SelectableResult,
	type SelectedResult
} from './result-selection.utils';

export interface ResultSelection {
	/** The picked results, by result id, in the order they were picked. */
	selected: ReadonlyMap<number, SelectedResult>;
	count: number;
	/** What Classify would send of the selection, or why it cannot. */
	targets: ClassifyTargets;
	isSelected: (resultId: number) => boolean;
	/** Picks or drops the row; a plain pass, which Classify cannot take, is not picked. */
	toggle: (row: SelectableResult) => void;
	/** Adds the classifiable rows not picked yet, in their order, after what is picked. */
	select: (rows: readonly SelectableResult[]) => void;
	remove: (resultId: number) => void;
	/** Drops these results, and the reference if it was one of them. */
	deselect: (resultIds: readonly number[]) => void;
	/**
	 * The result the parameter columns are compared against: its own
	 * parameters read in full, and those of the other rows that it shares
	 * are dimmed. One per page, so it is the same across every open table;
	 * a row of another table has no parameters of it to read and dims none.
	 */
	referenceResultId: number | null;
	setReference: (resultId: number | null) => void;
	/** Drops the selection and the reference both. */
	clear: () => void;
}

const ResultSelectionContext = createContext<ResultSelection | null>(null);

/**
 * The selection a result table is part of, or `null` when the table is not
 * under a `ResultSelectionProvider`: then a row click sets the reference
 * row on its own, as it did before there was a selection.
 */
export function useResultSelection(): ResultSelection | null {
	return useContext(ResultSelectionContext);
}

/** What is kept between pages: the picks, and the row compared against. */
interface StoredSelection {
	results: SelectedResult[];
	referenceResultId: number | null;
}

const STORAGE_KEY = 'bublik.result-selection';
const EMPTY: StoredSelection = { results: [], referenceResultId: null };

export interface ResultSelectionProviderProps {
	children: ReactNode;
	/**
	 * Lift the floating pill and the popover clear of a bar pinned to the
	 * page's bottom edge — the footer the issue pages page their results
	 * with. The run page has none, and keeps them at the edge.
	 */
	raised?: boolean;
}

/**
 * One selection of results for every result table under it, and the popover
 * that acts on them: classifying them in bulk, or taking one as the
 * reference the parameters are compared against. A row click picks the
 * row; the run page has several tables open at once, one per test, and
 * the selection spans them, so the rows of several tests go into one
 * request.
 *
 * The selection is kept in local storage rather than in state, so leaving
 * the page — to a result's log, say — and coming back does not lose it;
 * nor does a reload. It is one selection for the browser, whichever page
 * holds the tables, until Clear or a classification empties it.
 */
export function ResultSelectionProvider({
	children,
	raised = false
}: ResultSelectionProviderProps) {
	const [stored, setStored] = useLocalStorage<StoredSelection>(
		STORAGE_KEY,
		EMPTY
	);

	// A selection stored before plain passes were refused can still hold them.
	const selected = useMemo<ReadonlyMap<number, SelectedResult>>(
		() =>
			new Map(
				stored.results
					.filter((result) => result.classifiable)
					.map((result) => [result.resultId, result])
			),
		[stored.results]
	);
	const referenceResultId = stored.referenceResultId;

	const isSelected = useCallback(
		(resultId: number) => selected.has(resultId),
		[selected]
	);

	const toggle = useCallback(
		(row: SelectableResult) => {
			setStored((prev) => {
				const kept = prev.results.filter(
					(result) => result.resultId !== row.result_id
				);
				const isPicked = kept.length !== prev.results.length;

				// A plain pass is not picked, as Classify could not take it.
				if (!isPicked && !isClassifiable(row)) return prev;

				return {
					...prev,
					results: isPicked ? kept : [...kept, toSelected(row)]
				};
			});
		},
		[setStored]
	);

	const select = useCallback(
		(rows: readonly SelectableResult[]) => {
			setStored((prev) => {
				const picked = new Set(prev.results.map((result) => result.resultId));
				const added = rows
					.filter((row) => !picked.has(row.result_id) && isClassifiable(row))
					.map(toSelected);

				return added.length
					? { ...prev, results: [...prev.results, ...added] }
					: prev;
			});
		},
		[setStored]
	);

	const deselect = useCallback(
		(resultIds: readonly number[]) => {
			const dropped = new Set(resultIds);

			setStored((prev) => ({
				...prev,
				results: prev.results.filter((result) => !dropped.has(result.resultId)),
				referenceResultId:
					prev.referenceResultId !== null && dropped.has(prev.referenceResultId)
						? null
						: prev.referenceResultId
			}));
		},
		[setStored]
	);

	const remove = useCallback(
		(resultId: number) => {
			setStored((prev) => ({
				...prev,
				results: prev.results.filter((result) => result.resultId !== resultId),
				referenceResultId:
					prev.referenceResultId === resultId ? null : prev.referenceResultId
			}));
		},
		[setStored]
	);

	const setReference = useCallback(
		(resultId: number | null) => {
			setStored((prev) => ({ ...prev, referenceResultId: resultId }));
		},
		[setStored]
	);

	const clear = useCallback(() => setStored(EMPTY), [setStored]);

	const targets = useMemo(() => classifyTargets(selected), [selected]);

	const value = useMemo<ResultSelection>(
		() => ({
			selected,
			count: selected.size,
			targets,
			isSelected,
			toggle,
			select,
			remove,
			deselect,
			referenceResultId,
			setReference,
			clear
		}),
		[
			selected,
			targets,
			isSelected,
			toggle,
			select,
			remove,
			deselect,
			referenceResultId,
			setReference,
			clear
		]
	);

	return (
		<ResultSelectionContext.Provider value={value}>
			{children}
			<ResultSelectionPopover selection={value} raised={raised} />
		</ResultSelectionContext.Provider>
	);
}
