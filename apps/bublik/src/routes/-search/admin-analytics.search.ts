/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { defineSearch, passthrough, type InferSearch } from '@/router';

/**
 * `/admin/analytics`. The keys are the backend's snake_case
 * query and the page parses them itself (`parseSearchParams`): `;`-joined
 * lists, a page from 1 and a page size from 100 to 500. They pass through
 * untouched so the URL stays as it is.
 */
const adminAnalyticsSearch = defineSearch({
	page: passthrough(),
	page_size: passthrough(),
	event_type: passthrough(),
	event_name: passthrough(),
	path: passthrough(),
	anon_id: passthrough(),
	app_version: passthrough(),
	search: passthrough(),
	payload_search: passthrough()
});

type AdminAnalyticsSearch = InferSearch<typeof adminAnalyticsSearch>;

export { adminAnalyticsSearch };
export type { AdminAnalyticsSearch };
