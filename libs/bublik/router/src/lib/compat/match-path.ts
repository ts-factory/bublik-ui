/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */

/** React Router's `PathPattern`. */
interface PathPattern<Path extends string = string> {
	path: Path;
	caseSensitive?: boolean;
	/** Whether the pattern must match the whole pathname (default) or only a prefix. */
	end?: boolean;
}

/** React Router's `PathMatch`. */
interface PathMatch<ParamKey extends string = string> {
	params: Partial<Record<ParamKey, string>>;
	/** The portion of the pathname that was matched. */
	pathname: string;
	/** `pathname` without the splat part, trailing slash trimmed. */
	pathnameBase: string;
	pattern: PathPattern;
}

interface CompiledParam {
	paramName: string;
	isOptional?: boolean;
}

/** React Router 6's `compilePath`, so every pattern in the app matches as it does today. */
function compilePath(
	path: string,
	caseSensitive = false,
	end = true
): [RegExp, CompiledParam[]] {
	const params: CompiledParam[] = [];
	let source =
		'^' +
		path
			// Ignore a trailing `/` and `/*`; the splat is handled below.
			.replace(/\/*\*?$/, '')
			// Make sure it has a leading `/`.
			.replace(/^\/*/, '/')
			// Escape special regexp chars.
			.replace(/[\\.*+^${}|()[\]]/g, '\\$&')
			.replace(/\/:([\w-]+)(\?)?/g, (_, paramName: string, isOptional) => {
				params.push({ paramName, isOptional: isOptional != null });

				return isOptional ? '/?([^\\/]+)?' : '/([^\\/]+)';
			});

	if (path.endsWith('*')) {
		params.push({ paramName: '*' });
		source +=
			path === '*' || path === '/*'
				? '(.*)$' // Already matched the initial `/`, just match the rest.
				: '(?:\\/(.+)|\\/*)$'; // Don't include the `/` in params['*'].
	} else if (end) {
		// When matching to the end, ignore trailing slashes.
		source += '\\/*$';
	} else if (path !== '' && path !== '/') {
		// Match at a segment boundary: `/help` matches `/help/faq`, not `/helpful`.
		source += '(?:(?=\\/|$))';
	}

	return [new RegExp(source, caseSensitive ? undefined : 'i'), params];
}

function safelyDecodePathParam(value: string): string {
	try {
		return value.split('/').map(decodeURIComponent).join('/');
	} catch {
		return value;
	}
}

/**
 * React Router's `matchPath`: a static pattern or `:param`s, `*` for the
 * rest; `end: true` by default, case-insensitive by default, a trailing
 * slash tolerated.
 */
function matchPath<ParamKey extends string = string>(
	pattern: PathPattern | string,
	pathname: string
): PathMatch<ParamKey> | null {
	const resolved: PathPattern =
		typeof pattern === 'string'
			? { path: pattern, caseSensitive: false, end: true }
			: pattern;
	const [matcher, compiledParams] = compilePath(
		resolved.path,
		resolved.caseSensitive,
		resolved.end
	);
	const match = pathname.match(matcher);

	if (!match) return null;

	const matchedPathname = match[0];
	let pathnameBase = matchedPathname.replace(/(.)\/+$/, '$1');
	const captureGroups = match.slice(1);
	const params = compiledParams.reduce<Partial<Record<string, string>>>(
		(memo, { paramName, isOptional }, index) => {
			if (paramName === '*') {
				const splatValue = captureGroups[index] || '';
				pathnameBase = matchedPathname
					.slice(0, matchedPathname.length - splatValue.length)
					.replace(/(.)\/+$/, '$1');
			}

			const value = captureGroups[index];
			memo[paramName] =
				isOptional && !value ? undefined : safelyDecodePathParam(value || '');

			return memo;
		},
		{}
	);

	return {
		params: params as Partial<Record<ParamKey, string>>,
		pathname: matchedPathname,
		pathnameBase,
		pattern: resolved
	};
}

export { matchPath };
export type { PathMatch, PathPattern };
