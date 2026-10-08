/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { LoginPage } from '../../pages/auth';

export const Route = createFileRoute('/auth/login')({
	component: LoginPage
});
