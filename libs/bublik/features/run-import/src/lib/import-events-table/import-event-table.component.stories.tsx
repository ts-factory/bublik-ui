/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryObj } from '@storybook/react';

import {
	ImportEventTable,
	ImportEventTableError,
	ImportEventTableLoading
} from './import-event-table.component';

const Story: Meta<typeof ImportEventTable> = {
	component: ImportEventTable,
	title: 'import/Events Table',
	parameters: { layout: 'padded' }
};
export default Story;

type Story = StoryObj<typeof ImportEventTable>;

export const Primary = {
	args: {
		data: []
	}
} satisfies Story;

export const Loading = () => <ImportEventTableLoading />;

export const Error = () => <ImportEventTableError error={{ status: 404 }} />;
