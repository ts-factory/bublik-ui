/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
	ColumnFiltersState,
	ColumnOrderState,
	ExpandedState,
	OnChangeFn,
	PaginationState,
	SortingState,
	VisibilityState
} from '@tanstack/react-table';

import { useAnySearch, useSearchWriter } from '@/router';

import { useLocalStorage } from '@/shared/hooks';

import { DELIMITER, KEY } from './classification-table.constants';
import {
	groupRowId,
	reconcileColumnOrder,
	type ColumnOrderPins
} from './classification-table.utils';
import {
	columnOverrides,
	idList,
	readTableSearch,
	toTableWire
} from './classification-table.search';
import type {
	ClassificationQueryArgs,
	ClassificationTableState,
	ClassificationTableStateConfig
} from './classification-table.types';

const EMPTY_SORTING: SortingState = [];
const EMPTY_EXPANDED: ExpandedState = {};

/**
 * The URL state of a classification table, read through its schema from
 * the search of the route on screen, and written back the way
 * use-query-params' `replaceIn` did: one replace that merges the changed
 * keys into the current search, a value equal to the table's default
 * written as an absent key.
 */
export function useClassificationTableState<F extends string>({
	search: schema,
	searchColumnId,
	orderingByColumnId
}: ClassificationTableStateConfig<F>): ClassificationTableState {
	const filterKeys = schema.facets;
	const filterKeysToken = filterKeys.join(DELIMITER);

	// Structurally shared: the same values keep the same object, so the
	// memos below only move when the URL says something new.
	// The tables speak for four routes and read their keys through the
	// schema's codecs.
	const params = useAnySearch(
		(search) => readTableSearch(schema, search) as Record<string, unknown>
	);

	const writeSearch = useSearchWriter();
	const update = useCallback(
		(changes: Record<string, unknown>) =>
			writeSearch(toTableWire(schema, changes)),
		[schema, writeSearch]
	);

	const search = (params[KEY.SEARCH] as string | undefined) ?? '';
	const sorting =
		(params[KEY.SORT] as SortingState | undefined) ?? EMPTY_SORTING;

	const columnFilters = useMemo<ColumnFiltersState>(() => {
		const filters: ColumnFiltersState = [];

		for (const key of filterKeys) {
			const values = (params[key] as string[] | undefined) ?? [];

			if (values.length) filters.push({ id: key, value: values });
		}

		if (search) filters.push({ id: searchColumnId, value: search });

		return filters;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params, filterKeysToken, searchColumnId, search]);

	const pagination = useMemo<PaginationState>(
		() => ({
			pageIndex: Math.max(0, (params[KEY.PAGE] as number) - 1),
			pageSize: params[KEY.PAGE_SIZE] as number
		}),
		[params]
	);

	const onColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(columnFilters)
					: updaterOrValue;

			const changes: Record<string, unknown> = {};

			for (const key of filterKeys) {
				const entry = next.find((filter) => filter.id === key);
				changes[key] = (entry?.value as string[] | undefined) ?? [];
			}

			const query = next.find((filter) => filter.id === searchColumnId);
			changes[KEY.SEARCH] = String(query?.value ?? '');
			changes[KEY.PAGE] = 1;

			update(changes);
		},
		[columnFilters, filterKeys, searchColumnId, update]
	);

	const setSearch = useCallback(
		(value: string) => update({ [KEY.SEARCH]: value, [KEY.PAGE]: 1 }),
		[update]
	);

	const expanded =
		(params[KEY.EXPANDED] as ExpandedState | undefined) ?? EMPTY_EXPANDED;

	const onExpandedChange = useCallback<OnChangeFn<ExpandedState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(expanded)
					: updaterOrValue;

			update({ [KEY.EXPANDED]: next });
		},
		[expanded, update]
	);

	const onSortingChange = useCallback<OnChangeFn<SortingState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(sorting)
					: updaterOrValue;

			update({ [KEY.SORT]: next });
		},
		[sorting, update]
	);

	const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(pagination)
					: updaterOrValue;

			const sizeChanged = next.pageSize !== pagination.pageSize;

			update({
				[KEY.PAGE_SIZE]: next.pageSize,
				[KEY.PAGE]: sizeChanged ? 1 : next.pageIndex + 1
			});
		},
		[pagination, update]
	);

	/** A link past the last page lands on the last page, by a replace. */
	const clampPage = useCallback(
		(pageCount: number) => {
			if (pageCount <= 0) return;
			if (pagination.pageIndex < pageCount) return;

			update({ [KEY.PAGE]: pageCount });
		},
		[pagination.pageIndex, update]
	);

	const resetFilters = useCallback(() => {
		const changes: Record<string, unknown> = {
			[KEY.SEARCH]: '',
			[KEY.PAGE]: 1
		};

		for (const key of filterKeys) changes[key] = [];

		update(changes);
	}, [filterKeys, update]);

	const queryArgs = useMemo<ClassificationQueryArgs>(() => {
		const filters: Record<string, string[]> = {};

		for (const filter of columnFilters) {
			if (filter.id === searchColumnId) continue;
			if (Array.isArray(filter.value) && filter.value.length) {
				filters[filter.id] = filter.value as string[];
			}
		}

		const [sort] = sorting;
		const field = sort
			? orderingByColumnId && sort.id in orderingByColumnId
				? orderingByColumnId[sort.id]
				: sort.id
			: null;

		return {
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			search: search || undefined,
			ordering: field ? `${sort.desc ? '-' : ''}${field}` : undefined,
			filters
		};
	}, [
		columnFilters,
		pagination,
		search,
		sorting,
		searchColumnId,
		orderingByColumnId
	]);

	return {
		pagination,
		onPaginationChange,
		columnFilters,
		onColumnFiltersChange,
		sorting,
		onSortingChange,
		search,
		setSearch,
		hasFilters: columnFilters.length > 0,
		resetFilters,
		clampPage,
		queryArgs,
		expanded,
		onExpandedChange
	};
}

/**
 * The value of one search key of the route on screen, through `codec`, or
 * `undefined` when there is no key to read. The search may hold the
 * route's typed value or the raw wire string: the codec parses both.
 */
function useSearchKey<T>(
	key: string | undefined,
	codec: { parse: (raw: unknown) => T | undefined }
): T | undefined {
	return useAnySearch((search) =>
		key === undefined ? undefined : codec.parse(search[key])
	);
}

/** `+id` / `-id` overrides, as the `cols` key spells them. */
const COLUMNS_CODEC = columnOverrides();

/** The column ids, left to right, as the `order` key spells them. */
const ORDER_CODEC = idList();

const NO_OVERRIDES: VisibilityState = {};

/** The columns whose visibility differs from what `defaults` would give them. */
function diffVisibility(
	state: VisibilityState,
	defaults: VisibilityState
): VisibilityState {
	const overrides: VisibilityState = {};

	for (const [id, visible] of Object.entries(state)) {
		// A column missing from a visibility state is visible.
		if (visible !== (defaults[id] ?? true)) overrides[id] = visible;
	}

	return overrides;
}

function hasOverrides(overrides: VisibilityState) {
	return Object.keys(overrides).length > 0;
}

/**
 * Column visibility resolved as URL → localStorage → `defaults`.
 *
 * What is stored is the *diff* against `defaults`, not the whole state, which is
 * what lets `defaults` depend on how much room the table has. Hiding a column
 * that the current default already hides records nothing, so it comes back when
 * there is room for it again; showing one explicitly records `+id` and it stays
 * shown at every width until it is hidden again.
 *
 * Pass `queryKey` to put the diff in the URL as well (a replace that merges
 * into the current search), making a column set linkable. Without it the
 * hook is localStorage-only and never touches the URL.
 */
export function useColumnVisibility(
	tableKey: string,
	defaults: VisibilityState,
	options: { queryKey?: string } = {}
): [VisibilityState, OnChangeFn<VisibilityState>] {
	const { queryKey } = options;

	const [storedOverrides, setStoredOverrides] =
		useLocalStorage<VisibilityState>(
			`bublik.columns.${tableKey}`,
			NO_OVERRIDES
		);

	const queryOverrides = useSearchKey(queryKey, COLUMNS_CODEC) ?? NO_OVERRIDES;
	const writeSearch = useSearchWriter();

	const overrides =
		queryKey && hasOverrides(queryOverrides) ? queryOverrides : storedOverrides;

	// Tokens rather than the objects themselves: both sides are rebuilt on most
	// renders, and only a change in what they *say* should move the table.
	const defaultsToken = COLUMNS_CODEC.serialize(defaults) ?? '';
	const overridesToken = COLUMNS_CODEC.serialize(overrides) ?? '';

	const columnVisibility = useMemo(
		() => ({ ...defaults, ...overrides }),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[defaultsToken, overridesToken]
	);

	const setColumnVisibility = useCallback<OnChangeFn<VisibilityState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(columnVisibility)
					: updaterOrValue;

			const nextOverrides = diffVisibility(next, defaults);

			setStoredOverrides(nextOverrides);
			if (queryKey) {
				writeSearch({ [queryKey]: COLUMNS_CODEC.serialize(nextOverrides) });
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[columnVisibility, defaultsToken, queryKey, setStoredOverrides, writeSearch]
	);

	return [columnVisibility, setColumnVisibility];
}

const NO_SAVED_ORDER: string[] = [];

/**
 * Column order resolved as URL → localStorage → `defaultOrder`, reconciled
 * against `defaultOrder` every time it is read so a saved order survives
 * columns coming and going.
 *
 * `pins` name the columns the reader cannot move — the status stripe stays
 * first and Actions stays last — and they are enforced on every read too, so a
 * stale save or a hand-edited link never puts them anywhere else. An order
 * that comes out equal to the default records nothing, so the param disappears
 * and a later change of default still applies. The tuple is shaped for
 * `useReactTable`: pass it as `state.columnOrder` and `onColumnOrderChange`.
 *
 * Pass `queryKey` to put the order in the URL as well (a replace that merges
 * into the current search), making it linkable. Without it the hook is
 * localStorage-only and never touches the URL.
 */
export function useColumnOrder(
	tableKey: string,
	defaultOrder: readonly string[],
	pins: ColumnOrderPins = {},
	options: { queryKey?: string } = {}
): [string[], OnChangeFn<ColumnOrderState>] {
	const { queryKey } = options;

	const [saved, setSaved] = useLocalStorage<string[]>(
		`bublik.column-order.${tableKey}`,
		NO_SAVED_ORDER
	);

	const queryOrder = useSearchKey(queryKey, ORDER_CODEC) ?? NO_SAVED_ORDER;
	const writeSearch = useSearchWriter();

	const source = queryKey && queryOrder.length ? queryOrder : saved;

	// Tokens: callers rebuild the arrays on most renders and only a change in
	// what they say should re-run the reconciliation.
	const defaultToken = defaultOrder.join(DELIMITER);
	const sourceToken = source.join(DELIMITER);
	const firstToken = (pins.first ?? []).join(DELIMITER);
	const lastToken = (pins.last ?? []).join(DELIMITER);

	const columnOrder = useMemo(
		() => reconcileColumnOrder(source, defaultOrder, pins),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[defaultToken, sourceToken, firstToken, lastToken]
	);

	const setColumnOrder = useCallback<OnChangeFn<ColumnOrderState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(columnOrder)
					: updaterOrValue;

			const reconciled = reconcileColumnOrder(next, defaultOrder, pins);
			const isDefault =
				reconciled.join(DELIMITER) ===
				reconcileColumnOrder([], defaultOrder, pins).join(DELIMITER);
			const nextOrder = isDefault ? NO_SAVED_ORDER : reconciled;

			setSaved(nextOrder);
			if (queryKey) {
				writeSearch({ [queryKey]: ORDER_CODEC.serialize(nextOrder) });
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			columnOrder,
			defaultToken,
			firstToken,
			lastToken,
			queryKey,
			setSaved,
			writeSearch
		]
	);

	return [columnOrder, setColumnOrder];
}

function allOpen(ids: readonly string[]): ExpandedState {
	return Object.fromEntries(ids.map((id) => [id, true]));
}

/**
 * The `expanded` state of a table grouped by `columnId`, with every group open
 * to begin with.
 *
 * The table's expanded model only unfolds a group whose id is in the map, and
 * a fresh page brings fresh group ids the map has never seen. So whenever the
 * set of groups changes — a new page, a filter, another project appearing —
 * the map starts over with all of them open; in between, folding and
 * unfolding go through the table's own `toggleExpanded` untouched. Rows that
 * are not groups (a rule's detail panel) share the map and simply start
 * closed, as they did before.
 *
 * Pair with `autoResetExpanded: false`: the table's own reset would empty the
 * map on every data change, which reads as every group folded.
 */
export function useGroupedExpanded(
	columnId: string,
	groupValues: readonly unknown[]
): [ExpandedState, OnChangeFn<ExpandedState>] {
	const ids = Array.from(
		new Set(groupValues.map((value) => groupRowId(columnId, value)))
	);
	const token = ids.join(DELIMITER);

	const [state, setState] = useState(() => ({
		token,
		expanded: allOpen(ids)
	}));

	// Derived from the groups rather than reset in an effect, so the first
	// paint of a new page already has its groups open.
	const expanded = state.token === token ? state.expanded : allOpen(ids);
	if (state.token !== token) setState({ token, expanded });

	const onExpandedChange = useCallback<OnChangeFn<ExpandedState>>(
		(updaterOrValue) =>
			setState((previous) => ({
				token,
				expanded:
					typeof updaterOrValue === 'function'
						? updaterOrValue(
								previous.token === token ? previous.expanded : allOpen(ids)
						  )
						: updaterOrValue
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[token]
	);

	return [expanded, onExpandedChange];
}

/**
 * A measurement of an element, kept current by a `ResizeObserver`, via a
 * callback ref.
 *
 * A callback ref rather than a `RefObject` because the tables mount their
 * scroller only after loading resolves: an effect keyed on a ref object runs
 * once, while the node is still absent, and never measures anything.
 */
function useElementMeasure<T extends HTMLElement>(
	measure: (node: HTMLElement) => number
) {
	const [value, setValue] = useState<number>();
	const observerRef = useRef<ResizeObserver>();

	const ref = useCallback(
		(node: T | null) => {
			observerRef.current?.disconnect();

			if (!node) return;

			const observer = new ResizeObserver(() => setValue(measure(node)));

			observer.observe(node);
			observerRef.current = observer;
			setValue(measure(node));
		},
		[measure]
	);

	useEffect(() => () => observerRef.current?.disconnect(), []);

	return [ref, value] as const;
}

const clientWidth = (node: HTMLElement) => node.clientWidth;
const offsetHeight = (node: HTMLElement) => node.offsetHeight;

/** The measured content width of an element, via a callback ref. */
export function useElementWidth<T extends HTMLElement>() {
	return useElementMeasure<T>(clientWidth);
}

/** The measured border-box height of an element, via a callback ref. */
export function useElementHeight<T extends HTMLElement>() {
	return useElementMeasure<T>(offsetHeight);
}

/**
 * Whether a `position: sticky` element inside `scrollRef` is currently pinned
 * at `offsetPx` from the container's top — that is, whether the content it
 * belongs to has scrolled up underneath it. Off when there is no container.
 */
export function useIsStuck(
	ref: RefObject<HTMLElement>,
	scrollRef: RefObject<HTMLElement> | undefined,
	offsetPx: number
) {
	const [isStuck, setIsStuck] = useState(false);

	useEffect(() => {
		const container = scrollRef?.current;
		const element = ref.current;
		if (!container || !element) return;

		function check() {
			const top =
				(element as HTMLElement).getBoundingClientRect().top -
				(container as HTMLElement).getBoundingClientRect().top;

			// Pinned elements sit exactly at the offset; a hair of slack covers
			// sub-pixel layout.
			setIsStuck(top <= offsetPx + 0.5);
		}

		check();
		container.addEventListener('scroll', check, { passive: true });

		return () => container.removeEventListener('scroll', check);
	}, [ref, scrollRef, offsetPx]);

	return isStuck;
}

/**
 * Whether content has scrolled up past `offsetPx` from the top of
 * `scrollRef`, judged by `markerRef`: a zero-height element that is *not*
 * sticky, placed where the scrolled content starts. Unlike `useIsStuck`, this
 * is off while nothing has moved — a sticky element that starts out at its
 * pin position reads as pinned before any scroll. Off when there is no
 * container.
 */
export function useHasScrolledPast(
	markerRef: RefObject<HTMLElement>,
	scrollRef: RefObject<HTMLElement> | undefined,
	offsetPx: number
) {
	const [hasScrolledPast, setHasScrolledPast] = useState(false);

	useEffect(() => {
		const container = scrollRef?.current;
		const marker = markerRef.current;
		if (!container || !marker) return;

		function check() {
			const top =
				(marker as HTMLElement).getBoundingClientRect().top -
				(container as HTMLElement).getBoundingClientRect().top;

			// Strictly above the offset; a hair of slack covers sub-pixel layout.
			setHasScrolledPast(top < offsetPx - 0.5);
		}

		check();
		container.addEventListener('scroll', check, { passive: true });

		return () => container.removeEventListener('scroll', check);
	}, [markerRef, scrollRef, offsetPx]);

	return hasScrolledPast;
}
