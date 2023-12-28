/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { StoryFn, Meta } from '@storybook/react';
import {
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
	Command
} from './command';
import { withBackground } from '../storybook-bg';

export function CommandDemo() {
	return (
		<Command className="border rounded-lg shadow-md">
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Suggestions">
					<CommandItem>
						{/* <Calendar className="w-4 h-4 mr-2" /> */}
						<span>Calendar</span>
					</CommandItem>
					<CommandItem>
						{/* <Smile className="w-4 h-4 mr-2" /> */}
						<span>Search Emoji</span>
					</CommandItem>
					<CommandItem>
						{/* <Calculator className="w-4 h-4 mr-2" /> */}
						<span>Calculator</span>
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Settings">
					<CommandItem>
						{/* <User className="w-4 h-4 mr-2" /> */}
						<span>Profile</span>
						<CommandShortcut>⌘P</CommandShortcut>
					</CommandItem>
					<CommandItem>
						{/* <CreditCard className="w-4 h-4 mr-2" /> */}
						<span>Billing</span>
						<CommandShortcut>⌘B</CommandShortcut>
					</CommandItem>
					<CommandItem>
						{/* <Settings className="w-4 h-4 mr-2" /> */}
						<span>Settings</span>
						<CommandShortcut>⌘S</CommandShortcut>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	);
}

export default {
	component: Command,
	title: 'components/Command',
	decorators: [withBackground],
	parameters: { layout: 'centered' }
} satisfies Meta<typeof Command>;

const Template: StoryFn<typeof Command> = (args) => <CommandDemo />;

export const Primary = {
	render: Template,
	args: {}
};
