/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ConfigSchemaParams } from '@/services/bublik-api';
import {
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	DropdownMenu,
	DropdownMenuSeparator,
	Icon,
	Tooltip,
	CardHeader,
	ButtonTw
} from '@/shared/tailwind-ui';

const AVAILABLE_CONFIG_TYPES: ConfigSchemaParams[] = [
	{ name: 'per_conf', type: 'global' },
	{ name: 'report', type: 'report' },
	{ name: 'references', type: 'global' },
	{ name: 'meta', type: 'global' },
	{ name: 'tags', type: 'global' }
];

interface SidebarHeaderProps {
	configId?: number | null;
	onCreateNewConfigClick?: (params: ConfigSchemaParams) => void;
}

function SidebarHeader(props: SidebarHeaderProps) {
	const { onCreateNewConfigClick, configId } = props;

	return (
		<CardHeader
			label={
				<div className="flex items-center gap-2">
					<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
						Configs
					</span>
				</div>
			}
		>
			<div className="flex items-center gap-4">
				<DropdownMenu>
					<Tooltip content="Create New Config">
						<DropdownMenuTrigger asChild>
							<ButtonTw
								variant="secondary"
								size="xss"
								state={!configId && 'active'}
							>
								<Icon name="FilePlus" className="size-5 mr-1.5" />
								<span>New</span>
							</ButtonTw>
						</DropdownMenuTrigger>
					</Tooltip>
					<DropdownMenuContent sideOffset={8} align="start">
						<DropdownMenuLabel>New Config</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{AVAILABLE_CONFIG_TYPES.filter((params) => 'name' in params).map(
							(params) => (
								<DropdownMenuItem
									className="pl-2"
									onSelect={() => onCreateNewConfigClick?.(params)}
								>
									<Icon name="AddSymbol" className="size-5 mr-1.5" />
									<span>{params.name}</span>
								</DropdownMenuItem>
							)
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</CardHeader>
	);
}

export { SidebarHeader };
