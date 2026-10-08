/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { EmailActivationPage } from '../../pages/auth';

// Linked with a trailing slash; `trailingSlash: 'preserve'` keeps it on load.
export const Route = createFileRoute('/auth/register/activate/$userId/$token')({
	component: EmailActivationPage
});
