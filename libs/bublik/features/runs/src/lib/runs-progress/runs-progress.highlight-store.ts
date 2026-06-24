/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createContext, useContext, useRef, useSyncExternalStore } from 'react';

type RunsProgressColumnId =
	| 'total'
	| 'totalExpected'
	| 'run'
	| 'passedExpected'
	| 'unexpected'
	| 'abnormal'
	| 'passedUnexpected'
	| 'failedExpected'
	| 'failedUnexpected'
	| 'skippedExpected'
	| 'skippedUnexpected';

type HighlightCellRef = {
	rowId: string;
	runId: number;
	columnId: RunsProgressColumnId;
};

type HighlightState = {
	hovered: HighlightCellRef | null;
	pinned: HighlightCellRef | null;
	flash: HighlightCellRef | null;
};

type HighlightStore = {
	subscribe: (listener: () => void) => () => void;
	getState: () => HighlightState;
	setHovered: (ref: HighlightCellRef | null) => void;
	clearHover: () => void;
	togglePinned: (ref: HighlightCellRef) => void;
	setPinned: (ref: HighlightCellRef | null) => void;
	setFlash: (ref: HighlightCellRef | null) => void;
};

function sameCell(
	left: HighlightCellRef | null,
	right: HighlightCellRef | null
): boolean {
	if (left === right) return true;
	if (!left || !right) return false;

	return (
		left.rowId === right.rowId &&
		left.runId === right.runId &&
		left.columnId === right.columnId
	);
}

function createHighlightStore(): HighlightStore {
	let state: HighlightState = { hovered: null, pinned: null, flash: null };
	const listeners = new Set<() => void>();

	function setState(next: HighlightState) {
		state = next;
		listeners.forEach((listener) => listener());
	}

	return {
		subscribe(listener) {
			listeners.add(listener);

			return () => {
				listeners.delete(listener);
			};
		},
		getState() {
			return state;
		},
		setHovered(ref) {
			if (sameCell(state.hovered, ref)) return;

			setState({ ...state, hovered: ref });
		},
		clearHover() {
			if (state.hovered === null) return;

			setState({ ...state, hovered: null });
		},
		togglePinned(ref) {
			const next = sameCell(state.pinned, ref) ? null : ref;

			setState({ ...state, pinned: next, hovered: null });
		},
		setPinned(ref) {
			if (sameCell(state.pinned, ref)) return;

			setState({ ...state, pinned: ref });
		},
		setFlash(ref) {
			if (sameCell(state.flash, ref)) return;

			setState({ ...state, flash: ref });
		}
	};
}

type CellHighlight = {
	left: boolean;
	right: boolean;
	rowTint: boolean;
	clicked: boolean;
};

const NO_HIGHLIGHT: CellHighlight = {
	left: false,
	right: false,
	rowTint: false,
	clicked: false
};

function getCellHighlight(
	columnId: RunsProgressColumnId,
	runId: number,
	isPinned: boolean,
	pinnedColumnId: RunsProgressColumnId | null,
	pinnedRunId: number | null,
	isPinnedRow: boolean,
	hoveredColumnId: RunsProgressColumnId | null,
	hoveredRunId: number | null
): CellHighlight {
	if (isPinned) {
		const sameColumn = pinnedColumnId !== null && columnId === pinnedColumnId;
		const inRow = isPinnedRow;

		if (!sameColumn && !inRow) return NO_HIGHLIGHT;

		const clicked = sameColumn && inRow && runId === pinnedRunId;

		return {
			left: sameColumn,
			right: sameColumn,
			rowTint: sameColumn && inRow,
			clicked
		};
	}

	const sameHoverColumn =
		hoveredColumnId !== null &&
		columnId === hoveredColumnId &&
		runId === hoveredRunId;

	return {
		left: sameHoverColumn,
		right: sameHoverColumn,
		rowTint: false,
		clicked: false
	};
}

type CellHighlightBundle = {
	highlights: CellHighlight[];
	highlightRunSeparator: boolean;
	highlightBottomBorder: boolean;
	flashColumnId: RunsProgressColumnId | null;
};

function computeBundle(
	state: HighlightState,
	rowId: string,
	runId: number,
	nextRunId: number | null,
	nextRowId: string | null,
	columnIds: readonly RunsProgressColumnId[],
	hasNode: boolean
): CellHighlightBundle {
	const { hovered, pinned, flash } = state;
	const isPinned = pinned !== null;
	const pinnedColumnId = pinned?.columnId ?? null;
	const pinnedRunId = pinned?.runId ?? null;
	const isPinnedRow = pinned?.rowId === rowId;
	const hoveredColumnId = hovered?.columnId ?? null;
	const hoveredRunId = hovered?.runId ?? null;

	const highlights = hasNode
		? columnIds.map((columnId) =>
				getCellHighlight(
					columnId,
					runId,
					isPinned,
					pinnedColumnId,
					pinnedRunId,
					isPinnedRow,
					hoveredColumnId,
					hoveredRunId
				)
		  )
		: [];

	const pinnedIsFirstColumn =
		isPinned && pinnedColumnId !== null && pinnedColumnId === columnIds[0];
	const nextRunFirstColumnHovered =
		!isPinned &&
		hoveredColumnId !== null &&
		hoveredColumnId === columnIds[0] &&
		hoveredRunId === nextRunId;
	const highlightRunSeparator =
		Boolean(highlights[highlights.length - 1]?.right) ||
		pinnedIsFirstColumn ||
		nextRunFirstColumnHovered;

	const highlightedRowId = pinned ? pinned.rowId : hovered?.rowId ?? null;
	const highlightBottomBorder =
		highlightedRowId !== null &&
		(highlightedRowId === rowId || highlightedRowId === nextRowId);

	const flashColumnId =
		flash && flash.rowId === rowId && flash.runId === runId
			? flash.columnId
			: null;

	return {
		highlights,
		highlightRunSeparator,
		highlightBottomBorder,
		flashColumnId
	};
}

function bundleSignature(bundle: CellHighlightBundle): string {
	let signature =
		(bundle.highlightBottomBorder ? '1' : '0') +
		(bundle.highlightRunSeparator ? '1' : '0') +
		'|';

	for (const highlight of bundle.highlights) {
		signature +=
			(highlight.left ? '1' : '0') +
			(highlight.right ? '1' : '0') +
			(highlight.rowTint ? '1' : '0') +
			(highlight.clicked ? '1' : '0');
	}

	return `${signature}|${bundle.flashColumnId ?? ''}`;
}

const HighlightContext = createContext<HighlightStore | null>(null);

function useHighlightStore(): HighlightStore {
	const store = useContext(HighlightContext);

	if (!store) {
		throw new Error('useHighlightStore must be used within HighlightContext');
	}

	return store;
}

function useCellHighlight(
	rowId: string,
	runId: number,
	nextRunId: number | null,
	nextRowId: string | null,
	columnIds: readonly RunsProgressColumnId[],
	hasNode: boolean
): CellHighlightBundle {
	const store = useHighlightStore();
	const cacheRef = useRef<{
		signature: string;
		bundle: CellHighlightBundle;
	} | null>(null);

	const getSnapshot = () => {
		const bundle = computeBundle(
			store.getState(),
			rowId,
			runId,
			nextRunId,
			nextRowId,
			columnIds,
			hasNode
		);
		const signature = bundleSignature(bundle);

		if (cacheRef.current && cacheRef.current.signature === signature) {
			return cacheRef.current.bundle;
		}

		cacheRef.current = { signature, bundle };

		return bundle;
	};

	return useSyncExternalStore(store.subscribe, getSnapshot);
}

function useRowBottomHighlight(
	rowId: string,
	nextRowId: string | null
): boolean {
	const store = useHighlightStore();

	return useSyncExternalStore(store.subscribe, () => {
		const { hovered, pinned } = store.getState();
		const highlightedRowId = pinned ? pinned.rowId : hovered?.rowId ?? null;

		return (
			highlightedRowId !== null &&
			(highlightedRowId === rowId || highlightedRowId === nextRowId)
		);
	});
}

export type {
	CellHighlight,
	CellHighlightBundle,
	HighlightCellRef,
	HighlightStore,
	RunsProgressColumnId
};

export {
	HighlightContext,
	createHighlightStore,
	useCellHighlight,
	useHighlightStore,
	useRowBottomHighlight
};
