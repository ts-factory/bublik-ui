/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { PieChart } from './pie-chart.component';
import { withBackground } from '@/shared/tailwind-ui';

const meta: Meta<typeof PieChart> = {
	component: PieChart,
	title: 'charts/Pie Chart',
	decorators: [withBackground]
};
export default meta;
type Story = StoryObj<typeof PieChart>;

const Template: StoryFn<typeof PieChart> = (args) => {
	return (
		<div className="grid place-items-center w-[600px] h-[400px]">
			<PieChart {...args} />
		</div>
	);
};

export const Primary = {
	render: Template,
	args: {
		title: 'Runs by status',
		label: 'Runs',
		data: [
			{ name: 'OK', value: 43 },
			{ name: 'WARNING', value: 31 },
			{ name: 'ERROR', value: 19 },
			{ name: 'COMPROMISED', value: 7 }
		],
		borderWidth: 2,
		borderRadius: 4,
		style: { width: 600, height: 400 }
	}
} satisfies Story;
