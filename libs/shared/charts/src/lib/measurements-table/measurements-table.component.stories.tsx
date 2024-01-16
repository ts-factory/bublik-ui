/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Meta } from '@storybook/react';

import { MeasurementsTable } from './measurements-table.component';

export default {
	component: MeasurementsTable,
	title: 'charts/Measurement Table',
	parameters: { layout: 'padded' }
} as Meta<typeof MeasurementsTable>;

export const Primary = {
	args: {
		data: [],
		isLockedMode: false,
		chartsHeight: 0
	}
};
