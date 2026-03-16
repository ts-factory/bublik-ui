/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { test as setup } from '@playwright/test';

import { LoginPage } from './pages/login-page';

const STORAGE_STATE = 'e2e/.auth/state.json';

// eslint-disable-next-line playwright/expect-expect
setup('Authenticate as admin and persist storage state', async ({ page }) => {
	const loginPage = new LoginPage(page);

	await loginPage.signInAsAdmin();
	await page.context().storageState({ path: STORAGE_STATE });
});
