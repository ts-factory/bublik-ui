/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { withBackground } from '@/shared/tailwind-ui';

import { ChartControlPanel } from './chart-control-panel';

export default {
	component: ChartControlPanel,
	title: 'charts/Control Panel',
	actions: { argTypesRegex: '^on.*' },
	decorators: [withBackground]
} as Meta<typeof ChartControlPanel>;

const Template: StoryFn<typeof ChartControlPanel> = (args) => {
	const [mode, setMode] = useState<'line' | 'scatter'>('line');
	const [isZoomEnabled, setIsZoomEnabled] = useState(false);

	return (
		<ChartControlPanel
			mode={mode}
			onModeChange={setMode}
			onZoomEnabledChange={setIsZoomEnabled}
			isZoomEnabled={isZoomEnabled}
		/>
	);
};

export const Primary = {
	render: Template,

	args: {
		mode: 'line',
		isZoomEnabled: false
	}
};
