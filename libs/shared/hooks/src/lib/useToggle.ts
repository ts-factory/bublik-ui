/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { MouseEventHandler, useCallback, useState } from 'react';

export const useToggle = (
	initialState = false
): [boolean, MouseEventHandler<HTMLElement>] => {
	const [state, setState] = useState<boolean>(initialState);

	const toggle = useCallback<MouseEventHandler<HTMLElement>>(
		() => setState((state) => !state),
		[]
	);

	return [state, toggle];
};
