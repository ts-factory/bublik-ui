/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { ChatPage } from '../../../pages/chat-page';

// One route with an optional param replaces the `/chat` and `/chat/:threadId` pair.
export const Route = createFileRoute('/_app/_protected/chat/{-$threadId}')({
	component: ChatPage
});
