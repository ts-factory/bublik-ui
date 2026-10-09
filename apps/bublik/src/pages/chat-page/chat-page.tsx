/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { getRouteApi } from '@tanstack/react-router';

import { ChatFeature } from '@/bublik/features/chat';
import { useTabTitleWithPrefix } from '@/bublik/features/projects';

const chatRoute = getRouteApi('/_app/_protected/chat/{-$threadId}');

export const ChatPage = () => {
	useTabTitleWithPrefix('Assistant - Bublik');
	// Optional: absent on a bare `/chat`, which the feature turns into a thread address.
	const { threadId } = chatRoute.useParams();

	return <ChatFeature threadId={threadId} />;
};
