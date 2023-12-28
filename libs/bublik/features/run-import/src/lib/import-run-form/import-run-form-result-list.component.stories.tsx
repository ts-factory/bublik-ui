/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { StoryFn, Meta } from '@storybook/react';

import { Dialog, DialogContent, withBackground } from '@/shared/tailwind-ui';

import { RunImportResult } from './import-run-form-result-list.component';

const Story: Meta<typeof RunImportResult> = {
	component: RunImportResult,
	title: 'import/Run Import Result List',
	decorators: [withBackground]
};
export default Story;

const Template: StoryFn<typeof RunImportResult> = (args) => (
	<Dialog open>
		<DialogContent className="w-[816px]">
			<RunImportResult {...args} />
		</DialogContent>
	</Dialog>
);

export const Primary = {
	render: Template,

	args: {
		results: [
			{
				url: 'https://www.youtube.com/watch?v=1',
				taskId: '1'
			},
			{
				url: 'https://www.youtube.com/watch?v=2',
				taskId: undefined
			},
			{
				url: 'https://www.youtube.com/watch?v=3',
				taskId: '3'
			}
		]
	}
};
