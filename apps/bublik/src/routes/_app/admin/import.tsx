/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { ImportPage } from '../../../pages/import-page';
import { importSearch } from '../../-search/import.search';

export const Route = createFileRoute('/_app/admin/import')({
	validateSearch: importSearch.validateSearch,
	search: { middlewares: importSearch.middlewares },
	component: ImportPage
});
