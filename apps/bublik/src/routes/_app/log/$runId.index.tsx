/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { LogPage } from '../../../pages/log-page';
import { logSearch } from '../../-search/log.search';

export const Route = createFileRoute('/_app/log/$runId/')({
	validateSearch: logSearch.validateSearch,
	search: { middlewares: logSearch.middlewares },
	component: LogPage
});
