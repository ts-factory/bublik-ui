/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo, useRef, useState } from 'react';

export type Resolve = (value: boolean | PromiseLike<boolean>) => void;

export interface ConfirmationContext {
	isConfirmationShown: boolean;
	confirmation: () => Promise<boolean>;
	confirm: () => void;
	decline: () => void;
}

export const useConfirm = () => {
	const [isConfirmationShown, setIsShown] = useState(false);

	const promiseRef = useRef<Promise<boolean>>();
	const resolveRef = useRef<Resolve>();

	const confirmation = useCallback(() => {
		promiseRef.current = new Promise(
			(resolve) => (resolveRef.current = resolve)
		);

		setIsShown(true);
		return promiseRef.current;
	}, []);

	const confirm = useCallback(() => {
		setIsShown(false);
		resolveRef.current?.(true);
	}, []);

	const decline = useCallback(() => {
		setIsShown(false);
		resolveRef.current?.(false);
	}, []);

	return useMemo(
		() => ({
			confirm,
			decline,
			confirmation,
			isVisible: isConfirmationShown
		}),
		[confirm, confirmation, decline, isConfirmationShown]
	);
};
