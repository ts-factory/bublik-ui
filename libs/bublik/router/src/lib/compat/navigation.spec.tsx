/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Outlet } from '@tanstack/react-router';
import {
	Tooltip,
	TooltipProvider,
	TooltipTrigger
} from '@radix-ui/react-tooltip';

import {
	holdSlowRoute,
	hrefOf,
	slowPageRenders,
	renderAt,
	renderHookAt,
	write
} from '../../test/compat-router';
import {
	Link,
	Navigate,
	useLatestLocation,
	useLocation,
	useNavigate,
	useParams,
	useSearchParams,
	type NavigateFunction
} from './navigation';

describe('useSearchParams (react-router-dom shape)', () => {
	it('reads the current query string as URLSearchParams', async () => {
		const { result } = await renderHookAt(
			'/runs?page=2&project=1&project=2',
			() => useSearchParams()[0]
		);

		expect(result.current.get('page')).toBe('2');
		expect(result.current.getAll('project')).toEqual(['1', '2']);
	});

	it('setSearchParams(params) replaces the whole search and pushes an entry', async () => {
		const { router, result } = await renderHookAt('/runs?page=2&_s=abc', () =>
			useSearchParams()
		);

		await write(() =>
			result.current[1](new URLSearchParams({ mode: 'charts', tv: '0' }))
		);

		expect(hrefOf(router)).toBe('/v2/runs?mode=charts&tv=0');
		expect(router.history.length).toBe(2);
	});

	it('{ replace: true } replaces the entry', async () => {
		const { router, result } = await renderHookAt('/runs?page=2', () =>
			useSearchParams()
		);

		await write(() =>
			result.current[1](new URLSearchParams({ page: '3' }), { replace: true })
		);

		expect(hrefOf(router)).toBe('/v2/runs?page=3');
		expect(router.history.length).toBe(1);
	});

	it('a functional update receives a copy of the current params', async () => {
		const { router, result } = await renderHookAt(
			'/log/1?focusId=3&lineNumber=l_7&page=2',
			() => useSearchParams()
		);

		await write(() =>
			result.current[1]((params) => {
				params.delete('lineNumber');
				params.set('focusId', '9');
				return params;
			})
		);

		expect(hrefOf(router)).toBe('/v2/log/1?focusId=9&page=2');
	});

	it('keeps the pathname as it is, trailing slash included, and drops the hash as React Router did', async () => {
		const { router, result } = await renderHookAt(
			'/runs/1/report/?config=2#anchor',
			() => useSearchParams()
		);

		await write(() =>
			result.current[1](new URLSearchParams({ config: '2', isFullMode: '0' }))
		);

		expect(hrefOf(router)).toBe('/v2/runs/1/report/?config=2&isFullMode=0');
	});

	it('accepts the other URLSearchParamsInit shapes', async () => {
		const { router, result } = await renderHookAt('/runs', () =>
			useSearchParams()
		);

		await write(() => result.current[1]({ a: '1', b: ['x', 'y'] }));
		expect(hrefOf(router)).toBe('/v2/runs?a=1&b=x&b=y');

		await write(() => result.current[1]('c=3'));
		expect(hrefOf(router)).toBe('/v2/runs?c=3');

		await write(() => result.current[1]([['d', '4']]));
		expect(hrefOf(router)).toBe('/v2/runs?d=4');
	});
});

describe('useLocation (react-router-dom shape)', () => {
	it('exposes pathname without the basepath, search with ?, hash with #, and the state', async () => {
		const { result } = await renderHookAt('/runs/1?page=2#top', () =>
			useLocation()
		);

		expect(result.current.pathname).toBe('/runs/1');
		expect(result.current.search).toBe('?page=2');
		expect(result.current.hash).toBe('#top');
		expect(typeof result.current.key).toBe('string');
	});

	it('has an empty search and hash when there are none, and is stable between renders', async () => {
		const { result, rerender } = await renderHookAt('/runs', () =>
			useLocation()
		);
		const first = result.current;

		rerender();

		expect(first.search).toBe('');
		expect(first.hash).toBe('');
		expect(result.current).toBe(first);
	});
});

describe('the location the shims read is the rendered one, as React Router had it', () => {
	it('keeps the current page on its own location while the next one is still loading', async () => {
		const release = holdSlowRoute();
		const { router, result } = await renderHookAt('/runs?page=2', () => ({
			location: useLocation(),
			search: useSearchParams()[0].toString(),
			navigate: useNavigate()
		}));

		await write(() => result.current.navigate('/slow?x=1'));

		// The navigation is under way (the history already moved), but the
		// page still rendered must not see the next page's address.
		expect(hrefOf(router)).toBe('/v2/slow?x=1');
		expect(result.current.location.pathname).toBe('/runs');
		expect(result.current.location.search).toBe('?page=2');
		expect(result.current.search).toBe('page=2');

		await write(() => release());
	});

	it('a page mounted by a navigation sees its own location and state on its first render', async () => {
		const release = holdSlowRoute();
		slowPageRenders.length = 0;
		await renderAt('/runs', <NavigateProbe />);

		await write(() =>
			navigateRef.current?.('/slow', { state: { fromRun: true } })
		);
		await write(() => release());

		expect(slowPageRenders[0]).toMatchObject({
			pathname: '/slow',
			state: { fromRun: true }
		});
	});

	it('follows an in-page search write as soon as it is committed', async () => {
		const { result } = await renderHookAt('/runs?page=2', () => ({
			location: useLocation(),
			setSearchParams: useSearchParams()[1]
		}));

		await write(() =>
			result.current.setSearchParams(new URLSearchParams({ page: '3' }))
		);

		expect(result.current.location.search).toBe('?page=3');
	});
});

describe('useParams (react-router-dom shape)', () => {
	it('returns the path params of the current match', async () => {
		const { result } = await renderHookAt('/runs/42/report', () =>
			useParams<{ runId: string }>()
		);

		expect(result.current).toEqual({ runId: '42' });
	});

	it('returns an empty object on a route without params', async () => {
		const { result } = await renderHookAt('/runs', () => useParams());

		expect(result.current).toEqual({});
	});
});

describe('useNavigate (react-router-dom shape)', () => {
	it('navigates to a string with embedded search and hash, pushing an entry', async () => {
		const { router, result } = await renderHookAt('/dashboard', () =>
			useNavigate()
		);

		await write(() => result.current('/runs?page=2&tv=0#x'));

		expect(hrefOf(router)).toBe('/v2/runs?page=2&tv=0#x');
		expect(router.history.length).toBe(2);
	});

	it('navigates to a { pathname, search, hash } object with or without the ? and # prefixes', async () => {
		const { router, result } = await renderHookAt('/dashboard', () =>
			useNavigate()
		);

		await write(() =>
			result.current({ pathname: '/compare', search: 'left=1&right=2' })
		);
		expect(hrefOf(router)).toBe('/v2/compare?left=1&right=2');

		await write(() =>
			result.current({
				pathname: '/issues',
				search: '?project=1',
				hash: '#top'
			})
		);
		expect(hrefOf(router)).toBe('/v2/issues?project=1#top');
	});

	it('a search-only target keeps the current pathname and drops the hash', async () => {
		const { router, result } = await renderHookAt(
			'/runs/1/report/?config=2#anchor',
			() => useNavigate()
		);

		await write(() => result.current({ search: 'config=2&x=1' }));

		expect(hrefOf(router)).toBe('/v2/runs/1/report/?config=2&x=1');
	});

	it('{ replace, state } replace the entry and carry the state', async () => {
		const { router, result } = await renderHookAt('/runs', () => ({
			navigate: useNavigate(),
			location: useLocation()
		}));

		await write(() =>
			result.current.navigate('/runs/1', {
				replace: true,
				state: { openUnexpected: true }
			})
		);

		expect(hrefOf(router)).toBe('/v2/runs/1');
		expect(router.history.length).toBe(1);
		expect(result.current.location.state).toMatchObject({
			openUnexpected: true
		});
	});

	it('navigate(-1) goes back', async () => {
		const { router, result } = await renderHookAt(['/dashboard', '/runs'], () =>
			useNavigate()
		);

		await write(() => result.current(-1));

		expect(hrefOf(router)).toBe('/v2/dashboard');
	});

	it('is stable between renders', async () => {
		const { result, rerender } = await renderHookAt('/runs', () =>
			useNavigate()
		);
		const first = result.current;

		rerender();

		expect(result.current).toBe(first);
	});
});

describe('useLatestLocation', () => {
	it('returns the location of a navigation committed earlier in the same tick', async () => {
		const { router, result } = await renderHookAt('/runs?page=1', () => ({
			navigate: useNavigate(),
			latest: useLatestLocation(),
			location: useLocation()
		}));

		await write(() => {
			result.current.navigate({ search: 'page=1&_s=abc' }, { replace: true });

			// The render-time location and the window still say page=1 here;
			// the router already holds the write.
			expect(result.current.location.search).toBe('?page=1');
			expect(result.current.latest().search).toBe('?page=1&_s=abc');

			result.current.navigate(
				{ search: `${result.current.latest().search.slice(1)}&mode=charts` },
				{ replace: true }
			);
		});

		expect(hrefOf(router)).toBe('/v2/runs?page=1&_s=abc&mode=charts');
		expect(router.history.length).toBe(1);
	});

	it('a write built on it while the next page loads lands on that page instead of hijacking it', async () => {
		const release = holdSlowRoute();
		const { router, result } = await renderHookAt('/runs?page=2', () => ({
			navigate: useNavigate(),
			latest: useLatestLocation()
		}));

		await write(() => result.current.navigate('/slow?x=1#top'));

		const latest = result.current.latest();
		expect(latest.pathname).toBe('/slow');
		expect(latest.search).toBe('?x=1');
		expect(latest.hash).toBe('#top');

		// What the sidebar writer does from the page that is still rendered.
		await write(() =>
			result.current.navigate(
				{
					pathname: latest.pathname,
					search: `${latest.search}&_s=abc`,
					hash: latest.hash
				},
				{ replace: true, state: latest.state }
			)
		);
		await write(() => release());

		expect(hrefOf(router)).toBe('/v2/slow?x=1&_s=abc#top');
	});
});

describe('Navigate (react-router-dom shape)', () => {
	it('redirects on mount, replacing the entry when asked', async () => {
		const { router } = await renderAt(
			'/dashboard?dates=abc',
			<Navigate
				to={{ pathname: '/dashboard', search: 'main=2024-01-01' }}
				replace
			/>
		);

		await act(async () => undefined);

		expect(hrefOf(router)).toBe('/v2/dashboard?main=2024-01-01');
		expect(router.history.length).toBe(1);
	});

	it('pushes by default', async () => {
		const { router } = await renderAt(
			'/log/1?mode=log',
			<Navigate to={{ search: 'mode=log&legacy=true' }} />
		);

		await act(async () => undefined);

		expect(hrefOf(router)).toBe('/v2/log/1?mode=log&legacy=true');
		expect(router.history.length).toBe(2);
	});
});

describe('Link (react-router-dom shape)', () => {
	it('renders an href under the basepath with the search bytes as given', async () => {
		await renderAt(
			'/dashboard',
			<Link to="/runs?page=2&tv=0&globalRequirements=a&globalRequirements=b#x">
				runs
			</Link>
		);

		expect(
			screen.getByRole('link', { name: 'runs' }).getAttribute('href')
		).toBe('/v2/runs?page=2&tv=0&globalRequirements=a&globalRequirements=b#x');
	});

	it('accepts a { pathname, search, hash } object', async () => {
		await renderAt(
			'/dashboard',
			<Link to={{ pathname: '/issues/5', search: '?project=1', hash: '#h' }}>
				issue
			</Link>
		);

		expect(
			screen.getByRole('link', { name: 'issue' }).getAttribute('href')
		).toBe('/v2/issues/5?project=1#h');
	});

	it('navigates on click with state and replace, and keeps other anchor props', async () => {
		const { router, result } = await (async () => {
			const rendered = await renderAt(
				'/runs',
				<>
					<Link
						to="/runs/7"
						state={{ fromRun: true }}
						replace
						className="x"
						data-testid="l"
					>
						run
					</Link>
					<LocationProbe />
				</>
			);
			return { router: rendered.router, result: rendered };
		})();

		const link = screen.getByTestId('l');
		expect(link.getAttribute('href')).toBe('/v2/runs/7');
		expect(link.className).toBe('x');

		await act(async () => {
			fireEvent.click(link, { button: 0 });
		});

		expect(hrefOf(router)).toBe('/v2/runs/7');
		expect(router.history.length).toBe(1);
		expect(result.getByTestId('state').textContent).toBe('fromRun');
	});

	it('does not add the active class on the current page', async () => {
		await renderAt('/runs', <Link to="/runs">runs</Link>);

		expect(screen.getByRole('link', { name: 'runs' }).className).toBe('');
	});

	it('leaves target="_blank" links to the browser', async () => {
		const { router } = await renderAt(
			'/runs',
			<Link to="/log/1" target="_blank">
				log
			</Link>
		);

		await act(async () => {
			fireEvent.click(screen.getByRole('link', { name: 'log' }), { button: 0 });
		});

		expect(hrefOf(router)).toBe('/v2/runs');
	});
});

function LocationProbe() {
	const location = useLocation();
	const state = location.state as { fromRun?: boolean } | null;

	return <span data-testid="state">{state?.fromRun ? 'fromRun' : ''}</span>;
}

describe('Link inside a Radix asChild trigger', () => {
	it('mounts without re-render loops when the trigger composes a state-setter ref', async () => {
		const errors: unknown[] = [];
		const onError = (event: ErrorEvent) => {
			errors.push(event.error);
			event.preventDefault();
		};
		window.addEventListener('error', onError);

		await renderAt(
			'/runs',
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Link to="/dashboard">dashboard</Link>
					</TooltipTrigger>
				</Tooltip>
			</TooltipProvider>
		);

		window.removeEventListener('error', onError);

		expect(errors).toEqual([]);
		expect(
			screen.getByRole('link', { name: 'dashboard' }).getAttribute('href')
		).toBe('/v2/dashboard');
	});
});

const navigateRef: { current: NavigateFunction | null } = { current: null };

/** Hands the test a `navigate` from inside the router, and renders the matches. */
function NavigateProbe() {
	navigateRef.current = useNavigate();

	return <Outlet />;
}
