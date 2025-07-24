/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import type { Meta, StoryObj } from '@storybook/react';

import { SplitButton } from './split-button.component';
import { Icon } from '../icon';
import { withBackground } from '../storybook-bg';

const meta: Meta<typeof SplitButton> = {
	component: SplitButton,
	title: 'components/SplitButton',
	decorators: [withBackground]
};

export default meta;
type Story = StoryObj<typeof SplitButton>;

export const Primary: Story = {
	render: () => (
		<SplitButton variant="primary" size="md">
			<SplitButton.Button>
				<Icon name="Paper" className="mr-2" />
				<span>Primary Action</span>
			</SplitButton.Button>
			<SplitButton.Trigger>
				<Icon name="ChevronDown" />
			</SplitButton.Trigger>
			<SplitButton.Content>
				<div className="p-4">Dropdown Content</div>
			</SplitButton.Content>
		</SplitButton>
	)
};

export const Outline: Story = {
	render: () => (
		<SplitButton variant="outline" size="md">
			<SplitButton.Button>
				<Icon name="Paper" className="mr-2" />
				<span>Outline Action</span>
			</SplitButton.Button>
			<SplitButton.Trigger>
				<Icon name="ChevronDown" />
			</SplitButton.Trigger>
			<SplitButton.Content>
				<div className="p-4">Dropdown Content</div>
			</SplitButton.Content>
		</SplitButton>
	)
};

export const Disabled: Story = {
	render: () => (
		<SplitButton variant="primary" size="md" disabled>
			<SplitButton.Button>
				<Icon name="Paper" className="mr-2" />
				<span>Disabled Action</span>
			</SplitButton.Button>
			<SplitButton.Trigger>
				<Icon name="ChevronDown" />
			</SplitButton.Trigger>
			<SplitButton.Content>
				<div className="p-4">Dropdown Content</div>
			</SplitButton.Content>
		</SplitButton>
	)
};

export const AllVariants: Story = {
	render: () => {
		const variants = [
			'primary',
			'secondary',
			'outline',
			'ghost',
			'destruction'
		] as const;

		return (
			<div className="flex flex-col gap-4">
				{variants.map((variant) => (
					<SplitButton key={variant} variant={variant} size="md">
						<SplitButton.Button>
							<span>{variant} Action</span>
						</SplitButton.Button>
						<SplitButton.Trigger>
							<Icon name="ChevronDown" />
						</SplitButton.Trigger>
						<SplitButton.Content>
							<div className="p-4">{variant} dropdown content</div>
						</SplitButton.Content>
					</SplitButton>
				))}
			</div>
		);
	}
};

export const AllSizes: Story = {
	render: () => {
		const sizes = ['xss', 'xs', 'xs/2', 'sm', 'sm/2', 'md', 'lg'] as const;

		return (
			<div className="flex flex-col gap-4">
				{sizes.map((size) => (
					<SplitButton key={size} variant="primary" size={size}>
						<SplitButton.Button>
							<span>Size {size}</span>
						</SplitButton.Button>
						<SplitButton.Trigger>
							<Icon name="ChevronDown" size={size === 'xss' ? 12 : 16} />
						</SplitButton.Trigger>
						<SplitButton.Content>
							<div className="p-4">Size {size} content</div>
						</SplitButton.Content>
					</SplitButton>
				))}
			</div>
		);
	}
};

export const CustomContent: Story = {
	render: () => (
		<SplitButton variant="primary" size="md">
			<SplitButton.Button>
				<Icon name="Paper" className="mr-2" />
				<span>Custom Content</span>
			</SplitButton.Button>
			<SplitButton.Trigger>
				<Icon name="ChevronDown" />
			</SplitButton.Trigger>
			<SplitButton.Content className="bg-blue-100 p-4 rounded-lg">
				<h3 className="font-bold">Custom Styled Content</h3>
				<p>This has a custom background and padding</p>
			</SplitButton.Content>
		</SplitButton>
	)
};

export const ExampleLinkWithItems: Story = {
	render: () => (
		<SplitButton.Root variant="secondary" size="xss">
			<SplitButton.Button>
				<Icon name="Paper" size={20} className="mr-2" />
				<span>History</span>
			</SplitButton.Button>
			<SplitButton.Separator orientation="vertical" className="h-5" />
			<SplitButton.Trigger>
				<Icon name="ChevronDown" size={16} />
			</SplitButton.Trigger>
			<SplitButton.Content>
				<SplitButton.Label>Links</SplitButton.Label>
				<SplitButton.Separator className="my-1" />
				<SplitButton.Item>
					<Icon name="PaperText" size={20} />
					<span>With Items</span>
				</SplitButton.Item>
			</SplitButton.Content>
		</SplitButton.Root>
	)
};
