/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import {
	ResultTable,
	ResultTableEmpty,
	ResultTableError,
	ResultTableLoading
} from './result-table.component';
import { resultTableMock } from './result-table.mock';

const Story: Meta<typeof ResultTable> = {
	component: ResultTable,
	title: 'run/Result Table',
	parameters: { layout: 'padded', msw: { handlers: [] } },
	decorators: [(Story) => <MemoryRouter>{Story()}</MemoryRouter>]
};
export default Story;

export const Primary = {
	args: {
		runId: '1',
		data: resultTableMock
	}
};

export const Loading = () => <ResultTableLoading rowCount={25} />;
export const Empty = () => <ResultTableEmpty />;
export const Error = () => <ResultTableError />;
