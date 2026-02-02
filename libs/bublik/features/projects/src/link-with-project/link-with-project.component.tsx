import { ComponentPropsWithRef, forwardRef, Ref, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { SIDEBAR_PREFIX } from '@/bublik/features/sidebar';

import { useProjectSearch } from '../hooks';
import { PROJECT_KEY } from '../constants';

export type LinkWithProjectProps = ComponentPropsWithRef<typeof Link>;

/**
 * Preserves sidebar state params from current URL into target params.
 * Rules:
 * - Preserve all params starting with `sidebar.`
 * - Don't append if the key already exists in target params (allow explicit overrides)
 * - Add project IDs
 */
function mergeParamsWithSidebarState(
	targetParams: URLSearchParams,
	currentSearchParams: URLSearchParams,
	projectIds: number[]
): URLSearchParams {
	const result = new URLSearchParams(targetParams);

	// Preserve sidebar.* params from current URL (if not already in target)
	// Use getAll() to handle params with multiple values (like sidebar.runs.selected)
	const keysToPreserve: string[] = [];
	currentSearchParams.forEach((_, key) => {
		if (key.startsWith(SIDEBAR_PREFIX + '.') && !keysToPreserve.includes(key)) {
			keysToPreserve.push(key);
		}
	});

	keysToPreserve.forEach((key) => {
		if (!result.has(key)) {
			const values = currentSearchParams.getAll(key);
			values.forEach((value) => result.append(key, value));
		}
	});

	result.delete(PROJECT_KEY);
	projectIds.forEach((id) => result.append(PROJECT_KEY, id.toString()));

	return result;
}

function getToFromString(
	to: string,
	currentSearchParams: URLSearchParams,
	projectIds: number[]
): string {
	if (to.includes('?')) {
		const [pathname, searchStr] = to.split('?');
		const targetParams = new URLSearchParams(searchStr);

		const mergedParams = mergeParamsWithSidebarState(
			targetParams,
			currentSearchParams,
			projectIds
		);

		return `${pathname}?${mergedParams.toString()}`;
	}

	const mergedParams = mergeParamsWithSidebarState(
		new URLSearchParams(),
		currentSearchParams,
		projectIds
	);

	const paramsString = mergedParams.toString();
	return paramsString ? `${to}?${paramsString}` : to;
}

function LinkWithProjectImpl(
	{ to, children, ...props }: LinkWithProjectProps,
	ref: Ref<HTMLAnchorElement>
) {
	const { projectIds } = useProjectSearch();
	const [currentSearchParams] = useSearchParams();

	const finalTo = useMemo(() => {
		if (typeof to === 'string') {
			return getToFromString(to, currentSearchParams, projectIds);
		}

		const targetParams = new URLSearchParams(to.search || '');
		const mergedParams = mergeParamsWithSidebarState(
			targetParams,
			currentSearchParams,
			projectIds
		);

		return {
			pathname: to.pathname,
			search: mergedParams.toString(),
			hash: to.hash
		};
	}, [to, currentSearchParams, projectIds]);

	return (
		<Link to={finalTo} {...props} ref={ref}>
			{children}
		</Link>
	);
}

const LinkWithProject = forwardRef(LinkWithProjectImpl);

export { LinkWithProject };
