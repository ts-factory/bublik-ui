/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { LoginPage } from '../../pages/auth';
import { loginSearch } from '../-search/login.search';

export const Route = createFileRoute('/auth/login')({
	validateSearch: loginSearch.validateSearch,
	search: { middlewares: loginSearch.middlewares },
	component: LoginPage
});
