/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useEffect } from 'react';

type TargetKey = string;
type OnKeypressHandler = () => void;

export const useKeyPress = (
	targetKey: TargetKey,
	callback: OnKeypressHandler,
	deps: ReadonlyArray<unknown> = []
) => {
	const handleKeyPress = (e: KeyboardEvent) => {
		if (e.key !== targetKey) return;

		e.preventDefault();
		callback();
	};

	useEffect(() => {
		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
};
