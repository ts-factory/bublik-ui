/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';

export const RUN_DIFF_SLICE = 'runDiffSlice';

export interface AppStateWithRunDiffSlice {
	[RUN_DIFF_SLICE]: RunDiffSliceState;
}

export interface RunDiffSliceState {
	columnId: string;
	rowId: string;
}

const initialState: RunDiffSliceState = {
	columnId: '',
	rowId: ''
};

const runDiffSlice = createSlice({
	name: RUN_DIFF_SLICE,
	initialState,
	reducers: {
		hoverCellStart: (state, action: PayloadAction<RunDiffSliceState>) => {
			state.rowId = action.payload.rowId;
			state.columnId = action.payload.columnId;
		},
		hoverCellLeave: () => initialState
	}
});

export const { hoverCellStart, hoverCellLeave } = runDiffSlice.actions;
export const runDiffSliceReducer = runDiffSlice.reducer;

const selectRunDiffSlice = (state: AppStateWithRunDiffSlice) =>
	state[RUN_DIFF_SLICE];

const selectHoverColumnId = createSelector(
	selectRunDiffSlice,
	(state) => state.columnId
);

const selectHoverRowId = createSelector(
	selectRunDiffSlice,
	(state) => state.rowId
);

export const selectCurrentHoverCell = createSelector(
	selectHoverRowId,
	selectHoverColumnId,
	(rowId, columnId) => ({ rowId, columnId })
);

export const selectIsHoveredCell = (columnId: string, rowId: string) =>
	createSelector(selectCurrentHoverCell, (state) => {
		const isHoveredCurrentlyCell =
			state.rowId === rowId && state.columnId === columnId;

		const oppositeColumnId = columnId.includes('_LEFT')
			? columnId.replace('_LEFT', '_RIGHT')
			: columnId.replace('_RIGHT', '_LEFT');

		const isOpposite =
			state.columnId === oppositeColumnId && state.rowId === rowId;

		return isHoveredCurrentlyCell || isOpposite;
	});
