/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { StoryFn, Meta } from '@storybook/react';

import { Dialog, DialogContent, withBackground } from '@/shared/tailwind-ui';

import { ImportRunForm } from './import-run-form.component';

const Story: Meta<typeof ImportRunForm> = {
	component: ImportRunForm,
	title: 'import/Import Run Form',
	argTypes: { onImportRunsSubmit: { action: 'onImportRunsSubmit executed!' } },
	decorators: [withBackground]
};
export default Story;

const Template: StoryFn<typeof ImportRunForm> = (args) => (
	<Dialog open>
		<DialogContent>
			<ImportRunForm {...args} />
		</DialogContent>
	</Dialog>
);

export const ImportFormStep = {
	render: Template,
	args: {}
};
