/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo, useRef } from 'react';
import { Path, useMatch, useSearchParams } from 'react-router-dom';

export type UseLastMatchConfig = Pick<Path, 'pathname'> & {
	pattern: Parameters<typeof useMatch>[0];
	hash: string;
};

export const useLastMatch = (config: UseLastMatchConfig) => {
	const match = useMatch(config.pattern);
	const [searchParams] = useSearchParams();
	const previousTo = useRef<Partial<Path> | null>(null);

	const to = useMemo<Partial<Path>>(() => {
		if (!match) {
			return previousTo.current
				? previousTo.current
				: { pathname: config.pathname };
		}

		const to: Partial<Path> = {
			pathname: match.pathname,
			hash: config.hash,
			search: searchParams.toString()
		};

		previousTo.current = to;

		return to;
	}, [config.hash, config.pathname, match, searchParams]);

	const hasMatch = useMemo(() => Boolean(match), [match]);

	return { to, match, hasMatch, searchParams } as const;
};
