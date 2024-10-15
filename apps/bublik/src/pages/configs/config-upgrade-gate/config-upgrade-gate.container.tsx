/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024 OKTET LTD */
import { PropsWithChildren } from 'react';

import { ButtonTw, Skeleton } from '@/shared/tailwind-ui';

import { useShouldMigrateGlobalConfig } from '../hooks';

function ConfigsUpgradeRequiredGate(props: PropsWithChildren) {
	const { shouldMigrate, error, isLoading, migrateGlobalConfig } =
		useShouldMigrateGlobalConfig();

	if (error) {
		return (
			<h1 className="grid place-items-center h-full w-full">
				Failed to fetch global config!
			</h1>
		);
	}

	if (isLoading) {
		return (
			<Skeleton className="rounded-md h-full overflow-hidden w-full m-2" />
		);
	}

	if (shouldMigrate) {
		return (
			<div className="grid place-items-center h-full w-full">
				<div className="rounded-lg border bg-white shadow-sm w-full max-w-md">
					<div className="flex flex-col space-y-1.5 p-6">
						<h3 className="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight">
							Migrate Global Config
						</h3>
						<p className="text-sm text-muted-foreground">
							This action will attempt to migrate the global configuration.
						</p>
					</div>
					<div className="p-6" data-id="5">
						<p className="text-sm text-muted-foreground">
							Migrating the global configuration will update your system
							settings. Please ensure you have a backup before proceeding.
						</p>
					</div>
					<div className="flex items-center w-full p-6">
						<ButtonTw className="w-full" onClick={migrateGlobalConfig}>
							Migrate
						</ButtonTw>
					</div>
				</div>
			</div>
		);
	}

	return props.children;
}

export { ConfigsUpgradeRequiredGate };
