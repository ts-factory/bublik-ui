/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { afterEach, describe, expect, vi } from 'vitest';

import type { GetLogJsonInputs, RootBlock } from '@/shared/types';

import {
	constructJsonUrl,
	fetchJson,
	fixPagesCountForAllView,
	normalizeLogJsonInput
} from './log-endpoints';

const createResponse = (body: string, status = 200): Response =>
	new Response(body, {
		status,
		statusText: status === 200 ? 'OK' : 'Request failed',
		headers: { 'Content-Type': 'application/json' }
	});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('fetchJson', () => {
	test('retries truncated JSON and returns the completed response', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(createResponse('{"root":'))
			.mockResolvedValueOnce(createResponse('{"root":[]}'));
		vi.stubGlobal('fetch', fetchMock);

		const result = fetchJson<{ root: unknown[] }>('/logs/node.json');
		const expectation = expect(result).resolves.toEqual({ root: [] });

		await vi.runAllTimersAsync();
		await expectation;
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('retries a transient 404 response', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(createResponse('Not Found', 404))
			.mockResolvedValueOnce(createResponse('{"root":[]}'));
		vi.stubGlobal('fetch', fetchMock);

		const result = fetchJson<{ root: unknown[] }>('/logs/node.json');
		const expectation = expect(result).resolves.toEqual({ root: [] });

		await vi.runAllTimersAsync();
		await expectation;
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('retries a transient fetch failure', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new TypeError('Failed to fetch'))
			.mockResolvedValueOnce(createResponse('{"root":[]}'));
		vi.stubGlobal('fetch', fetchMock);

		const result = fetchJson<{ root: unknown[] }>('/logs/node.json');
		const expectation = expect(result).resolves.toEqual({ root: [] });

		await vi.runAllTimersAsync();
		await expectation;
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('retries a transient response stream failure', async () => {
		vi.useFakeTimers();
		const failedResponse = createResponse('{"root":[]}');
		vi.spyOn(failedResponse, 'json').mockRejectedValueOnce(
			new TypeError('NetworkError when attempting to fetch resource')
		);
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(failedResponse)
			.mockResolvedValueOnce(createResponse('{"root":[]}'));
		vi.stubGlobal('fetch', fetchMock);

		const result = fetchJson<{ root: unknown[] }>('/logs/node.json');
		const expectation = expect(result).resolves.toEqual({ root: [] });

		await vi.runAllTimersAsync();
		await expectation;
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	test('returns a useful error after parse retries are exhausted', async () => {
		vi.useFakeTimers();
		const fetchMock = vi
			.fn()
			.mockImplementation(() => Promise.resolve(createResponse('{"root":')));
		vi.stubGlobal('fetch', fetchMock);

		const result = fetchJson('/logs/node.json').catch((error) => error);

		await vi.runAllTimersAsync();
		expect(await result).toEqual({
			status: 503,
			title: 'Log is not ready',
			description: 'Log generation did not complete. Please retry in a moment.'
		});
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	test('does not retry a non-transient client error', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(createResponse('Bad Request', 400));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchJson('/logs/node.json')).rejects.toEqual({
			status: 400,
			data: 'Request failed'
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	test('stops retrying when the request is aborted', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(createResponse('Not Found', 404));
		vi.stubGlobal('fetch', fetchMock);
		const controller = new AbortController();

		const result = fetchJson('/logs/node.json', controller.signal);
		await Promise.resolve();
		controller.abort();

		await expect(result).rejects.toMatchObject({ name: 'AbortError' });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	test('does not retry a transport failure after the request is aborted', async () => {
		const controller = new AbortController();
		const fetchMock = vi.fn().mockImplementation(() => {
			controller.abort();
			return Promise.reject(new TypeError('Failed to fetch'));
		});
		vi.stubGlobal('fetch', fetchMock);

		await expect(
			fetchJson('/logs/node.json', controller.signal)
		).rejects.toMatchObject({ name: 'AbortError' });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

const createLogBlocks = (curPage: number, pagesCount: number): RootBlock => ({
	version: 'v1',
	root: [
		{
			type: 'te-log',
			pagination: { cur_page: curPage, pages_count: pagesCount },
			content: []
		}
	]
});

const createApi = (
	queries: Record<string, { originalArgs?: GetLogJsonInputs; data?: RootBlock }>
): BaseQueryApi =>
	({
		getState: () => ({ bublikApi: { queries } })
	} as unknown as BaseQueryApi);

describe('constructJsonUrl', () => {
	test('it constructs the correct URL without page', () => {
		const inputWithoutPage = { id: '1' };
		const result = constructJsonUrl(inputWithoutPage);
		const expectedUrl = '/api/v2/logs/1/json/';
		expect(result).toBe(expectedUrl);
	});
	test('it constructs the correct URL with page', () => {
		const inputWithPage = { id: '1', page: 2 };
		const result = constructJsonUrl(inputWithPage);
		const expectedUrl = '/api/v2/logs/1/json/?page=2';
		expect(result).toBe(expectedUrl);
	});

	test('it constructs the same URL for null and omitted page', () => {
		const resultWithNullPage = constructJsonUrl({ id: '1', page: null });
		const resultWithoutPage = constructJsonUrl({ id: '1' });

		expect(resultWithNullPage).toBe(resultWithoutPage);
	});

	test('it constructs the all-pages URL for numeric page zero', () => {
		expect(constructJsonUrl({ id: '1', page: 0 })).toBe(
			'/api/v2/logs/1/json/?page=0'
		);
	});
});

describe('normalizeLogJsonInput', () => {
	test('it removes null page from log json query args', () => {
		expect(normalizeLogJsonInput({ id: '1', page: null })).toEqual({ id: '1' });
	});

	test('it preserves actual page values', () => {
		expect(normalizeLogJsonInput({ id: '1', page: 2 })).toEqual({
			id: '1',
			page: 2
		});
	});
});

describe('fixPagesCountForAllView', () => {
	test('uses the cached canonical first page count', () => {
		const allPages = createLogBlocks(0, 0);
		const api = createApi({
			'getLogJson({"id":"1"})': {
				originalArgs: { id: '1' },
				data: createLogBlocks(1, 12)
			}
		});

		const result = fixPagesCountForAllView(allPages, 1, api);

		expect(result.root[0].pagination?.pages_count).toBe(12);
		expect(allPages.root[0].pagination?.pages_count).toBe(0);
	});

	test('does not use another all-pages cache entry', () => {
		const allPages = createLogBlocks(0, 0);
		const api = createApi({
			'getLogJson({"id":"1","page":"0"})': {
				originalArgs: { id: '1', page: '0' },
				data: createLogBlocks(0, 12)
			}
		});

		const result = fixPagesCountForAllView(allPages, 1, api);

		expect(result.root[0].pagination?.pages_count).toBe(0);
	});
});
