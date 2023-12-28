/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { withBackground } from '../storybook-bg';
import { ButtonStylesProps, ButtonTw } from './button-v2';
import { Icon } from '../icon';

const Story: Meta<typeof ButtonTw> = {
	component: ButtonTw,
	title: 'components/ButtonTw',
	decorators: [withBackground]
};
export default Story;

const Template: StoryFn<typeof ButtonTw> = ({ ...restProps }) => {
	const BUTTON_SIZES: ButtonStylesProps['size'][] = [
		'xss',
		'xs',
		'xs/2',
		'sm',
		'sm/2',
		'md',
		'lg'
	];

	const BUTTON_VARIANTS: ButtonStylesProps['variant'][] = [
		'primary',
		'secondary',
		'outline',
		'ghost',
		'link',
		'destruction'
	];

	return (
		<div className="grid gap-4">
			<table>
				<thead>
					<tr>
						<th />
						{BUTTON_SIZES.map((variant) => (
							<th className="px-1" key={variant}>
								{variant}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{BUTTON_VARIANTS.map((variant) => (
						<tr key={variant}>
							<td className="px-2 py-1">{variant}</td>
							{BUTTON_SIZES.map((size) => (
								<td className="px-2 py-1" key={size}>
									<ButtonTw
										key={`${variant}_${size}`}
										variant={variant}
										size={size}
										{...restProps}
									/>
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

type Story = StoryObj<typeof ButtonTw>;
export const List: Story = {
	render: Template,
	args: {
		children: 'Button text',
		rounded: 'md',
		disabled: false
	}
};

export const Single: Story = {
	render: (args) => <ButtonTw {...args}>Button text</ButtonTw>,
	args: {
		size: 'md',
		variant: 'primary',
		state: 'default',
		rounded: 'md'
	}
};

export const Disabled: Story = {
	render: (args) => <ButtonTw {...args}>Button text</ButtonTw>,
	args: {
		size: 'md',
		variant: 'primary',
		rounded: 'md',
		disabled: true
	}
};

export const WithIcon: Story = {
	render: (args) => (
		<ButtonTw {...args}>
			Button text <Icon size={16} name="Paper" className="ml-2" />
		</ButtonTw>
	),
	args: {
		size: 'xss',
		variant: 'secondary'
	}
};
