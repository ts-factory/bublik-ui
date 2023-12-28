/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { LoginFormContainer } from '@/bublik/features/auth';
import { routes } from '@/router';

export const LoginPage = () => {
	return <LoginFormContainer redirectOnSuccessTo={routes.dashboard({})} />;
};
