/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { parse, stringify } from 'zipson';

import { SIDEBAR_PREFIX } from '@/shared/types';

import {
	DASHBOARD_SIDEBAR_KEYS,
	HISTORY_SIDEBAR_KEYS,
	LOG_SIDEBAR_KEYS,
	MEASUREMENTS_SIDEBAR_KEYS,
	RUNS_SIDEBAR_KEYS,
	RUN_SIDEBAR_KEYS,
	SHARED_SIDEBAR_KEYS,
	SIDEBAR_STATE_PARAM
} from './sidebar-state.constants';

type SidebarStateValue = string | string[];
type SidebarState = Record<string, SidebarStateValue>;
type EncodedParamInput = string | (string | null)[] | null | undefined;
type CompactSidebarState = [2, Record<string, SidebarStateValue>];

export const SIDEBAR_STATE_MAX_LENGTH = 1500;

const SIDEBAR_KEY_ALIASES = {
	[RUNS_SIDEBAR_KEYS.SELECTED]: 'rs',
	[RUNS_SIDEBAR_KEYS.LAST_LIST]: 'rll',
	[RUNS_SIDEBAR_KEYS.LAST_CHARTS]: 'rlc',
	[RUNS_SIDEBAR_KEYS.LAST_COMPARE]: 'rlp',
	[RUNS_SIDEBAR_KEYS.LAST_MULTIPLE]: 'rlm',
	[RUNS_SIDEBAR_KEYS.LAST_MODE]: 'rm',
	[RUN_SIDEBAR_KEYS.LAST_DETAILS]: 'rd',
	[RUN_SIDEBAR_KEYS.LAST_REPORT]: 'rr',
	[RUN_SIDEBAR_KEYS.LAST_MODE]: 'rnm',
	[MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS]: 'mmu',
	[MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE]: 'mm',
	[LOG_SIDEBAR_KEYS.LAST_LOG]: 'll',
	[LOG_SIDEBAR_KEYS.LAST_MODE]: 'lm',
	[HISTORY_SIDEBAR_KEYS.LAST_LINEAR]: 'hl',
	[HISTORY_SIDEBAR_KEYS.LAST_AGGREGATION]: 'ha',
	[HISTORY_SIDEBAR_KEYS.LAST_TREND]: 'ht',
	[HISTORY_SIDEBAR_KEYS.LAST_SERIES]: 'hs',
	[HISTORY_SIDEBAR_KEYS.LAST_STACKED]: 'hk',
	[HISTORY_SIDEBAR_KEYS.LAST_MODE]: 'hm',
	[SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID]: 'cr',
	[SHARED_SIDEBAR_KEYS.LAST_LOG_RUN_ID]: 'lr',
	[SHARED_SIDEBAR_KEYS.LAST_RUN_RUN_ID]: 'rrid',
	[DASHBOARD_SIDEBAR_KEYS.LAST_URL]: 'du'
} as const;

const SIDEBAR_KEY_ALIAS_MAP: Record<string, string> = SIDEBAR_KEY_ALIASES;

const SIDEBAR_ALIAS_KEYS = Object.fromEntries(
	Object.entries(SIDEBAR_KEY_ALIAS_MAP).map(([key, alias]) => [alias, key])
) as Record<string, string>;

const URL_STATE_KEYS = new Set<string>([
	RUNS_SIDEBAR_KEYS.LAST_LIST,
	RUNS_SIDEBAR_KEYS.LAST_CHARTS,
	RUNS_SIDEBAR_KEYS.LAST_COMPARE,
	RUNS_SIDEBAR_KEYS.LAST_MULTIPLE,
	RUN_SIDEBAR_KEYS.LAST_DETAILS,
	RUN_SIDEBAR_KEYS.LAST_REPORT,
	MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS,
	LOG_SIDEBAR_KEYS.LAST_LOG,
	HISTORY_SIDEBAR_KEYS.LAST_LINEAR,
	HISTORY_SIDEBAR_KEYS.LAST_AGGREGATION,
	HISTORY_SIDEBAR_KEYS.LAST_TREND,
	HISTORY_SIDEBAR_KEYS.LAST_SERIES,
	HISTORY_SIDEBAR_KEYS.LAST_STACKED,
	DASHBOARD_SIDEBAR_KEYS.LAST_URL
]);

const SIDEBAR_STATE_PRUNE_ORDER = [
	DASHBOARD_SIDEBAR_KEYS.LAST_URL,
	HISTORY_SIDEBAR_KEYS.LAST_STACKED,
	HISTORY_SIDEBAR_KEYS.LAST_SERIES,
	HISTORY_SIDEBAR_KEYS.LAST_TREND,
	HISTORY_SIDEBAR_KEYS.LAST_AGGREGATION,
	HISTORY_SIDEBAR_KEYS.LAST_LINEAR,
	MEASUREMENTS_SIDEBAR_KEYS.LAST_MEASUREMENTS,
	LOG_SIDEBAR_KEYS.LAST_LOG,
	RUN_SIDEBAR_KEYS.LAST_REPORT,
	RUN_SIDEBAR_KEYS.LAST_DETAILS,
	RUNS_SIDEBAR_KEYS.LAST_MULTIPLE,
	RUNS_SIDEBAR_KEYS.LAST_COMPARE,
	RUNS_SIDEBAR_KEYS.LAST_CHARTS,
	RUNS_SIDEBAR_KEYS.LAST_LIST,
	SHARED_SIDEBAR_KEYS.LAST_LOG_RUN_ID,
	SHARED_SIDEBAR_KEYS.LAST_RUN_RUN_ID,
	HISTORY_SIDEBAR_KEYS.LAST_MODE,
	MEASUREMENTS_SIDEBAR_KEYS.LAST_MODE,
	LOG_SIDEBAR_KEYS.LAST_MODE,
	RUN_SIDEBAR_KEYS.LAST_MODE,
	RUNS_SIDEBAR_KEYS.LAST_MODE,
	RUNS_SIDEBAR_KEYS.SELECTED,
	SHARED_SIDEBAR_KEYS.CURRENT_RUN_ID
];

interface GlobalWithBuffer {
	Buffer?: {
		from: (
			value: string | Uint8Array,
			encoding?: string
		) => {
			toString: (encoding?: string) => string;
		};
	};
}

function bytesToBinary(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return binary;
}

function binaryToBytes(binary: string): Uint8Array {
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function toBase64(value: string): string | null {
	const bytes = new TextEncoder().encode(value);

	if (typeof globalThis.btoa === 'function') {
		return globalThis.btoa(bytesToBinary(bytes));
	}

	const buffer = (globalThis as GlobalWithBuffer).Buffer;
	if (buffer) {
		return buffer.from(bytes).toString('base64');
	}

	return null;
}

function fromBase64(value: string): string | null {
	if (typeof globalThis.atob === 'function') {
		const binary = globalThis.atob(value);
		return new TextDecoder().decode(binaryToBytes(binary));
	}

	const buffer = (globalThis as GlobalWithBuffer).Buffer;
	if (buffer) {
		const binary = buffer.from(value, 'base64').toString('binary');
		return new TextDecoder().decode(binaryToBytes(binary));
	}

	return null;
}

function encodeBase64Url(value: string): string | null {
	const base64 = toBase64(value);
	if (!base64) {
		return null;
	}

	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function decodeBase64Url(value: string): string | null {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padding = normalized.length % 4;
	const base64 =
		padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`;

	try {
		return fromBase64(base64);
	} catch {
		return null;
	}
}

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
		value[0] === 2 &&
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

		const normalizedValue = normalizeSidebarStateValue(key, entry);
		if (normalizedValue) {
			normalized[key] = normalizedValue;
		}
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
		if (normalizedValue) {
			compactState[alias] = normalizedValue;
		}
	}

	return [2, compactState];
}

function encodeSidebarState(sidebarState: SidebarState): string {
	return encodeCompressedState(compactSidebarState(sidebarState));
}

function pruneSidebarState(sidebarState: SidebarState): SidebarState {
	const prunedState = { ...sidebarState };
	let encodedState = encodeSidebarState(prunedState);

	for (const key of SIDEBAR_STATE_PRUNE_ORDER) {
		if (encodedState.length <= SIDEBAR_STATE_MAX_LENGTH) {
			return prunedState;
		}

		delete prunedState[key];
		encodedState = encodeSidebarState(prunedState);
	}

	if (encodedState.length <= SIDEBAR_STATE_MAX_LENGTH) {
		return prunedState;
	}

	return {};
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
 * Encodes any serializable value to base64url(zipson(value)).
 */
export function encodeCompressedState(value: unknown): string {
	const zipped = stringify(value);
	const encoded = encodeBase64Url(zipped);

	if (!encoded) {
		throw new Error('Failed to encode compressed URL state');
	}

	return encoded;
}

/**
 * Decodes base64url(zipson(value)) to original value.
 */
export function decodeCompressedState<T>(value: string): T | null {
	const decoded = decodeBase64Url(value);
	if (!decoded) {
		return null;
	}

	try {
		return parse(decoded) as T;
	} catch {
		return null;
	}
}

/**
 * Reads compressed sidebar state from `_s` URL param.
 */
export function getSidebarState(searchParams: URLSearchParams): SidebarState {
	const encodedState = searchParams.get(SIDEBAR_STATE_PARAM);

	if (encodedState) {
		return decodeSidebarState(encodedState);
	}

	return {};
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
 */
export function updateSidebarStateSearchParams(
	searchParams: URLSearchParams,
	updater: (sidebarState: SidebarState) => void
): URLSearchParams | null {
	return getUpdatedSearchParams(searchParams, (newParams) => {
		removeLegacySidebarParams(newParams);

		const sidebarState = getSidebarState(newParams);
		updater(sidebarState);
		const prunedState = pruneSidebarState(normalizeSidebarState(sidebarState));

		if (Object.keys(prunedState).length === 0) {
			newParams.delete(SIDEBAR_STATE_PARAM);
			return;
		}

		newParams.set(SIDEBAR_STATE_PARAM, encodeSidebarState(prunedState));
	});
}

export function parseModeParam<T extends string>(
	searchParams: URLSearchParams,
	key: string,
	allowedModes: readonly T[]
): T | null {
	const mode = getSidebarStateString(searchParams, key);
	if (!mode) {
		return null;
	}

	return allowedModes.includes(mode as T) ? (mode as T) : null;
}

/**
 * Backward-compatible helper kept for existing usage.
 */
export function setEncodedUrlParam(
	searchParams: URLSearchParams,
	key: string,
	rawUrl: string
): void {
	removeLegacySidebarParams(searchParams);

	const sidebarState = getSidebarState(searchParams);
	setSidebarStateValue(sidebarState, key, stripSidebarParamsFromUrl(rawUrl));
	const prunedState = pruneSidebarState(normalizeSidebarState(sidebarState));

	if (Object.keys(prunedState).length === 0) {
		searchParams.delete(SIDEBAR_STATE_PARAM);
		return;
	}

	searchParams.set(SIDEBAR_STATE_PARAM, encodeSidebarState(prunedState));
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
	if (!url.includes('?')) return url;

	const [pathname, searchAndHash] = url.split('?');
	const [searchStr, hash] = searchAndHash.split('#');
	const params = new URLSearchParams(searchStr);

	const keysToRemove: string[] = [];
	params.forEach((value, key) => {
		if (
			key.startsWith(`${SIDEBAR_PREFIX}.`) ||
			key === SIDEBAR_STATE_PARAM ||
			key === 'project' ||
			value === '' ||
			(key === 'mode' && value === 'default')
		) {
			keysToRemove.push(key);
		}
	});
	keysToRemove.forEach((key) => params.delete(key));

	const cleanedSearch = params.toString();
	const cleanedPath = cleanedSearch ? `${pathname}?${cleanedSearch}` : pathname;
	return hash ? `${cleanedPath}#${hash}` : cleanedPath;
}

/**
 * Backward-compatible helper kept for existing usage.
 */
export function encodeUrlForParam(url: string): string {
	return stripSidebarParamsFromUrl(url);
}

/**
 * Backward-compatible helper kept for existing usage.
 */
export function decodeUrlFromParam(encoded: string | null): string | null {
	return encoded;
}

/**
 * Gets base URL without mode parameter.
 */
export function getBaseUrl(url: string): string {
	if (!url.includes('?')) return url;
	const [pathname, searchStr] = url.split('?');
	const params = new URLSearchParams(searchStr);
	params.delete('mode');
	const search = params.toString();
	return search ? `${pathname}?${search}` : pathname;
}

/**
 * Adds mode parameter to URL.
 */
export function addModeToUrl(baseUrl: string, mode: string): string {
	if (!baseUrl.includes('?')) {
		return mode === 'default' ? baseUrl : `${baseUrl}?mode=${mode}`;
	}
	const [pathname, searchStr] = baseUrl.split('?');
	const params = new URLSearchParams(searchStr);
	if (mode === 'default') {
		params.delete('mode');
	} else {
		params.set('mode', mode);
	}
	const search = params.toString();
	return search ? `${pathname}?${search}` : pathname;
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
 * Returns true if value is encoded as base64url(zipson(...)).
 */
export function isCompressedStateValue(value: string): boolean {
	return decodeCompressedState<unknown>(value) !== null;
}
