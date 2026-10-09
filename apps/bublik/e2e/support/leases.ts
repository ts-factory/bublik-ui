/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LeaseBook } from './result-leases';
import type { LeasableResult } from './result-leases';

/**
 * The leases the running scenario holds on classifiable results
 * (`result-leases.ts`). `support/test.ts` releases them once the scenario —
 * its `afterEach` sweep included — is over.
 */

/** How long a scenario waits for a result or run another scenario holds. */
const LEASE_WAIT_MS = 30_000;
const LEASE_POLL_MS = 250;

let book: LeaseBook | undefined;

/**
 * Shared by every Playwright process on this host, so concurrent runs against
 * one stack never hand two scenarios the same result. `BUBLIK_E2E_LEASE_DIR`
 * overrides the root.
 */
function leaseDir(stackKey: string): string {
	const root =
		process.env['BUBLIK_E2E_LEASE_DIR'] ?? join(tmpdir(), 'bublik-e2e-leases');
	const dir = join(root, stackKey.replace(/[^\w.-]+/g, '_'));

	mkdirSync(dir, { recursive: true });

	return dir;
}

async function lease<T>(
	stackKey: string,
	scenario: string,
	what: string,
	attempt: (book: LeaseBook) => T | null
): Promise<T> {
	book ??= new LeaseBook(leaseDir(stackKey), scenario);
	const deadline = Date.now() + LEASE_WAIT_MS;

	for (;;) {
		const leased = attempt(book);
		if (leased) return leased;

		if (Date.now() >= deadline) {
			throw new Error(
				`${scenario}: no ${what} came free within ${LEASE_WAIT_MS / 1000}s; ` +
					'every classifiable result is leased by a running scenario.'
			);
		}

		await new Promise((resolve) => setTimeout(resolve, LEASE_POLL_MS));
	}
}

function leaseResult<T extends LeasableResult>(
	stackKey: string,
	scenario: string,
	pool: readonly T[]
): Promise<T> {
	return lease(stackKey, scenario, 'failing result', (held) =>
		held.tryResult(pool)
	);
}

function leaseTest<T extends LeasableResult>(
	stackKey: string,
	scenario: string,
	pool: readonly T[]
): Promise<T[]> {
	return lease(stackKey, scenario, 'run of its own', (held) =>
		held.tryTest(pool)
	);
}

/** Gives back whatever the scenario leased. */
function releaseLeases(): void {
	book?.release();
	book = undefined;
}

export { leaseResult, leaseTest, releaseLeases };
