/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { readFile } from 'node:fs/promises';

import type {
	BrowserContextOptions,
	PlaywrightWorkerArgs
} from '@playwright/test';

function adminEmail(): string {
	return (
		process.env['BUBLIK_E2E_EMAIL'] ??
		process.env['DJANGO_SUPERUSER_EMAIL'] ??
		'admin@bublik.com'
	);
}

function adminPassword(): string {
	return (
		process.env['BUBLIK_E2E_PASSWORD'] ??
		process.env['DJANGO_SUPERUSER_PASSWORD'] ??
		'admin'
	);
}

const SHARED_STORAGE_STATE = 'e2e/.auth/state.json';

const SESSION_MAX_AGE_MS = 5 * 60 * 1000;

type Playwright = PlaywrightWorkerArgs['playwright'];
type StorageState = Exclude<
	BrowserContextOptions['storageState'],
	string | undefined
>;
type Cookies = StorageState['cookies'];

let minted: { baseURL: string; at: number; cookies: Cookies } | undefined;

async function signIn(
	playwright: Playwright,
	baseURL: string
): Promise<Cookies> {
	const context = await playwright.request.newContext({ baseURL });

	try {
		const response = await context.post('/auth/login/', {
			data: { email: adminEmail(), password: adminPassword() }
		});

		if (!response.ok()) {
			throw new Error(
				`E2E sign-in as ${adminEmail()} failed: ` +
					`${response.status()} ${await response.text()}`
			);
		}

		return (await context.storageState()).cookies;
	} finally {
		await context.dispose();
	}
}

async function signedInCookies(
	playwright: Playwright,
	baseURL: string
): Promise<Cookies> {
	const now = Date.now();

	if (
		!minted ||
		minted.baseURL !== baseURL ||
		now - minted.at >= SESSION_MAX_AGE_MS
	) {
		minted = { baseURL, at: now, cookies: await signIn(playwright, baseURL) };
	}

	return minted.cookies;
}

async function freshStorageState(
	playwright: Playwright,
	baseURL: string
): Promise<StorageState> {
	const stored = (await readFile(SHARED_STORAGE_STATE, 'utf8').then(
		(contents) => JSON.parse(contents) as StorageState,
		(cause: Error) => {
			throw new Error(
				`Cannot read ${SHARED_STORAGE_STATE}, which the auth setup project ` +
					'writes — run the suite without --no-deps, or through `task e2e:test`',
				{ cause }
			);
		}
	)) as StorageState;

	return {
		...stored,
		cookies: await signedInCookies(playwright, baseURL)
	};
}

export {
	adminEmail,
	adminPassword,
	freshStorageState,
	SESSION_MAX_AGE_MS,
	SHARED_STORAGE_STATE
};
