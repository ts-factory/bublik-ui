import { ComponentPropsWithRef, forwardRef, Ref, useMemo } from 'react';
import { createPath, Link, parsePath, useSearchParams } from 'react-router-dom';

import { useProjectSearch } from '../hooks';
import { HIDE_SIDEBAR_QUERY_KEY, PROJECT_KEY } from '../constants';

export type LinkWithProjectProps = ComponentPropsWithRef<typeof Link>;

function getToFromString(
	to: string,
	searchParamsWithProject: URLSearchParams
): string {
	const parsedTo = parsePath(to);
	const rawParams = new URLSearchParams(parsedTo.search ?? '');

	rawParams.delete(PROJECT_KEY);

	const projectParams = searchParamsWithProject.getAll(PROJECT_KEY);
	const hideSidebar = searchParamsWithProject.get(HIDE_SIDEBAR_QUERY_KEY);

	projectParams.forEach((id) => rawParams.append(PROJECT_KEY, id));

	if (!rawParams.has(HIDE_SIDEBAR_QUERY_KEY) && hideSidebar) {
		rawParams.set(HIDE_SIDEBAR_QUERY_KEY, hideSidebar);
	}

	const search = rawParams.toString();

	return createPath({
		pathname: parsedTo.pathname,
		search: search ? `?${search}` : '',
		hash: parsedTo.hash
	});
}

function LinkWithProjectImpl(
	{ to, children, ...props }: LinkWithProjectProps,
	ref: Ref<HTMLAnchorElement>
) {
	const { projectIds } = useProjectSearch();
	const [currentSearchParams] = useSearchParams();

	const searchParams = useMemo<URLSearchParams>(() => {
		const params =
			typeof to === 'string'
				? new URLSearchParams()
				: new URLSearchParams(to.search);
		const hideSidebar = currentSearchParams.get(HIDE_SIDEBAR_QUERY_KEY);

		params.delete(PROJECT_KEY);

		projectIds.forEach((id) => params.append(PROJECT_KEY, id.toString()));

		if (!params.has(HIDE_SIDEBAR_QUERY_KEY) && hideSidebar) {
			params.set(HIDE_SIDEBAR_QUERY_KEY, hideSidebar);
		}

		return params;
	}, [currentSearchParams, projectIds, to]);

	const finalTo =
		typeof to === 'string'
			? getToFromString(to, searchParams)
			: {
					pathname: to.pathname,
					search: searchParams.toString() ? `?${searchParams.toString()}` : '',
					hash: to.hash
			  };

	return (
		<Link to={finalTo} {...props} ref={ref}>
			{children}
		</Link>
	);
}

const LinkWithProject = forwardRef(LinkWithProjectImpl);

export { LinkWithProject };
