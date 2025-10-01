/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { ReactNode } from 'react';

import { bublikAPI, ConfigSchemaParams } from '@/services/bublik-api';
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

interface SidebarHeaderProps {
	configId?: number | null;
	onCreateNewConfigClick?: (params: ConfigSchemaParams) => void;
	createProjectButton?: ReactNode;
	isAdmin?: boolean;
}

function SidebarHeader(props: SidebarHeaderProps) {
	const { onCreateNewConfigClick, configId, createProjectButton, isAdmin } =
		props;
	const { data, isLoading, isError } = bublikAPI.useGetConfigTypesQuery();

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
			{isLoading ? null : (
				<div className="flex items-center gap-2">
					{createProjectButton}
					<DropdownMenu>
						<Tooltip
							content="Login as an admin to create config"
							disabled={isAdmin}
						>
							<DropdownMenuTrigger disabled={isError || !isAdmin} asChild>
								<ButtonTw
									variant="secondary"
									size="xss"
									state={!configId && 'active'}
									className="pointer-events-auto"
								>
									<Icon name="FilePlus" className="size-5 mr-1.5" />
									<span>New Config</span>
								</ButtonTw>
							</DropdownMenuTrigger>
						</Tooltip>
						<DropdownMenuContent sideOffset={8} align="start">
							<DropdownMenuLabel>New Config</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{data?.config_types_names.map((params) => (
								<DropdownMenuItem
									key={`${params.name}_${params.type}`}
									className="pl-2"
									onSelect={() =>
										onCreateNewConfigClick?.({
											name: params.name,
											type: params.type
										})
									}
								>
									<Icon name="AddSymbol" className="size-5 mr-1.5" />
									<span>{params.name ?? params.type}</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</CardHeader>
	);
}

export { SidebarHeader };
