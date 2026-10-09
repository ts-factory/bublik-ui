/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { getRouteApi } from '@tanstack/react-router';

import { ResetPasswordFormContainer } from '@/bublik/features/auth';

const resetPasswordRoute = getRouteApi(
	'/auth/forgot_password/password_reset/$userId/$resetToken'
);

export const ResetPasswordPage = () => {
	const params = resetPasswordRoute.useParams();

	return <ResetPasswordFormContainer params={params} />;
};
