/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useReducer } from 'react';

export const useForceRerender = () =>
	useReducer(() => ({}), {})[1] as () => void;
