import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { RunReport } from './run-report.component';
import { withBackground } from '@/shared/tailwind-ui';

const Story: Meta<typeof RunReport> = {
	component: RunReport,
	title: 'components/Run Report',
	decorators: [withBackground]
};
export default Story;

const Template: StoryFn<typeof RunReport> = (args) => <RunReport {...args} />;

type Story = StoryObj<typeof RunReport>;
export const Primart: Story = {
	render: Template,
	args: {}
};
