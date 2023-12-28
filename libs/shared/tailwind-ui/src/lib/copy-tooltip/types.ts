/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
export interface CopyProps {
	copyString?: string;
	onCopyComplete?: (isSuccess: boolean) => void;
}

export type CopyContentHandle = {
	resetState: () => void;
};
