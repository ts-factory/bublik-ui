/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { McpServer } from '@/shared/types';
import {
	getErrorMessage,
	useUpdateMcpServerMutation
} from '@/services/bublik-api';
import { cn, toast } from '@/shared/tailwind-ui';

export interface ToggleMcpServerContainerProps {
	server: McpServer;
}

/** A disabled server is kept, but left out of the user's chat runs. */
export const ToggleMcpServerContainer = ({
	server
}: ToggleMcpServerContainerProps) => {
	const [updateServer, { isLoading }] = useUpdateMcpServerMutation();

	const handleChange = async (enabled: boolean) => {
		try {
			await updateServer({ id: server.id, body: { enabled } }).unwrap();
		} catch (error: unknown) {
			const { title, description } = getErrorMessage(error);
			toast.error(`${title}: ${description}`);
		}
	};

	return (
		<label className="flex items-center gap-2 text-sm cursor-pointer select-none">
			<SwitchPrimitive.Root
				checked={server.enabled}
				disabled={isLoading}
				onCheckedChange={handleChange}
				aria-label={`${server.enabled ? 'Disable' : 'Enable'} server ${
					server.name
				}`}
				className={cn(
					'w-[26px] h-4 rounded-full relative transition-colors duration-200 ease-in-out',
					'rdx-state-checked:bg-primary rdx-state-unchecked:bg-border-primary',
					'disabled:opacity-50'
				)}
			>
				<SwitchPrimitive.Thumb
					className={cn(
						'block w-3 h-3 bg-primary rounded-full',
						'transition-all translate-x-0.5 will-change-transform',
						'rdx-state-checked:translate-x-3 rdx-state-checked:bg-white'
					)}
				/>
			</SwitchPrimitive.Root>
			<span className={server.enabled ? 'text-text-primary' : 'text-text-menu'}>
				{server.enabled ? 'Enabled' : 'Disabled'}
			</span>
		</label>
	);
};
