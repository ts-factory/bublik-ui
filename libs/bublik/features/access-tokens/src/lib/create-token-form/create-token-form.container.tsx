/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET Labs Ltd. */
import { useRef, useState } from 'react';

import { CreateAccessTokenInputs } from '@/shared/types';
import { useCreateAccessTokenMutation } from '@/services/bublik-api';
import { setErrorsOnForm } from '@/shared/utils';

import { TokenCreatedDialog } from '../token-created-dialog';

import {
	CreateTokenFormHandle,
	CreateTokenModal
} from './create-token-form.component';

export const CreateTokenFormContainer = () => {
	const [open, setOpen] = useState(false);
	/*
	 * Component state only, and cleared on close. The value never goes into the
	 * RTK Query cache, a query param or localStorage -- it is unrecoverable, so
	 * the fewer places it lands the better.
	 */
	const [createdToken, setCreatedToken] = useState<string | null>(null);
	const [createToken] = useCreateAccessTokenMutation();
	const formRef = useRef<CreateTokenFormHandle>(null);

	const handleCreateToken = async (input: CreateAccessTokenInputs) => {
		const form = formRef.current;
		if (!form) return;

		try {
			const created = await createToken(input).unwrap();

			setOpen(false);
			form.reset();
			setCreatedToken(created.token);
		} catch (e: unknown) {
			setErrorsOnForm(e, { handle: form });
		}
	};

	return (
		<>
			<CreateTokenModal
				open={open}
				onOpenChange={setOpen}
				onSubmit={handleCreateToken}
				ref={formRef}
			/>
			<TokenCreatedDialog
				token={createdToken}
				onClose={() => setCreatedToken(null)}
			/>
		</>
	);
};
