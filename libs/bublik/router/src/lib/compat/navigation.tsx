/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/**
 * React Router 6 shaped hooks and components on the TanStack router, so that
 * page code keeps compiling and writing the same URLs by only changing its
 * import path. Deleted page by page as the pages move to the native APIs.
 */
import {
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	type AnchorHTMLAttributes,
	type ForwardRefExoticComponent,
	type RefAttributes
} from 'react';
import {
	Link as TanStackLink,
	useParams as useTanStackParams,
	useRouter,
	type AnyRouter
} from '@tanstack/react-router';

import {
	currentLocation,
	toRouterLocation,
	useRenderedLocation,
	type Location
} from '../location/location';
import { resolveTo, type To } from '../path/to';

interface NavigateOptions {
	replace?: boolean;
	state?: unknown;
	/** Scroll is never reset by this router; accepted for source compatibility. */
	preventScrollReset?: boolean;
	/** Only `'route'` resolution exists; accepted for source compatibility. */
	relative?: 'route' | 'path';
}

interface NavigateFunction {
	(to: To, options?: NavigateOptions): void;
	(delta: number): void;
}

type URLSearchParamsInit =
	| string
	| Record<string, string | string[]>
	| [string, string][]
	| URLSearchParams;

type SetURLSearchParams = (
	nextInit?:
		| URLSearchParamsInit
		| ((prev: URLSearchParams) => URLSearchParamsInit),
	navigateOpts?: NavigateOptions
) => void;

/** React Router's `createSearchParams`. */
function createSearchParams(init: URLSearchParamsInit = ''): URLSearchParams {
	if (typeof init === 'string' || Array.isArray(init)) {
		return new URLSearchParams(init);
	}

	if (init instanceof URLSearchParams) return new URLSearchParams(init);

	return new URLSearchParams(
		Object.entries(init).flatMap(([key, value]) =>
			Array.isArray(value)
				? value.map((item): [string, string] => [key, item])
				: [[key, value] as [string, string]]
		)
	);
}

function navigateTo(
	router: AnyRouter,
	to: To,
	options: NavigateOptions | undefined
): void {
	const target = resolveTo(to, currentLocation(router).pathname);

	void router.navigate({
		to: target.to,
		search: target.search,
		hash: target.hash,
		replace: options?.replace,
		state: (options?.state ?? undefined) as never,
		// React Router never touched the window scroll on a navigation; the
		// pages scroll their own containers. TanStack would scroll to the top
		// after every write otherwise, `scrollRestoration: false` or not.
		resetScroll: false
	});
}

function useLocation<State = unknown>(): Location<State> {
	const location = useRenderedLocation();

	return useMemo(() => toRouterLocation<State>(location), [location]);
}

function useNavigate(): NavigateFunction {
	const router = useRouter<AnyRouter>();

	return useCallback<NavigateFunction>(
		(to: To | number, options?: NavigateOptions) => {
			if (typeof to === 'number') {
				router.history.go(to);
				return;
			}

			navigateTo(router, to, options);
		},
		[router]
	);
}

/**
 * `useParams()` of React Router: the params of every match, as strings.
 * A key the current route does not declare is simply absent.
 */
function useParams<
	T extends Record<string, string | undefined> = Record<string, string>
>(): Readonly<Partial<T>> {
	// Untyped on purpose: the registered route tree types `useParams` per
	// route, and this shim speaks for every route.
	const useAnyParams = useTanStackParams as (opts: {
		strict: false;
	}) => Record<string, string | undefined>;

	return useAnyParams({ strict: false }) as Readonly<Partial<T>>;
}

/**
 * `useSearchParams()` of React Router: a push navigation to the current
 * pathname with the given search and no hash. The functional form receives
 * the params this render saw, as React Router's did, but as a copy: React
 * Router handed over the rendered instance itself, so a mutating updater
 * also changed what the render held. The URL written is the same.
 */
function useSearchParams(
	// React Router seeded the params with it when the URL had none; no call
	// site relies on that (the one caller passes the current search).
	_defaultInit?: URLSearchParamsInit
): [URLSearchParams, SetURLSearchParams] {
	const router = useRouter<AnyRouter>();
	const { searchStr } = useRenderedLocation();
	const searchParams = useMemo(
		() => new URLSearchParams(searchStr),
		[searchStr]
	);
	const searchParamsRef = useRef(searchParams);
	searchParamsRef.current = searchParams;

	const setSearchParams = useCallback<SetURLSearchParams>(
		(nextInit, navigateOpts) => {
			const next = createSearchParams(
				typeof nextInit === 'function'
					? nextInit(new URLSearchParams(searchParamsRef.current))
					: nextInit
			);

			navigateTo(router, { search: next.toString() }, navigateOpts);
		},
		[router]
	);

	return [searchParams, setSearchParams];
}

interface NavigateProps {
	to: To;
	replace?: boolean;
	state?: unknown;
	relative?: 'route' | 'path';
}

/** React Router's `<Navigate>`: navigates in an effect after mount, and again when `to` changes. */
function Navigate({ to, replace, state }: NavigateProps): null {
	const navigate = useNavigate();
	const toKey = JSON.stringify(to);

	useEffect(() => {
		navigate(JSON.parse(toKey) as To, { replace, state });
		// `state` is compared by identity on purpose, as React Router did.
	}, [navigate, toKey, replace, state]);

	return null;
}

interface LinkProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	to: To;
	replace?: boolean;
	state?: unknown;
	reloadDocument?: boolean;
	/** Scroll is never reset by this router; accepted for source compatibility. */
	preventScrollReset?: boolean;
	/** Only `'route'` resolution exists; accepted for source compatibility. */
	relative?: 'route' | 'path';
}

/** Nothing is added to a link for being active: React Router's `Link` added nothing either. */
const NO_PROPS = {};

/** The TanStack `Link` with the route-tree typing of `to` out of the way: a shim target is any string. */
const AnyLink = TanStackLink as unknown as ForwardRefExoticComponent<
	Record<string, unknown> & RefAttributes<HTMLAnchorElement>
>;

/**
 * React Router's `<Link>`: `to` may carry a query string and a fragment, a
 * search-only target stays on the current pathname. The href is built by the
 * router (basepath included) and the click is a router navigation; modifier
 * clicks and `target="_blank"` are left to the browser.
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
	{
		to,
		replace,
		state,
		reloadDocument,
		preventScrollReset: _preventScrollReset,
		relative: _relative,
		...anchorProps
	},
	ref
) {
	const { pathname } = useRenderedLocation();
	const target = useMemo(() => resolveTo(to, pathname), [to, pathname]);

	return (
		<AnyLink
			ref={ref}
			{...anchorProps}
			to={target.to}
			search={target.search}
			hash={target.hash}
			state={state}
			replace={replace}
			reloadDocument={reloadDocument}
			resetScroll={false}
			activeProps={NO_PROPS}
			inactiveProps={NO_PROPS}
		/>
	);
});

export {
	createSearchParams,
	Link,
	Navigate,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams
};
export type {
	LinkProps,
	NavigateFunction,
	NavigateOptions,
	NavigateProps,
	SetURLSearchParams,
	URLSearchParamsInit
};
