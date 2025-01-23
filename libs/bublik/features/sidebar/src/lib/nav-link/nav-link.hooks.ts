/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useRef } from 'react';
import {
	PathMatch,
	PathPattern,
	matchPath,
	useLocation,
	useSearchParams,
	Location,
	Path,
	resolvePath,
	NavLinkProps
} from 'react-router-dom';
import { AccordionLinkProps, NavLinkInternal } from './nav-link';

export type SearchPattern = Record<string, string>;

export type MatchPattern = PathPattern & { search?: SearchPattern };

export const matchMultiple = <T extends PathPattern>(
	location: Location,
	pattern?: T | T[]
) => {
	const maybeMatch = pattern
		? Array.isArray(pattern)
			? pattern
					.map((pattern) => matchPath(pattern, location.pathname))
					.filter((match): match is PathMatch<string> => Boolean(match))
			: matchPath(pattern, location.pathname)
		: null;

	if (Array.isArray(maybeMatch) && maybeMatch.length === 0) return null;

	return maybeMatch;
};

export const useMatchPathPattern = <T extends PathPattern>(
	pattern?: T | T[]
) => {
	const location = useLocation();

	return matchMultiple(location, pattern);
};

export const useMatchSearchPattern = <T extends { search?: SearchPattern }>(
	config?: T | T[]
) => {
	const [searchParams] = useSearchParams();

	if (!config) return true;

	if (Array.isArray(config)) {
		return config.some(({ search }) =>
			Object.entries(search || {}).every(
				([key, value]) => searchParams.get(key) === value
			)
		);
	}

	if (!config.search) return true;

	return Object.entries(config.search).every(
		([key, value]) => searchParams.get(key) === value
	);
};

export type UseAccordionLinkConfig = Omit<NavLinkInternal, 'icon' | 'label'>;

export const useAccordionLink = (
	config: UseAccordionLinkConfig = {
		to: '',
		pattern: undefined
	}
) => {
	const { pattern, to } = config;

	const location = useLocation();
	const matches = useMatchPathPattern(pattern);
	const searchMatches = useMatchSearchPattern(pattern);
	const [searchParams] = useSearchParams();

	const pathMatch = pattern
		? Array.isArray(matches)
			? Boolean(matches.length)
			: Boolean(matches)
		: false;

	const isActive = searchMatches && pathMatch;

	const pathname = useLast(
		to.toString(),
		getNavPathname({ location, pattern })
	);
	const search = useLast('', getNavSearch({ location, searchParams, pattern }));

	return {
		isActive,
		isPathMatch: pathMatch,
		isSearchMatch: searchMatches,
		to: { pathname, search }
	};
};

export type UseNavLinkConfig = Omit<NavLinkInternal, 'icon' | 'label'>;

export const useNavLink = (
	config: UseNavLinkConfig = {
		to: '',
		pattern: undefined
	}
) => {
	const location = useLocation();
	const matches = useMatchPathPattern(config?.pattern);
	const [searchParams] = useSearchParams();

	const isActive = config?.pattern
		? Array.isArray(matches)
			? Boolean(matches.length)
			: Boolean(matches)
		: false;

	const pathname = useLast(
		config?.to?.toString(),
		getNavPathname({ location, pattern: config?.pattern })
	);
	const search = useLast(
		'',
		getNavSearch({ location, searchParams, pattern: config?.pattern })
	);

	return {
		isActive,
		to: { pathname, search }
	};
};

export type UseGetPathnameConfig = {
	location: Location;
	pattern?: MatchPattern | MatchPattern[];
};

const getNavPathname = (config: UseGetPathnameConfig): string | null => {
	const { pattern, location } = config;

	const matches = matchMultiple(location, pattern);

	if (!matches) return null;

	if (Array.isArray(pattern) && pattern.length > 1) return null;

	if (!Array.isArray(matches)) return matches.pathname;

	return matches.length > 0 ? matches[0].pathname : null;
};

export type UseGetNavSearchConfig = {
	location: Location;
	searchParams: URLSearchParams;
	pattern?: MatchPattern | MatchPattern[];
};

const getNavSearch = (config: UseGetNavSearchConfig): string | null => {
	const { pattern, location, searchParams } = config;

	const matches = matchMultiple(location, pattern);
	const resolved = resolvePath(location);

	if (!matches) return null;

	if (Array.isArray(pattern) && pattern.length > 1) {
		if (!Array.isArray(matches)) {
			return null;
		}

		if (pattern?.[0].path.startsWith(resolved.pathname)) {
			return searchParams.toString();
		}

		return null;
	}

	if (!Array.isArray(matches)) {
		if (!Array.isArray(pattern) && pattern?.search) {
			const params = new URLSearchParams(searchParams);

			Object.entries(pattern.search).forEach(([key, value]) =>
				params.set(key, value)
			);

			return params.toString();
		}

		return searchParams.toString();
	}

	return matches.length > 0 && matches[0].pathname.startsWith(resolved.pathname)
		? searchParams.toString()
		: null;
};

const useLast = <T>(initial: NonNullable<T>, value?: T) => {
	const ref = useRef<NonNullable<T>>(value || initial);

	if (!value) return ref.current;

	ref.current = value;

	return ref.current;
};
