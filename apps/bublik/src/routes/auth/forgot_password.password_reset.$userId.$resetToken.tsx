/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { createFileRoute } from '@tanstack/react-router';

import { ResetPasswordPage } from '../../pages/auth';

export const Route = createFileRoute(
	'/auth/forgot_password/password_reset/$userId/$resetToken'
)({
	component: ResetPasswordPage
});
