/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { idParams } from '@/router';

import { NoMatchFeature } from '../../../pages/not-found-page';
import { LogPage } from '../../../pages/log-page';
import { logSearch } from '../../-search/log.search';

export const Route = createFileRoute('/_app/log/$runId/')({
	params: idParams('runId'),
	validateSearch: logSearch.validateSearch,
	search: { middlewares: logSearch.middlewares },
	notFoundComponent: NoMatchFeature,
	component: LogPage
});
