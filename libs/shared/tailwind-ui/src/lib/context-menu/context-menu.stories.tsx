/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	CheckIcon,
	CropIcon,
	EyeClosedIcon,
	EyeOpenIcon,
	FileIcon,
	FrameIcon,
	GridIcon,
	MixerHorizontalIcon,
	TransparencyGridIcon
} from '@radix-ui/react-icons';
import type { StoryFn, Meta } from '@storybook/react';
import { ReactNode, useState } from 'react';

import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuItemIndicator,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger
} from './context-menu';

interface RadixMenuItem {
	label: string;
	shortcut?: string;
	icon?: ReactNode;
}

const generalMenuItems: RadixMenuItem[] = [
	{
		label: 'New File',
		icon: <FileIcon className="mr-2 h-3.5 w-3.5" />,
		shortcut: '⌘+N'
	},
	{
		label: 'Settings',
		icon: <MixerHorizontalIcon className="mr-2 h-3.5 w-3.5" />,
		shortcut: '⌘+,'
	}
];

const regionToolMenuItems: RadixMenuItem[] = [
	{
		label: 'Frame',
		icon: <FrameIcon className="mr-2 h-3.5 w-3.5" />,
		shortcut: '⌘+F'
	},
	{
		label: 'Crop',
		icon: <CropIcon className="mr-2 h-3.5 w-3.5" />,
		shortcut: '⌘+S'
	}
];

const Story: Meta<typeof ContextMenu> = {
	component: ContextMenu,
	title: 'components/Context Menu'
};
export default Story;

const Template: StoryFn<typeof ContextMenu> = (_args) => {
	const [showGrid, setShowGrid] = useState(false);
	const [showUi, setShowUi] = useState(false);

	return (
		<div>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div>Right Click</div>
				</ContextMenuTrigger>

				<ContextMenuContent>
					{generalMenuItems.map((item, i) => (
						<ContextMenuItem key={`${item.label}-${i}`} {...item} />
					))}

					<ContextMenuSeparator />

					<ContextMenuCheckboxItem
						checked={showGrid}
						onCheckedChange={(state) => {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							if (state !== 'indeterminate') {
								setShowGrid(state);
							}
						}}
					>
						{showGrid ? (
							<GridIcon className="w-4 h-4 mr-2" />
						) : (
							<TransparencyGridIcon className="mr-2 h-3.5 w-3.5 text-gray-700" />
						)}
						<span className="flex-grow text-gray-700">Show Grid</span>
						<ContextMenuItemIndicator>
							<CheckIcon className="h-3.5 w-3.5" />
						</ContextMenuItemIndicator>
					</ContextMenuCheckboxItem>

					<ContextMenuCheckboxItem
						checked={showUi}
						onCheckedChange={(state) => {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							if (state !== 'indeterminate') {
								setShowUi(state);
							}
						}}
					>
						{showUi ? (
							<EyeOpenIcon className="mr-2 h-3.5 w-3.5" />
						) : (
							<EyeClosedIcon className="mr-2 h-3.5 w-3.5" />
						)}
						<span className="flex-grow text-gray-700">Show UI</span>
						<ContextMenuItemIndicator>
							<CheckIcon className="h-3.5 w-3.5" />
						</ContextMenuItemIndicator>
					</ContextMenuCheckboxItem>

					<ContextMenuSeparator className="h-px my-1 bg-gray-200" />

					<ContextMenuLabel label="Region tools" />

					{regionToolMenuItems.map((item, i) => (
						<ContextMenuItem key={`${item.label}-${i}`} {...item} />
					))}
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);
};

export const Primary = {
	render: Template,
	args: {}
};
