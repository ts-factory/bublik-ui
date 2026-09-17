/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useRef, useState } from 'react';

import { CreateAccessTokenInputs, CreatedAccessToken } from '@/shared/types';
import { useCreateAccessTokenMutation } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

import {
	CreateTokenFormHandle,
	CreateTokenModal
} from './create-token-form.component';

export interface CreateTokenFormContainerProps {
	/** Receives the created token, the only response that carries its value. */
	onCreated: (created: CreatedAccessToken) => void;
}

export const CreateTokenFormContainer = ({
	onCreated
}: CreateTokenFormContainerProps) => {
	const [open, setOpen] = useState(false);
	const [createToken] = useCreateAccessTokenMutation();
	const formRef = useRef<CreateTokenFormHandle>(null);

	const handleCreateToken = async (input: CreateAccessTokenInputs) => {
		const form = formRef.current;
		if (!form) return;

		try {
			const created = await createToken(input).unwrap();

			setOpen(false);
			form.reset();
			onCreated(created);
		} catch (e: unknown) {
			setErrorsOnForm(e, { handle: form });
		}
	};

	return (
		<CreateTokenModal
			open={open}
			onOpenChange={setOpen}
			onSubmit={handleCreateToken}
			ref={formRef}
		/>
	);
};
