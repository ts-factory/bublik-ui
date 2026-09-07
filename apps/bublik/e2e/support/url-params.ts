/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Page } from '@playwright/test';

type ParamExpectation = string | null;

const POLL = { timeout: 15_000 } as const;

const QUERY_DELIMITER = ';';

class UrlParams {
	constructor(private readonly page: Page) {}

	private search(): URLSearchParams {
		return new URL(this.page.url()).searchParams;
	}

	get(key: string): string | null {
		return this.search().get(key);
	}

	getAll(key: string): string[] {
		return this.search().getAll(key);
	}

	private delimited(key: string): string[] {
		return (this.get(key) ?? '')
			.split(QUERY_DELIMITER)
			.filter((value) => value.length > 0);
	}

	async expect(expected: Record<string, ParamExpectation>): Promise<void> {
		for (const [key, value] of Object.entries(expected)) {
			await expect
				.poll(() => this.get(key), {
					...POLL,
					message: `URL parameter "${key}"`
				})
				.toBe(value);
		}
	}

	async expectPresent(keys: readonly string[]): Promise<void> {
		await expect
			.poll(
				() => {
					const params = this.search();

					return keys.filter((key) => !params.has(key));
				},
				{ ...POLL, message: 'URL parameters that are not written' }
			)
			.toEqual([]);
	}

	async expectAbsent(keys: readonly string[]): Promise<void> {
		await expect
			.poll(
				() => {
					const params = this.search();

					return keys.filter((key) => params.has(key));
				},
				{ ...POLL, message: 'URL parameters that should not be written' }
			)
			.toEqual([]);
	}

	async expectRepeated(key: string, values: readonly string[]): Promise<void> {
		const expected = [...values].sort();

		await expect
			.poll(() => [...this.getAll(key)].sort(), {
				...POLL,
				message: `repeated URL parameter "${key}"`
			})
			.toEqual(expected);
	}

	async expectDelimitedContains(
		key: string,
		...values: string[]
	): Promise<void> {
		for (const value of values) {
			await expect
				.poll(() => this.delimited(key), {
					...POLL,
					message: `URL parameter "${key}" should carry "${value}"`
				})
				.toContain(value);
		}
	}

	async expectDelimitedExactly(
		key: string,
		values: readonly string[]
	): Promise<void> {
		const expected = [...values].sort();

		await expect
			.poll(() => [...this.delimited(key)].sort(), {
				...POLL,
				message: `URL parameter "${key}"`
			})
			.toEqual(expected);
	}

	async expectWritten(key: string): Promise<void> {
		await expect
			.poll(() => this.get(key), {
				...POLL,
				message: `URL parameter "${key}" should be written`
			})
			.not.toBeNull();
	}

	async expectChangedWhile(
		key: string,
		action: () => Promise<void>
	): Promise<void> {
		const before = this.get(key);

		await action();

		await expect
			.poll(() => this.get(key), {
				...POLL,
				message: `URL parameter "${key}" should have changed`
			})
			.not.toBe(before);
	}

	async expectUnchangedWhile(
		keys: readonly string[],
		action: () => Promise<void>,
		settleMs = 2_000
	): Promise<void> {
		const before = this.snapshot(keys);

		await action();
		// eslint-disable-next-line playwright/no-wait-for-timeout
		await this.page.waitForTimeout(settleMs);

		expect(this.snapshot(keys)).toEqual(before);
	}

	snapshot(keys: readonly string[]): Record<string, string[]> {
		const params = this.search();

		return Object.fromEntries(keys.map((key) => [key, params.getAll(key)]));
	}
}

function urlParams(page: Page): UrlParams {
	return new UrlParams(page);
}

export { QUERY_DELIMITER, UrlParams, urlParams };
export type { ParamExpectation };
