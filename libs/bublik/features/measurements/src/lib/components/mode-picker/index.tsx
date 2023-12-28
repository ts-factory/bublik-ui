/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MeasurementsMode } from '@/shared/types';

import { ModeDefault } from './mode-default';
import { ModeCharts } from './mode-charts';
import { ModeTables } from './mode-tables';
import { ModeSplit } from './mode-split';

export interface ModePickerProps {
	mode?: MeasurementsMode;
}

export const ModePicker = ({ mode }: ModePickerProps) => {
	switch (mode) {
		case MeasurementsMode.Charts:
			return <ModeCharts />;
		case MeasurementsMode.Split:
			return <ModeSplit />;
		case MeasurementsMode.Tables:
			return <ModeTables />;
		case MeasurementsMode.Default:
			return <ModeDefault />;
		default:
			return <ModeDefault />;
	}
};
