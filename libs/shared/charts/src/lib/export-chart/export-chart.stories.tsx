/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { ExportChart } from './export-chart';

export default {
	component: ExportChart,
	title: 'charts/Export Chart',
	decorators: [
		(Story) => <div className="p-4 bg-white rounded-md">{Story()}</div>
	]
} as Meta<typeof ExportChart>;

export const Primary = {
	args: {
		plots: [],
		isLoading: false,
		disabled: false
	}
};
