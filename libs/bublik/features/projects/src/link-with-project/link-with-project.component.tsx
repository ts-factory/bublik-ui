import { ComponentPropsWithRef, forwardRef, Ref, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useProjectSearch } from '../hooks';
import { PROJECT_KEY } from '../constants';

export type LinkWithProjectProps = ComponentPropsWithRef<typeof Link>;

function getToFromString(
	to: string,
	searchParamsWithProject: URLSearchParams
): string {
	if (to.includes('?')) {
		const split = to.split('?');

		const pathname = split?.[0];
		const searchStr = split?.[1];

		const rawParams = new URLSearchParams(searchStr);
		rawParams.delete(PROJECT_KEY);
		const projectParams = searchParamsWithProject.getAll(PROJECT_KEY);
		projectParams.forEach((id) => rawParams.append(PROJECT_KEY, id));

		return `${pathname}?${rawParams.toString()}`;
	}

	return to;
}

function _LinkWithProject(
	{ to, children, ...props }: LinkWithProjectProps,
	_ref: Ref<'a'>
) {
	const { projectIds } = useProjectSearch();

	const searchParams = useMemo<URLSearchParams>(() => {
		const params =
			typeof to === 'string'
				? new URLSearchParams()
				: new URLSearchParams(to.search);

		params.delete(PROJECT_KEY);

		projectIds.forEach((id) => params.append(PROJECT_KEY, id.toString()));

		return params;
	}, [projectIds, to]);

	const finalTo =
		typeof to === 'string'
			? getToFromString(to, searchParams)
			: { pathname: to.pathname, search: searchParams.toString() };

	return (
		<Link to={finalTo} {...props}>
			{children}
		</Link>
	);
}

const LinkWithProject = forwardRef(_LinkWithProject);

export { LinkWithProject };
