/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { Fragment, useState } from 'react';
import { ConfigVersionResponse } from '@/services/bublik-api';
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	ButtonTw,
	Icon,
	Separator,
	cn
} from '@/shared/tailwind-ui';
import { CurrentBadge } from '../components/badges.component';
import { formatTimeV } from '../utils';

interface ConfigVersionsProps {
	configId: number;
	versions: ConfigVersionResponse['all_config_versions'];
	onVersionClick?: (id: number) => void;
}

function ConfigVersions({
	versions,
	onVersionClick,
	configId
}: ConfigVersionsProps) {
	const [open, setOpen] = useState(false);

	const hasAnother = Boolean(versions.filter((v) => v.id !== configId).length);

	return (
		<Popover onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<ButtonTw
					variant="secondary"
					size="xss"
					disabled={!hasAnother}
					state={open && 'active'}
				>
					<Icon name="Clock" className="size-5 mr-1.5" />
					<span>Versions</span>
				</ButtonTw>
			</PopoverTrigger>
			<PopoverContent
				sideOffset={4}
				align="start"
				className="bg-white py-2 shadow-popover rounded-md flex flex-col max-w-80 text-xs max-h-96"
			>
				<span className="pr-2 pl-4 py-1.5 text-sm font-semibold">Versions</span>
				<Separator />
				<ConfigVersionList
					versions={versions}
					onVersionClick={onVersionClick}
				/>
			</PopoverContent>
		</Popover>
	);
}

interface ConfigVersionListProps {
	versions: ConfigVersionResponse['all_config_versions'];
	onVersionClick?: (id: number) => void;
}

function ConfigVersionList({
	versions,
	onVersionClick
}: ConfigVersionListProps) {
	return (
		<ul className="flex flex-col flex-1 overflow-auto">
			{versions.map((version, idx, arr) => (
				<Fragment key={version.id}>
					<ConfigVersionListItem
						version={version}
						onVersionClick={onVersionClick}
					/>
					{idx !== arr.length - 1 ? <Separator /> : null}
				</Fragment>
			))}
		</ul>
	);
}

interface ConfigVersionListItemProps {
	version: ConfigVersionResponse['all_config_versions'][number];
	onVersionClick?: (id: number) => void;
}

function ConfigVersionListItem({
	version,
	onVersionClick
}: ConfigVersionListItemProps) {
	return (
		<li className="min-h-16 flex flex-col">
			<button
				className={cn(
					'w-full px-4 py-2 flex flex-col gap-2 hover:bg-primary-wash h-full flex-1'
				)}
				onClick={() => onVersionClick?.(version.id)}
			>
				<div className="flex items-center justify-between gap-2 w-full">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-xs">
							Version #{version.version}
						</span>
						{version.is_active ? <CurrentBadge /> : null}
					</div>
					<span className="text-slate-500 text-xs">
						{formatTimeV(version.created)}
					</span>
				</div>
				<p className="text-left w-full flex-1 overflow-wrap-anywhere">
					{version.description}
				</p>
			</button>
		</li>
	);
}

export { ConfigVersions };
