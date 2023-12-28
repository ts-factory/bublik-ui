/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import {
	AdminCreateUserInputs,
	AdminDeleteUserInputs,
	AdminUpdateUserInputs
} from '@/shared/types';

export type UsersTableMeta = {
	updateUser?: (input: AdminUpdateUserInputs) => void;
	createUser?: (input: AdminCreateUserInputs) => void;
	deleteUser?: (input: AdminDeleteUserInputs) => void;
};
