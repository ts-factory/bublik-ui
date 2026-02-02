/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useRef } from 'react';
import {
	PathMatch,
	PathPattern,
	matchPath,
	useLocation,
	useSearchParams,
	Location,
	resolvePath
} from 'react-router-dom';
import { NavLinkInternal, MatchPattern } from './sidebar-nav.types';

export type SearchPattern = Record<string, string>;

export type HooksMatchPattern = PathPattern & { search?: SearchPattern };

const toHooksMatchPattern = (
	pattern: MatchPattern | undefined
): HooksMatchPattern | undefined => {
	if (!pattern) return undefined;
	return {
		...pattern,
		path: pattern.path || ''
	} as HooksMatchPattern;
};

const toHooksMatchPatterns = (
	pattern: MatchPattern | MatchPattern[] | undefined
): HooksMatchPattern | HooksMatchPattern[] | undefined => {
	if (!pattern) return undefined;
	if (Array.isArray(pattern)) {
		return pattern.map((p) => toHooksMatchPattern(p)!).filter(Boolean);
	}
	return toHooksMatchPattern(pattern);
};

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
	const hooksPattern = toHooksMatchPatterns(pattern);
	const matches = useMatchPathPattern(hooksPattern);
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
		getNavPathname({ location, pattern: hooksPattern })
	);
	const search = useLast(
		'',
		getNavSearch({ location, searchParams, pattern: hooksPattern })
	);

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
	const hooksPattern = toHooksMatchPatterns(config?.pattern);
	const matches = useMatchPathPattern(hooksPattern);
	const [searchParams] = useSearchParams();

	const isActive = config?.pattern
		? Array.isArray(matches)
			? Boolean(matches.length)
			: Boolean(matches)
		: false;

	const pathname = useLast(
		config?.to?.toString(),
		getNavPathname({ location, pattern: hooksPattern })
	);
	const search = useLast(
		'',
		getNavSearch({ location, searchParams, pattern: hooksPattern })
	);

	return {
		isActive,
		to: { pathname, search }
	};
};

export type UseGetPathnameConfig = {
	location: Location;
	pattern?: HooksMatchPattern | HooksMatchPattern[];
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
	pattern?: HooksMatchPattern | HooksMatchPattern[];
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
