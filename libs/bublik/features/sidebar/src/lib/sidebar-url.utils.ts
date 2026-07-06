/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { parsePath } from 'react-router-dom';
import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent
} from 'lz-string';

import { SIDEBAR_PREFIX } from '@/shared/types';
import { transformUrlSearch } from '@/shared/utils';

import {
	DASHBOARD_SIDEBAR_KEYS,
	HISTORY_MODE_DEFAULT,
	HISTORY_SIDEBAR_KEYS,
	LOG_MODE_DEFAULT,
	LOG_SIDEBAR_KEYS,
	MEASUREMENTS_MODE_DEFAULT,
	MEASUREMENTS_SIDEBAR_KEYS,
	RUNS_CHARTS_DEFAULT_URL,
	RUNS_MODE_DEFAULT,
	RUNS_PROGRESS_DEFAULT_URL,
	RUNS_SIDEBAR_KEYS,
	RUN_MODE_DEFAULT,
	RUN_SIDEBAR_KEYS,
	SHARED_SIDEBAR_KEYS,
	SIDEBAR_STATE_PARAM,
	getLogDefaultUrl,
	getRunDetailsDefaultUrl
} from './sidebar-state.constants';

type SidebarStateValue = string | string[];
type SidebarState = Record<string, SidebarStateValue>;
type EncodedParamInput = string | (string | null)[] | null | undefined;
type CompactSidebarState = [number, Record<string, SidebarStateValue>];

export const SIDEBAR_STATE_MAX_LENGTH = 1500;

/**
 * Value convention: a value starting with `/` is a full URL, anything else
 * for a URL key is a search string for that key's fixed pathname.
 * Default-equal entries are omitted entirely.
 */
const SIDEBAR_STATE_VERSION = 3;

interface SidebarKeyConfig {
	key: string;
	/** Short name the key is stored under inside the compact `_s` payload. */
	alias: string;
	/** URL-valued key: stripped of recursive sidebar params on read/write. */
	isUrl?: boolean;
	/**
	 * Fixed pathname (implies `isUrl`): the value is stored as a bare search
	 * string and the pathname is re-attached on decode. Values that do start
	 * with `/` (dynamic paths, unexpected pathnames, old payloads) pass
	 * through untouched.
	 */
	pathname?: string;
	/**
	 * Full-form value the per-feature hooks reconstruct on their own from the
	 * shared defaults in sidebar-state.constants — storing it in `_s` adds
	 * length without adding information, so it is dropped on encode.
	 */
	defaultValue?: string;
}

/**
 * Everything the encoder knows about a key lives in this one registry.
 * Entries are ordered by prune priority: when `_s` exceeds the length
 * budget, keys are dropped front to back. Exported for the registry
 * invariant spec only.
 */
export const SIDEBAR_KEY_REGISTRY: readonly SidebarKeyConfig[] = [
	{
		key: DASHBOARD_SIDEBAR_KEYS.LAST_URL,
		alias: 'du',
		pathname: '/dashboard'
	},
	{
		key: HISTORY_SIDEBAR_KEYS.LAST_STACKED,
		alias: 'hk',
		pathname: '/history'
	},
	{ key: HISTORY_SIDEBAR_KEYS.LAST_SERIES, alias: 'hs', pathname: '/history' },
	{ key: HISTORY_SIDEBAR_KEYS.LAST_TREND, alias: 'ht', pathname: '/history' },
	{
		key: HISTORY_SIDEBAR_KEYS.LAST_AGGREGATION,
		alias: 'ha',
		pathname: '/history'
	},
	{ key: HISTORY_SIDEBAR_KEYS.LAST_LINEAR, alias: 'hl', pathname: '/history' },
	{
		key: MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS,
		alias: 'mmu',
		isUrl: true
	},
	{ key: LOG_SIDEBAR_KEYS.LAST_LOG, alias: 'll', isUrl: true },
	{ key: RUN_SIDEBAR_KEYS.LAST_REPORT, alias: 'rr', isUrl: true },
	{ key: RUN_SIDEBAR_KEYS.LAST_DETAILS, alias: 'rd', isUrl: true },
	{
		key: RUNS_SIDEBAR_KEYS.LAST_MULTIPLE,
		alias: 'rlm',
		pathname: '/multiple'
	},
	{ key: RUNS_SIDEBAR_KEYS.LAST_COMPARE, alias: 'rlp', pathname: '/compare' },
	{
		key: RUNS_SIDEBAR_KEYS.LAST_PROGRESS,
		alias: 'rlpr',
		pathname: '/runs',
		defaultValue: RUNS_PROGRESS_DEFAULT_URL
	},
	{
		key: RUNS_SIDEBAR_KEYS.LAST_CHARTS,
		alias: 'rlc',
		pathname: '/runs',
		defaultValue: RUNS_CHARTS_DEFAULT_URL
	},
	{ key: RUNS_SIDEBAR_KEYS.LAST_LIST, alias: 'rll', pathname: '/runs' },
	{
		key: HISTORY_SIDEBAR_KEYS.LAST_MODE,
		alias: 'hm',
		defaultValue: HISTORY_MODE_DEFAULT
	},
	{
		key: MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE,
		alias: 'mm',
		defaultValue: MEASUREMENTS_MODE_DEFAULT
	},
	{
		key: LOG_SIDEBAR_KEYS.LAST_MODE,
		alias: 'lm',
		defaultValue: LOG_MODE_DEFAULT
	},
	{
		key: RUN_SIDEBAR_KEYS.LAST_MODE,
		alias: 'rnm',
		defaultValue: RUN_MODE_DEFAULT
	},
	{
		key: RUNS_SIDEBAR_KEYS.LAST_MODE,
		alias: 'rm',
		defaultValue: RUNS_MODE_DEFAULT
	},
	{ key: RUNS_SIDEBAR_KEYS.SELECTED, alias: 'rs' },
	{ key: SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID, alias: 'cr' }
];

const SIDEBAR_KEY_ALIAS_MAP: Record<string, string> = Object.fromEntries(
	SIDEBAR_KEY_REGISTRY.map(({ key, alias }) => [key, alias])
);

const SIDEBAR_ALIAS_KEYS: Record<string, string> = Object.fromEntries(
	SIDEBAR_KEY_REGISTRY.map(({ key, alias }) => [alias, key])
);

const URL_STATE_KEYS = new Set<string>(
	SIDEBAR_KEY_REGISTRY.filter(({ isUrl, pathname }) => isUrl || pathname).map(
		({ key }) => key
	)
);

const SIDEBAR_KEY_PATHNAMES: Record<string, string> = Object.fromEntries(
	SIDEBAR_KEY_REGISTRY.flatMap(({ key, pathname }) =>
		pathname ? [[key, pathname]] : []
	)
);

const SIDEBAR_KEY_DEFAULTS: Record<string, string> = Object.fromEntries(
	SIDEBAR_KEY_REGISTRY.flatMap(({ key, defaultValue }) =>
		defaultValue !== undefined ? [[key, defaultValue]] : []
	)
);

const SIDEBAR_STATE_PRUNE_ORDER = SIDEBAR_KEY_REGISTRY.map(({ key }) => key);

function getEncodedValue(input: EncodedParamInput): string | null | undefined {
	if (Array.isArray(input)) {
		return input[0] ?? null;
	}

	return input;
}

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === 'string')
	);
}

function normalizeSidebarState(value: unknown): SidebarState {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}

	const normalized: SidebarState = {};

	for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
		if (typeof entry === 'string' || isStringArray(entry)) {
			normalized[key] = entry;
		}
	}

	return normalized;
}

function isCompactSidebarState(value: unknown): value is CompactSidebarState {
	return (
		Array.isArray(value) &&
		value.length === 2 &&
		value[0] === SIDEBAR_STATE_VERSION &&
		!!value[1] &&
		typeof value[1] === 'object' &&
		!Array.isArray(value[1])
	);
}

function normalizeSidebarStateValue(
	key: string,
	value: SidebarStateValue
): SidebarStateValue | null {
	if (isStringArray(value)) {
		const normalizedValues = value.filter(Boolean);
		return normalizedValues.length > 0 ? normalizedValues : null;
	}

	const normalizedValue = URL_STATE_KEYS.has(key)
		? stripSidebarParamsFromUrl(value)
		: value;

	return normalizedValue ? normalizedValue : null;
}

function toCompactValue(key: string, value: string): string {
	const pathname = SIDEBAR_KEY_PATHNAMES[key];
	if (!pathname) {
		return value;
	}

	if (value === pathname) {
		return '';
	}

	if (value.startsWith(`${pathname}?`)) {
		return value.slice(pathname.length + 1);
	}

	return value;
}

function fromCompactValue(key: string, value: string): string {
	if (value.startsWith('/')) {
		return value;
	}

	const pathname = SIDEBAR_KEY_PATHNAMES[key];
	if (!pathname) {
		return value;
	}

	return value ? `${pathname}?${value}` : pathname;
}

function getCompactDefault(
	key: string,
	sidebarState: SidebarState
): string | null {
	const staticDefault = SIDEBAR_KEY_DEFAULTS[key];
	if (staticDefault !== undefined) {
		return toCompactValue(key, staticDefault);
	}

	const runId = sidebarState[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID];
	if (typeof runId === 'string' && runId) {
		if (key === RUN_SIDEBAR_KEYS.LAST_DETAILS) {
			return getRunDetailsDefaultUrl(runId);
		}
		if (key === LOG_SIDEBAR_KEYS.LAST_LOG) {
			return getLogDefaultUrl(runId);
		}
	}

	return null;
}

function decodeSidebarState(value: string): SidebarState {
	const decodedState = decodeCompressedState<unknown>(value);
	if (!isCompactSidebarState(decodedState)) {
		return {};
	}

	const normalized: SidebarState = {};

	for (const [alias, entry] of Object.entries(decodedState[1])) {
		const key = SIDEBAR_ALIAS_KEYS[alias];
		if (!key || !(typeof entry === 'string' || isStringArray(entry))) {
			continue;
		}

		const expandedValue =
			typeof entry === 'string' ? fromCompactValue(key, entry) : entry;
		const normalizedValue = normalizeSidebarStateValue(key, expandedValue);
		if (normalizedValue) {
			normalized[key] = normalizedValue;
		}
	}

	// URLs omitted on encode as equal to the CURRENT_RUN_ID-derived default
	// must be re-materialized: the run id is mutable, so once it changes the
	// omitted URL would otherwise be re-derived from the wrong run.
	const runId = normalized[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID];
	if (typeof runId === 'string' && runId) {
		normalized[RUN_SIDEBAR_KEYS.LAST_DETAILS] ??=
			getRunDetailsDefaultUrl(runId);
		normalized[LOG_SIDEBAR_KEYS.LAST_LOG] ??= getLogDefaultUrl(runId);
	}

	return normalized;
}

function compactSidebarState(sidebarState: SidebarState): CompactSidebarState {
	const compactState: Record<string, SidebarStateValue> = {};

	for (const [key, value] of Object.entries(sidebarState)) {
		const alias = SIDEBAR_KEY_ALIAS_MAP[key];
		if (!alias) {
			continue;
		}

		const normalizedValue = normalizeSidebarStateValue(key, value);
		if (!normalizedValue) {
			continue;
		}

		if (isStringArray(normalizedValue)) {
			compactState[alias] = normalizedValue;
			continue;
		}

		const compactValue = toCompactValue(key, normalizedValue);
		if (
			!compactValue ||
			compactValue === getCompactDefault(key, sidebarState)
		) {
			continue;
		}

		compactState[alias] = compactValue;
	}

	return [SIDEBAR_STATE_VERSION, compactState];
}

interface EncodedSidebarState {
	compactState: CompactSidebarState;
	encodedState: string;
}

function encodeSidebarState(sidebarState: SidebarState): EncodedSidebarState {
	const compactState = compactSidebarState(sidebarState);

	return { compactState, encodedState: encodeCompressedState(compactState) };
}

function pruneSidebarState(sidebarState: SidebarState): EncodedSidebarState {
	const prunedState = { ...sidebarState };
	let encoded = encodeSidebarState(prunedState);

	for (const key of SIDEBAR_STATE_PRUNE_ORDER) {
		if (encoded.encodedState.length <= SIDEBAR_STATE_MAX_LENGTH) {
			return encoded;
		}

		delete prunedState[key];
		encoded = encodeSidebarState(prunedState);
	}

	if (encoded.encodedState.length <= SIDEBAR_STATE_MAX_LENGTH) {
		return encoded;
	}

	return encodeSidebarState({});
}

function tryParseJson<T>(value: string): T | undefined {
	try {
		return JSON.parse(value) as T;
	} catch {
		return undefined;
	}
}

function parseLegacyJsonState<T>(value: string): T | undefined {
	const directValue = tryParseJson<T>(value);
	if (directValue !== undefined) {
		return directValue;
	}

	return tryParseJson<T>(decodeURIComponent(value));
}

function removeLegacySidebarParams(searchParams: URLSearchParams): void {
	const keysToRemove: string[] = [];

	searchParams.forEach((_, key) => {
		if (key.startsWith(`${SIDEBAR_PREFIX}.`)) {
			keysToRemove.push(key);
		}
	});

	keysToRemove.forEach((key) => searchParams.delete(key));
}

/**
 * Encodes any serializable value to a URI-safe compressed string.
 */
export function encodeCompressedState(value: unknown): string {
	return compressToEncodedURIComponent(JSON.stringify(value));
}

/**
 * Decodes a URI-safe lz-string compressed state value.
 */
export function decodeCompressedState<T>(value: string): T | null {
	const json = decompressFromEncodedURIComponent(value);
	if (!json) {
		return null;
	}

	const parsed = tryParseJson<T>(json);
	return parsed === undefined ? null : parsed;
}

let cachedEncodedState: string | null = null;
let cachedSidebarState: SidebarState = {};

/**
 * Reads compressed sidebar state from `_s` URL param. The same encoded value
 * is read many times per render across the nav hooks, so the last decode is
 * memoized; callers get a copy (arrays included) because
 * `updateSidebarStateSearchParams` mutates the returned map.
 */
export function getSidebarState(searchParams: URLSearchParams): SidebarState {
	const encodedState = searchParams.get(SIDEBAR_STATE_PARAM);

	if (!encodedState) {
		return {};
	}

	if (encodedState !== cachedEncodedState) {
		cachedSidebarState = decodeSidebarState(encodedState);
		cachedEncodedState = encodedState;
	}

	const copy: SidebarState = {};
	for (const [key, value] of Object.entries(cachedSidebarState)) {
		copy[key] = Array.isArray(value) ? [...value] : value;
	}

	return copy;
}

/**
 * Returns a string value from compressed sidebar state.
 */
export function getSidebarStateString(
	searchParams: URLSearchParams,
	key: string
): string | null {
	const value = getSidebarState(searchParams)[key];
	return typeof value === 'string' ? value : null;
}

/**
 * Returns a string array value from compressed sidebar state.
 */
export function getSidebarStateStringArray(
	searchParams: URLSearchParams,
	key: string
): string[] {
	const value = getSidebarState(searchParams)[key];
	return isStringArray(value) ? value : [];
}

/**
 * Updates a key in compressed sidebar state map.
 */
export function setSidebarStateValue(
	sidebarState: SidebarState,
	key: string,
	value: SidebarStateValue | null | undefined
): void {
	if (value === null || value === undefined) {
		delete sidebarState[key];
		return;
	}

	sidebarState[key] = value;
}

/**
 * Applies updater to compressed sidebar state and writes back to `_s`.
 * States that compact to nothing (only default-equal entries) remove the
 * param entirely, so default browsing produces clean URLs.
 */
export function updateSidebarStateSearchParams(
	searchParams: URLSearchParams,
	updater: (sidebarState: SidebarState) => void
): URLSearchParams | null {
	return getUpdatedSearchParams(searchParams, (newParams) => {
		removeLegacySidebarParams(newParams);

		const sidebarState = getSidebarState(newParams);
		updater(sidebarState);
		const { compactState, encodedState } = pruneSidebarState(
			normalizeSidebarState(sidebarState)
		);

		if (Object.keys(compactState[1]).length === 0) {
			newParams.delete(SIDEBAR_STATE_PARAM);
			return;
		}

		newParams.set(SIDEBAR_STATE_PARAM, encodedState);
	});
}

export function getUpdatedSearchParams(
	searchParams: URLSearchParams,
	updater: (newParams: URLSearchParams) => void
): URLSearchParams | null {
	const newParams = new URLSearchParams(searchParams);
	updater(newParams);

	return newParams.toString() === searchParams.toString() ? null : newParams;
}

/**
 * Strips sidebar params from a URL to avoid recursive state growth.
 */
export function stripSidebarParamsFromUrl(url: string): string {
	// Runs per URL key on every encode, so skip the rewrite when there is
	// nothing to strip.
	if (!parsePath(url).search) {
		return url;
	}

	return transformUrlSearch(url, (params) => {
		const keysToRemove: string[] = [];
		params.forEach((value, key) => {
			if (
				key.startsWith(`${SIDEBAR_PREFIX}.`) ||
				key === SIDEBAR_STATE_PARAM ||
				key === 'project' ||
				(key === 'mode' && value === 'default')
			) {
				keysToRemove.push(key);
			}
		});
		keysToRemove.forEach((key) => params.delete(key));
	});
}

/**
 * Reads the `mode` query param and validates it against an allow-list,
 * returning the default when it is absent or unknown. Shared by the
 * per-feature sidebar navs.
 */
export function getModeFromSearch<T extends string>(
	search: string,
	allowedModes: readonly T[],
	defaultMode: T
): T {
	const mode = new URLSearchParams(search).get('mode');
	return mode && allowedModes.includes(mode as T) ? (mode as T) : defaultMode;
}

/**
 * Gets base URL without mode parameter.
 */
export function getBaseUrl(url: string): string {
	if (!parsePath(url).search) {
		return url;
	}

	return transformUrlSearch(url, (params) => params.delete('mode'));
}

/**
 * Adds mode parameter to URL.
 */
export function addModeToUrl(baseUrl: string, mode: string): string {
	return transformUrlSearch(baseUrl, (params) => {
		if (mode === 'default') {
			params.delete('mode');
		} else {
			params.set('mode', mode);
		}
	});
}

/**
 * Generic function to extract ID from URL using a regex pattern.
 */
export function extractIdFromUrl(url: string, pattern: RegExp): string | null {
	const match = url.match(pattern);
	return match ? match[1] : null;
}

/**
 * Extracts runId from a run URL like /runs/86793 or /runs/86793/report
 */
export function extractRunIdFromUrl(url: string): string | null {
	return extractIdFromUrl(url, /\/runs\/(\d+)/);
}

/**
 * Extracts runId from a log URL like /log/86793 or /log/86793?mode=...
 */
export function extractRunIdFromLogUrl(url: string): string | null {
	return extractIdFromUrl(url, /\/log\/(\d+)/);
}

/**
 * Decodes compressed state first, then falls back to plain JSON.
 */
export function decodeCompressedOrJsonState<T>(
	input: EncodedParamInput
): T | null | undefined {
	const rawValue = getEncodedValue(input);

	if (rawValue === null || rawValue === undefined) {
		return rawValue;
	}

	const compressedValue = decodeCompressedState<T>(rawValue);
	if (compressedValue !== null) {
		return compressedValue;
	}

	return parseLegacyJsonState<T>(rawValue);
}

/**
 * Returns true if value is encoded as compressed state.
 */
export function isCompressedStateValue(value: string): boolean {
	return decodeCompressedState<unknown>(value) !== null;
}
