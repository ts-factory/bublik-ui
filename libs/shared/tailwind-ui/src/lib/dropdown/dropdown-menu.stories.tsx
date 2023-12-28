/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useState } from 'react';
import { Meta } from '@storybook/react';

import { ButtonTw } from '../button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from './dropdown-menu.component';
import { withBackground } from '../storybook-bg';

export default {
	component: DropdownMenu,
	title: 'components/Dropdown Menu',
	decorators: [withBackground],
	parameters: { layout: 'centered' }
} satisfies Meta<typeof DropdownMenu>;

export function Checkboxes() {
	const [showStatusBar, setShowStatusBar] = useState(true);
	const [showActivityBar, setShowActivityBar] = useState(false);
	const [showPanel, setShowPanel] = useState(false);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonTw size={'xss'} variant="secondary">
					Open
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuLabel>Appearance</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuCheckboxItem
					checked={showStatusBar}
					onCheckedChange={setShowStatusBar}
				>
					Status Bar
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={showActivityBar}
					onCheckedChange={setShowActivityBar}
					disabled
				>
					Activity Bar
				</DropdownMenuCheckboxItem>
				<DropdownMenuCheckboxItem
					checked={showPanel}
					onCheckedChange={setShowPanel}
				>
					Panel
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function RadioGroup() {
	const [position, setPosition] = useState('bottom');

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonTw size={'xss'} variant="secondary">
					Open
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuLabel>Panel Position</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
					<DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
