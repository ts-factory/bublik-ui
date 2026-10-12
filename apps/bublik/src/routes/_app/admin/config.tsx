/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { ConfigsPage } from '../../../pages/configs';
import { configSearch } from '../../-search/config.search';

export const Route = createFileRoute('/_app/admin/config')({
	validateSearch: configSearch.validateSearch,
	search: { middlewares: configSearch.middlewares },
	component: ConfigsPage
});
