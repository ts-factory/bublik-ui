/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ChatFeature } from '@/bublik/features/chat';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

export const ChatPage = () => {
	useTabTitleWithPrefix('Assistant - Bublik');

	return <ChatFeature />;
};
