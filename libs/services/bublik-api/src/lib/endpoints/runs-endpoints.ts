/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EndpointBuilder } from '@reduxjs/toolkit/query';

import { RunsAPIResponse, RunsAPIQuery } from '@/shared/types';

import { prepareForSend } from '../utils';
import { BUBLIK_TAG } from '../types';
import { BublikBaseQueryFn, withApiV2 } from '../config';
import { API_REDUCER_PATH } from '../constants';

export const runsEndpoints = {
	endpoints: (
		build: EndpointBuilder<BublikBaseQueryFn, BUBLIK_TAG, API_REDUCER_PATH>
	) => ({
		getRunsTablePage: build.query<RunsAPIResponse, RunsAPIQuery>({
			query: (queryParams) => ({
				url: withApiV2('/runs'),
				params: prepareForSend(queryParams),
				cache: 'no-cache'
			}),
			providesTags: [BUBLIK_TAG.Run, BUBLIK_TAG.SessionList]
		})
	})
};
