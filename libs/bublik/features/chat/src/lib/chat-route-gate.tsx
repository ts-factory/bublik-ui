/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { type ReactNode } from 'react';

import { BublikEmptyState } from '@/bublik/features/ui-state';
import { useGetServerFeaturesQuery } from '@/services/bublik-api';
import { Spinner } from '@/shared/tailwind-ui';

interface ChatRouteGateProps {
	children: ReactNode;
}

/**
 * The chat routes are only mounted on the server when AI_CHAT_ENABLED is set,
 * so a direct link to /chat must not render a chat whose requests all fail.
 * Mirrors the analytics page: a spinner until the server features load, then
 * an empty state when the feature is off.
 */
function ChatRouteGate({ children }: ChatRouteGateProps): ReactNode {
	const { data: features, isLoading } = useGetServerFeaturesQuery();

	if (isLoading) {
		return (
			<div className="h-full grid place-items-center">
				<Spinner className="h-16" />
			</div>
		);
	}

	if (!features?.chat_enabled) {
		return (
			<BublikEmptyState
				title="Chat is not enabled on this server"
				description="Ask an admin to set AI_CHAT_ENABLED=True on the Bublik server"
				className="h-full"
				iconName="Chat"
			/>
		);
	}

	return children;
}

export { ChatRouteGate };
export type { ChatRouteGateProps };
