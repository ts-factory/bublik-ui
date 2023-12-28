/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { EChartsType } from '../echart';

export const toggleGlobalZoom = (instance: EChartsType, isEnabled: boolean) => {
	const zoom = {
		type: 'takeGlobalCursor',
		key: 'dataZoomSelect',
		dataZoomSelectActive: isEnabled
	};

	instance.dispatchAction(zoom);
};

export const resetZoom = (instance: EChartsType) => {
	instance.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
};
