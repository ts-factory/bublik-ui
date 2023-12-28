/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta, StoryObj } from '@storybook/react';
import { ButtonTw } from '../button';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

import { withBackground } from '../storybook-bg';
import { SelectInput } from './select';
import { useState } from 'react';

const Story: Meta<typeof SelectInput> = {
	component: SelectInput,
	title: 'components/Select',
	decorators: [withBackground],
	parameters: { layout: 'centered' }
};
export default Story;

const Template: StoryFn<typeof SelectInput> = (args) => {
	const options = [
		{ value: '1', displayValue: 'One' },
		{ value: '2', displayValue: 'Two' }
	];
	const [value, setValue] = useState('1');

	return (
		<div className="p-4 bg-white w-80">
			<SelectInput
				{...args}
				onValueChange={setValue}
				value={value}
				options={options}
			/>
		</div>
	);
};

type Story = StoryObj<typeof SelectInput>;
export const Primary = {
	render: Template,
	args: { label: 'Select' }
} satisfies Story;

const PopoverTemplate: StoryFn<typeof SelectInput> = (args) => (
	<Popover>
		<PopoverTrigger asChild aria-label="Compromised form">
			<ButtonTw size={'xss'} variant="secondary">
				Open
			</ButtonTw>
		</PopoverTrigger>
		<PopoverContent sideOffset={5}>
			<div className="p-8 bg-white rounded-lg w-80 shadow-popover">
				<SelectInput {...args} />
			</div>
		</PopoverContent>
	</Popover>
);

export const InPopover = {
	render: PopoverTemplate,

	args: {
		...Primary.args
	}
};
