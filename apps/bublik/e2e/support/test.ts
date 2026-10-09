/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test as base } from '@playwright/test';

import { releaseLeases } from './leases';
import { freshStorageState, SHARED_STORAGE_STATE } from './session';

const test = base.extend<{ resultLeases: void }>({
	storageState: async ({ playwright, baseURL, storageState }, provide) => {
		if (storageState !== SHARED_STORAGE_STATE) {
			await provide(storageState);

			return;
		}

		if (!baseURL) {
			throw new Error('BASE_URL is not set, so no session can be minted');
		}

		await provide(await freshStorageState(playwright, baseURL));
	},
	/**
	 * Gives back the classifiable results the scenario leased
	 * (`claimFailingResult()`). Fixtures are torn down after `afterEach`, so a
	 * result goes back only once the sweep has deleted the issue stamping it.
	 */
	resultLeases: [
		// eslint-disable-next-line no-empty-pattern -- Playwright needs the destructuring
		async ({}, provide) => {
			try {
				await provide();
			} finally {
				releaseLeases();
			}
		},
		{ auto: true }
	]
});

export { expect, test };
