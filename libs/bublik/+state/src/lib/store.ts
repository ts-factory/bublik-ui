/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { configureStore } from '@reduxjs/toolkit';

import { bublikAPI } from '@/services/bublik-api';
import { RUNS_PAGE_SLICE, runsPageReducer } from '@/bublik/features/runs';
import {
	runDiffSliceReducer,
	RUN_DIFF_SLICE
} from '@/bublik/features/run-diff';
import {
	historySliceReducer,
	HISTORY_SLICE_NAME
} from '@/bublik/features/history';

export const store = configureStore({
	reducer: {
		[bublikAPI.reducerPath]: bublikAPI.reducer,
		[RUNS_PAGE_SLICE]: runsPageReducer,
		[RUN_DIFF_SLICE]: runDiffSliceReducer,
		[HISTORY_SLICE_NAME]: historySliceReducer
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false }).concat(
			bublikAPI.middleware
		),
	devTools: true
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
