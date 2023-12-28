/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { TagsBoxInput } from './badge-box';
import { withBackground } from '../storybook-bg';
import { Icon } from '../icon';
import { useState } from 'react';

const Story: Meta<typeof TagsBoxInput> = {
	component: TagsBoxInput,
	title: 'components/Tags Box Input',
	tags: ['autodocs'],
	decorators: [withBackground]
};
export default Story;

const Template: StoryFn<typeof TagsBoxInput> = (args) => {
	const [values, setValues] = useState(args.values);

	return <TagsBoxInput {...args} values={values} onChange={setValues} />;
};

type Story = StoryObj<typeof TagsBoxInput>;
export const Primary: Story = {
	render: Template,
	args: {
		label: 'Tags',
		valueLabel: 'Tag',
		startIcon: <Icon name="Filter" size={20} className="mr-2 text-text-menu" />,
		endIcon: <Icon name="AddSymbol" size={24} className="ml-2" />,
		placeholder: 'Tags',
		values: [
			{
				value: 'next.js',
				label: 'Next.js'
			},
			{
				value: 'svelte-kit',
				label: 'SvelteKit',
				className: 'bg-badge-12'
			},
			{
				value: 'nuxt.js',
				label: 'Nuxt.js'
			},
			{
				value: 'remix',
				label: 'Remix'
			},
			{
				value: 'astro',
				label: 'Astro'
			},
			{
				value: 'wordpress',
				label: 'WordPress'
			}
		]
	}
};
