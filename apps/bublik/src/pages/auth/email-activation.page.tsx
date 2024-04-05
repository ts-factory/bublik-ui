/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useNavigate, useParams } from 'react-router-dom';

import { useMount } from '@/shared/hooks';
import { VerifyEmailSchemaInputs } from '@/shared/types';
import { useAuth } from '@/bublik/features/auth';
import { toast } from '@/shared/tailwind-ui';

export const EmailActivationPage = () => {
	const { verifyEmail } = useAuth();
	const params = useParams();
	const navigate = useNavigate();

	useMount(async () => {
		try {
			const inputs = VerifyEmailSchemaInputs.parse(params);

			await verifyEmail(inputs).unwrap();
			toast.success('The email is verified. You are registered.');
			navigate('/auth/login');
		} catch (e) {
			toast.error('Failed to verify email!');
		}
	});

	return <h1 className="text-2xl">Email verification in progress...</h1>;
};
