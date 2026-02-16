/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

import { parse, stringify } from 'zipson';

import { SIDEBAR_PREFIX } from '@/shared/types';

import { SIDEBAR_STATE_PARAM } from './sidebar-state.constants';

type SidebarStateValue = string | string[];
type SidebarState = Record<string, SidebarStateValue>;
type EncodedParamInput = string | (string | null)[] | null | undefined;

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

function getLegacySidebarState(searchParams: URLSearchParams): SidebarState {
	const legacyState: SidebarState = {};

	searchParams.forEach((_, key) => {
		if (!key.startsWith(`${SIDEBAR_PREFIX}.`)) {
			return;
		}

		const values = searchParams.getAll(key);
		if (values.length === 0) {
			return;
		}

		legacyState[key] = values.length === 1 ? values[0] : values;
	});

	return legacyState;
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
		const decodedState = decodeCompressedState<unknown>(encodedState);
		return normalizeSidebarState(decodedState);
	}

	return getLegacySidebarState(searchParams);
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

		if (Object.keys(sidebarState).length === 0) {
			newParams.delete(SIDEBAR_STATE_PARAM);
			return;
		}

		newParams.set(SIDEBAR_STATE_PARAM, encodeCompressedState(sidebarState));
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

	if (Object.keys(sidebarState).length === 0) {
		searchParams.delete(SIDEBAR_STATE_PARAM);
		return;
	}

	searchParams.set(SIDEBAR_STATE_PARAM, encodeCompressedState(sidebarState));
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
 * Keeps project params.
 */
export function stripSidebarParamsFromUrl(url: string): string {
	if (!url.includes('?')) return url;

	const [pathname, searchStr] = url.split('?');
	const params = new URLSearchParams(searchStr);

	const keysToRemove: string[] = [];
	params.forEach((_, key) => {
		if (key.startsWith(`${SIDEBAR_PREFIX}.`) || key === SIDEBAR_STATE_PARAM) {
			keysToRemove.push(key);
		}
	});
	keysToRemove.forEach((key) => params.delete(key));

	const cleanedSearch = params.toString();
	return cleanedSearch ? `${pathname}?${cleanedSearch}` : pathname;
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
