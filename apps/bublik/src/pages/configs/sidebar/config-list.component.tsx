/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { groupBy } from 'remeda';

import { ConfigItem } from '@/services/bublik-api';
import { cn, Separator } from '@/shared/tailwind-ui';
import { upperCaseFirstLetter } from '@/shared/utils';

import { formatTimeV } from '../utils';
import { InactiveBadge } from '../components/badges.component';

interface ConfigListProps {
	versions: ConfigItem[];
	isFetching?: boolean;
	currentConfigId?: number | null;
	onConfigClick?: (id: number) => void;
}

function ConfigList({
	versions,
	currentConfigId,
	isFetching,
	onConfigClick
}: ConfigListProps) {
	const grouped = groupBy(
		versions.toSorted((a) => (a.type === 'global' ? -1 : 1)),
		(config) => config.type
	);

	return (
		<ul
			className={cn('flex flex-col overflow-auto', isFetching && 'opacity-40')}
		>
			{Object.entries(grouped).map(([type, configs], idx, arr) => {
				return (
					<div key={type}>
						<div className="flex items-center gap-2 justify-between pr-2 pl-4 py-1.5">
							<h2 className="text-sm font-semibold">
								{upperCaseFirstLetter(type)}
							</h2>
						</div>
						<Separator />
						{configs.map((config) => (
							<ConfigListItem
								key={config.id}
								config={config}
								isActive={currentConfigId === config.id}
								onClick={onConfigClick}
							/>
						))}
						{idx !== arr.length - 1 ? <Separator /> : null}
					</div>
				);
			})}
		</ul>
	);
}

interface ConfigListItemProps {
	config: ConfigItem;
	isActive?: boolean;
	onClick?: (id: number) => void;
}

function ConfigListItem({ config, isActive, onClick }: ConfigListItemProps) {
	return (
		<li key={config.id} className="min-h-16 flex flex-col">
			<button
				className={cn(
					'hover:bg-primary-wash rounded flex flex-col gap-1 px-2.5 py-2 text-xs w-full h-full flex-1',
					isActive && 'bg-primary-wash'
				)}
				onClick={() => onClick?.(config.id)}
			>
				<div className="flex items-center justify-between gap-2 w-full">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-xs whitespace-nowrap truncate">
							{config.name} {`#${config.version}` ?? ''}
						</span>
						{!config.is_active ? <InactiveBadge /> : null}
					</div>
					<span className="text-slate-500 text-xs whitespace-nowrap">
						{formatTimeV(config.created)}
					</span>
				</div>
				<p className="text-xs w-full text-left flex-1 overflow-wrap-anywhere">
					{config.description}
				</p>
			</button>
		</li>
	);
}

export { ConfigList };
