/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test as base } from '@playwright/test';

import { freshStorageState, SHARED_STORAGE_STATE } from './session';

const test = base.extend({
	storageState: async ({ playwright, baseURL, storageState }, provide) => {
		if (storageState !== SHARED_STORAGE_STATE) {
			await provide(storageState);

			return;
		}

		if (!baseURL) {
			throw new Error('BASE_URL is not set, so no session can be minted');
		}

		await provide(await freshStorageState(playwright, baseURL));
	}
});

export { expect, test };
